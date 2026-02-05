# app/llm/providers/fallback.py
"""
Fallback chain orchestrator for LLM providers.

Provides resilient LLM access by trying multiple providers in sequence
until one succeeds, with configurable retry logic.
"""

from typing import List, AsyncIterator, Optional
import asyncio

from app.llm.providers.base import (
    BaseLLMProvider,
    Message,
    LLMResponse,
    GenerationConfig,
)
from app.llm.exceptions import AllProvidersFailedError, RateLimitError
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class FallbackChain(BaseLLMProvider):
    """
    Orchestrates multiple LLM providers with fallback support.
    
    Tries each provider in order until one succeeds. If all providers
    fail, raises AllProvidersFailedError with details of each failure.
    
    Example:
        chain = FallbackChain([
            GeminiProvider(api_key, model="gemini-2.0-flash"),
            GeminiProvider(api_key, model="gemini-1.5-flash"),
        ])
        response = await chain.generate(messages)
    """
    
    def __init__(
        self,
        providers: List[BaseLLMProvider],
        max_retries: int = 1,
        retry_delay: float = 1.0,
    ):
        """
        Initialize the fallback chain.
        
        Args:
            providers: List of providers in priority order
            max_retries: Retries per provider before moving to next
            retry_delay: Delay between retries in seconds
        
        Raises:
            ValueError: If no providers are given
        """
        if not providers:
            raise ValueError("At least one provider is required for fallback chain")
        
        self._providers = providers
        self._max_retries = max_retries
        self._retry_delay = retry_delay
        
        logger.info(
            f"FallbackChain initialized with {len(providers)} providers: "
            f"{[str(p) for p in providers]}"
        )
    
    @property
    def provider_name(self) -> str:
        """Return the chain name."""
        return "fallback_chain"
    
    @property
    def model_name(self) -> str:
        """Return the primary model name."""
        return self._providers[0].model_name if self._providers else "unknown"
    
    @property
    def providers(self) -> List[BaseLLMProvider]:
        """Get all providers in the chain."""
        return self._providers
    
    def is_available(self) -> bool:
        """Check if any provider in the chain is available."""
        return any(p.is_available() for p in self._providers)
    
    async def generate(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None,
    ) -> LLMResponse:
        """
        Generate a response, falling back through providers on failure.
        
        Args:
            messages: Conversation messages
            system_prompt: Optional system prompt
            config: Optional generation config
        
        Returns:
            LLMResponse from the first successful provider
        
        Raises:
            AllProvidersFailedError: If all providers fail
        """
        errors: List[tuple] = []
        
        for i, provider in enumerate(self._providers):
            if not provider.is_available():
                logger.debug(f"Provider {i + 1} ({provider}) not available, skipping")
                errors.append((str(provider), "Provider not available"))
                continue
            
            for attempt in range(self._max_retries + 1):
                try:
                    logger.debug(
                        f"Attempting generation with provider {i + 1} ({provider}), "
                        f"attempt {attempt + 1}/{self._max_retries + 1}"
                    )
                    
                    response = await provider.generate(
                        messages=messages,
                        system_prompt=system_prompt,
                        config=config,
                    )
                    
                    logger.info(f"Generation successful with {provider}")
                    return response
                    
                except RateLimitError as e:
                    logger.warning(f"Rate limit hit for {provider}, moving to next provider")
                    errors.append((str(provider), f"Rate limited: {e.message}"))
                    break  # Don't retry rate limits, move to next provider
                    
                except Exception as e:
                    error_msg = str(e)
                    logger.warning(
                        f"Provider {provider} failed (attempt {attempt + 1}): {error_msg}"
                    )
                    
                    if attempt < self._max_retries:
                        logger.debug(f"Retrying in {self._retry_delay}s...")
                        await asyncio.sleep(self._retry_delay)
                    else:
                        errors.append((str(provider), error_msg))
        
        # All providers failed
        logger.error(f"All {len(self._providers)} providers failed")
        raise AllProvidersFailedError(
            message=f"All {len(self._providers)} LLM providers failed",
            errors=errors
        )
    
    async def stream(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None,
    ) -> AsyncIterator[str]:
        """
        Stream a response, falling back through providers on failure.
        
        Note: Streaming fallback only occurs before the first token.
        Once streaming starts from a provider, we commit to that provider.
        
        Args:
            messages: Conversation messages
            system_prompt: Optional system prompt
            config: Optional generation config
        
        Yields:
            String tokens from the first successful provider
        
        Raises:
            AllProvidersFailedError: If all providers fail to start streaming
        """
        errors: List[tuple] = []
        
        for i, provider in enumerate(self._providers):
            if not provider.is_available():
                errors.append((str(provider), "Provider not available"))
                continue
            
            try:
                logger.debug(f"Attempting streaming with provider {i + 1} ({provider})")
                
                async for token in provider.stream(
                    messages=messages,
                    system_prompt=system_prompt,
                    config=config,
                ):
                    yield token
                
                # If we get here, streaming completed successfully
                logger.info(f"Streaming completed with {provider}")
                return
                
            except RateLimitError as e:
                logger.warning(f"Rate limit hit for {provider} during streaming")
                errors.append((str(provider), f"Rate limited: {e.message}"))
                
            except Exception as e:
                logger.warning(f"Provider {provider} streaming failed: {str(e)}")
                errors.append((str(provider), str(e)))
        
        # All providers failed
        raise AllProvidersFailedError(
            message=f"All {len(self._providers)} LLM providers failed for streaming",
            errors=errors
        )
    
    def get_available_providers(self) -> List[BaseLLMProvider]:
        """Get list of currently available providers."""
        return [p for p in self._providers if p.is_available()]
    
    def __str__(self) -> str:
        """String representation."""
        provider_strs = [str(p) for p in self._providers]
        return f"FallbackChain[{' -> '.join(provider_strs)}]"
