# app/llm/providers/gemini.py
"""
Google Gemini LLM provider implementation.

Supports both Google AI Studio (API key) and Vertex AI authentication.
Implements the BaseLLMProvider interface for use in the fallback chain.
"""

from typing import AsyncIterator, Optional, List
import asyncio

from app.llm.providers.base import (
    BaseLLMProvider,
    Message,
    LLMResponse,
    GenerationConfig,
)
from app.llm.exceptions import LLMProviderError, ContentFilteredError, RateLimitError
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini LLM provider.
    
    Supports Gemini models via Google AI Studio API.
    
    Example:
        provider = GeminiProvider(
            api_key="your-api-key",
            model="gemini-2.0-flash",
        )
        response = await provider.generate(messages)
    """
    
    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        timeout: int = 30,
    ):
        """
        Initialize the Gemini provider.
        
        Args:
            api_key: Google AI Studio API key
            model: Model identifier (e.g., "gemini-2.0-flash", "gemini-1.5-flash")
            temperature: Default sampling temperature
            max_tokens: Default maximum tokens to generate
            timeout: Request timeout in seconds
        """
        self._api_key = api_key
        self._model_name = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._timeout = timeout
        self._client = None
        self._available = False
        
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the Gemini client."""
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=self._api_key)
            self._client = genai.GenerativeModel(
                self._model_name,
                system_instruction=None,  # Will be set per-request
            )
            self._genai = genai
            self._available = True
            logger.info(f"Gemini provider initialized with model: {self._model_name}")
            
        except ImportError:
            logger.error("google-generativeai package not installed")
            self._available = False
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self._available = False
    
    @property
    def provider_name(self) -> str:
        """Return the provider name."""
        return "gemini"
    
    @property
    def model_name(self) -> str:
        """Return the model identifier."""
        return self._model_name
    
    def is_available(self) -> bool:
        """Check if the provider is available."""
        return self._available and self._client is not None
    
    async def generate(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None,
    ) -> LLMResponse:
        """
        Generate a response from Gemini.
        
        Args:
            messages: Conversation messages
            system_prompt: Optional system prompt
            config: Optional generation config overrides
        
        Returns:
            LLMResponse with generated content
        """
        if not self.is_available():
            raise LLMProviderError(
                provider=self.provider_name,
                message="Provider not available"
            )
        
        try:
            # Build generation config
            gen_config = self._build_generation_config(config)
            
            # Create model with system instruction if provided
            if system_prompt:
                model = self._genai.GenerativeModel(
                    self._model_name,
                    system_instruction=system_prompt,
                )
            else:
                model = self._client
            
            # Convert messages to Gemini format
            history = self._convert_messages_to_history(messages[:-1])
            latest_message = messages[-1].content if messages else ""
            
            # Start chat with history
            chat = model.start_chat(history=history)
            
            # Generate response
            response = await asyncio.wait_for(
                chat.send_message_async(
                    latest_message,
                    generation_config=gen_config,
                ),
                timeout=self._timeout,
            )
            
            # Check for blocked content
            if response.candidates and response.candidates[0].finish_reason.name == "SAFETY":
                raise ContentFilteredError(
                    message="Response was blocked by Gemini safety filters",
                    filter_reason="SAFETY"
                )
            
            # Extract usage metadata
            usage = None
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = {
                    "input_tokens": response.usage_metadata.prompt_token_count,
                    "output_tokens": response.usage_metadata.candidates_token_count,
                    "total_tokens": response.usage_metadata.total_token_count,
                }
            
            return LLMResponse(
                content=response.text,
                model=self._model_name,
                usage=usage,
                finish_reason=response.candidates[0].finish_reason.name
                if response.candidates else None,
            )
            
        except asyncio.TimeoutError:
            raise LLMProviderError(
                provider=self.provider_name,
                message=f"Request timed out after {self._timeout}s"
            )
        except ContentFilteredError:
            raise  # Re-raise content filter errors
        except Exception as e:
            error_msg = str(e).lower()
            
            # Check for rate limiting
            if "rate" in error_msg or "quota" in error_msg:
                raise RateLimitError(provider=self.provider_name)
            
            raise LLMProviderError(
                provider=self.provider_name,
                message=str(e),
                original_error=e
            )
    
    async def stream(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None,
    ) -> AsyncIterator[str]:
        """
        Stream response tokens from Gemini.
        
        Args:
            messages: Conversation messages
            system_prompt: Optional system prompt
            config: Optional generation config overrides
        
        Yields:
            String tokens as they are generated
        """
        if not self.is_available():
            raise LLMProviderError(
                provider=self.provider_name,
                message="Provider not available"
            )
        
        try:
            gen_config = self._build_generation_config(config)
            
            if system_prompt:
                model = self._genai.GenerativeModel(
                    self._model_name,
                    system_instruction=system_prompt,
                )
            else:
                model = self._client
            
            history = self._convert_messages_to_history(messages[:-1])
            latest_message = messages[-1].content if messages else ""
            
            chat = model.start_chat(history=history)
            
            response = await chat.send_message_async(
                latest_message,
                generation_config=gen_config,
                stream=True,
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            raise LLMProviderError(
                provider=self.provider_name,
                message=f"Streaming failed: {str(e)}",
                original_error=e
            )
    
    def _convert_messages_to_history(self, messages: List[Message]) -> list:
        """
        Convert Message objects to Gemini's Content format.
        
        Args:
            messages: List of Message objects
        
        Returns:
            List of Gemini-formatted content dicts
        """
        history = []
        for msg in messages:
            if msg.is_system():
                continue  # System messages handled separately
            
            role = "user" if msg.is_user() else "model"
            history.append({
                "role": role,
                "parts": [msg.content]
            })
        
        return history
    
    def _build_generation_config(
        self,
        config: Optional[GenerationConfig] = None
    ) -> "genai.types.GenerationConfig":
        """
        Build Gemini generation config from our config model.
        
        Args:
            config: Optional GenerationConfig override
        
        Returns:
            Gemini GenerationConfig object
        """
        temp = config.temperature if config and config.temperature is not None else self._temperature
        max_tokens = config.max_tokens if config and config.max_tokens is not None else self._max_tokens
        
        gen_kwargs = {
            "temperature": temp,
            "max_output_tokens": max_tokens,
        }
        
        if config:
            if config.top_p is not None:
                gen_kwargs["top_p"] = config.top_p
            if config.top_k is not None:
                gen_kwargs["top_k"] = config.top_k
            if config.stop_sequences:
                gen_kwargs["stop_sequences"] = config.stop_sequences
        
        return self._genai.types.GenerationConfig(**gen_kwargs)
