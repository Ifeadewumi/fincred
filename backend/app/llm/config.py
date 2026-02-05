# app/llm/config.py
"""
LLM-specific configuration settings.

Provides structured configuration for LLM providers, model chains,
and generation parameters.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ModelConfig(BaseModel):
    """Configuration for a single LLM model."""
    
    provider: str = Field(
        default="gemini",
        description="LLM provider name (gemini, openai, anthropic)"
    )
    model: str = Field(
        default="gemini-2.0-flash",
        description="Model identifier"
    )
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for generation"
    )
    max_tokens: int = Field(
        default=4096,
        gt=0,
        description="Maximum tokens to generate"
    )
    timeout: int = Field(
        default=30,
        gt=0,
        description="Request timeout in seconds"
    )


class LLMSettings(BaseModel):
    """
    LLM layer configuration settings.
    
    Manages the model chain, retry behavior, and safety settings
    for all LLM interactions.
    """
    
    # Primary model (first in chain)
    primary_model: ModelConfig = Field(
        default_factory=ModelConfig,
        description="Primary model configuration"
    )
    
    # Fallback models (in priority order)
    fallback_models: List[ModelConfig] = Field(
        default_factory=lambda: [
            ModelConfig(model="gemini-1.5-flash"),
        ],
        description="Fallback models to use if primary fails"
    )
    
    # Retry settings
    max_retries: int = Field(
        default=2,
        ge=0,
        description="Maximum retries per provider before falling back"
    )
    retry_delay: float = Field(
        default=1.0,
        ge=0.0,
        description="Delay between retries in seconds"
    )
    
    # Safety settings
    safety_disclaimer: str = Field(
        default=(
            "This is educational guidance, not professional financial advice. "
            "Please consult a qualified financial advisor for personalized recommendations."
        ),
        description="Disclaimer to append to financial advice responses"
    )
    
    # Content filtering
    enable_safety_filters: bool = Field(
        default=True,
        description="Enable provider safety filters"
    )
    
    def get_all_models(self) -> List[ModelConfig]:
        """Get all models in the chain (primary + fallbacks)."""
        return [self.primary_model] + self.fallback_models


def parse_model_chain(chain_string: str) -> List[str]:
    """
    Parse a comma-separated model chain string into a list of model names.
    
    Args:
        chain_string: Comma-separated model names (e.g., "gemini-2.0-flash,gemini-1.5-flash")
    
    Returns:
        List of model names, stripped of whitespace
    """
    if not chain_string:
        return ["gemini-2.0-flash"]  # Default
    
    return [model.strip() for model in chain_string.split(",") if model.strip()]
