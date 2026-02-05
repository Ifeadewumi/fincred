# app/llm/providers/base.py
"""
Abstract base classes and data models for LLM providers.

Defines the interface that all LLM providers must implement,
ensuring consistent behavior across different providers.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional, List, Dict, Any
from pydantic import BaseModel, Field


class Message(BaseModel):
    """
    Represents a single message in a conversation.
    
    Attributes:
        role: The role of the message sender (user, assistant, system)
        content: The text content of the message
        metadata: Optional metadata attached to the message
    """
    
    role: str = Field(
        ...,
        description="Role of the message sender: 'user', 'assistant', or 'system'"
    )
    content: str = Field(
        ...,
        description="Text content of the message"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata for the message"
    )
    
    def is_user(self) -> bool:
        """Check if this is a user message."""
        return self.role == "user"
    
    def is_assistant(self) -> bool:
        """Check if this is an assistant message."""
        return self.role == "assistant"
    
    def is_system(self) -> bool:
        """Check if this is a system message."""
        return self.role == "system"


class LLMResponse(BaseModel):
    """
    Represents a response from an LLM provider.
    
    Attributes:
        content: The generated text content
        model: The model that generated the response
        usage: Token usage statistics (if available)
        finish_reason: Why the generation stopped
        metadata: Additional provider-specific metadata
    """
    
    content: str = Field(
        ...,
        description="Generated text content"
    )
    model: str = Field(
        ...,
        description="Model identifier that generated this response"
    )
    usage: Optional[Dict[str, int]] = Field(
        default=None,
        description="Token usage: input_tokens, output_tokens, total_tokens"
    )
    finish_reason: Optional[str] = Field(
        default=None,
        description="Reason generation stopped: 'stop', 'length', 'safety', etc."
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional provider-specific metadata"
    )


class GenerationConfig(BaseModel):
    """
    Configuration for text generation.
    
    Attributes:
        temperature: Sampling temperature (0.0 = deterministic, 2.0 = very random)
        max_tokens: Maximum tokens to generate
        top_p: Nucleus sampling parameter
        top_k: Top-k sampling parameter
        stop_sequences: Sequences that stop generation
    """
    
    temperature: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=2.0,
        description="Sampling temperature"
    )
    max_tokens: Optional[int] = Field(
        default=None,
        gt=0,
        description="Maximum tokens to generate"
    )
    top_p: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Nucleus sampling parameter"
    )
    top_k: Optional[int] = Field(
        default=None,
        gt=0,
        description="Top-k sampling parameter"
    )
    stop_sequences: Optional[List[str]] = Field(
        default=None,
        description="Sequences that trigger generation stop"
    )


class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    
    All LLM provider implementations must inherit from this class
    and implement the required abstract methods.
    
    This ensures a consistent interface across different providers
    (Gemini, OpenAI, Anthropic, etc.) and enables the fallback chain.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of this provider (e.g., 'gemini', 'openai')."""
        pass
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the model identifier being used."""
        pass
    
    @abstractmethod
    async def generate(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None,
    ) -> LLMResponse:
        """
        Generate a response from the LLM.
        
        Args:
            messages: List of conversation messages
            system_prompt: Optional system prompt to prepend
            config: Optional generation configuration overrides
        
        Returns:
            LLMResponse with the generated content
        
        Raises:
            LLMProviderError: If generation fails
        """
        pass
    
    @abstractmethod
    async def stream(
        self,
        messages: List[Message],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None,
    ) -> AsyncIterator[str]:
        """
        Stream response tokens from the LLM.
        
        Args:
            messages: List of conversation messages
            system_prompt: Optional system prompt to prepend
            config: Optional generation configuration overrides
        
        Yields:
            String tokens as they are generated
        
        Raises:
            LLMProviderError: If streaming fails
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if the provider is configured and available.
        
        Returns:
            True if the provider can be used, False otherwise
        """
        pass
    
    def __str__(self) -> str:
        """String representation of the provider."""
        return f"{self.provider_name}:{self.model_name}"
