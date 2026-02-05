# app/llm/__init__.py
"""
LLM (Large Language Model) module for FinCred.

This module provides the conversational AI backbone including:
- LLM provider abstractions with fallback support
- Prompt template management
- Model configuration and settings
"""

from app.llm.providers.base import Message, LLMResponse, BaseLLMProvider
from app.llm.providers.gemini import GeminiProvider
from app.llm.providers.fallback import FallbackChain
from app.llm.exceptions import (
    LLMError,
    LLMProviderError,
    AllProvidersFailedError,
    PromptTemplateError,
    ConversationError,
)

__all__ = [
    # Provider classes
    "BaseLLMProvider",
    "GeminiProvider",
    "FallbackChain",
    # Data models
    "Message",
    "LLMResponse",
    # Exceptions
    "LLMError",
    "LLMProviderError",
    "AllProvidersFailedError",
    "PromptTemplateError",
    "ConversationError",
]
