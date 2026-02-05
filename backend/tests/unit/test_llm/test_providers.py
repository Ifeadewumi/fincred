# tests/unit/test_llm/test_providers.py
"""Unit tests for LLM providers."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.llm.providers.base import Message, LLMResponse, GenerationConfig, BaseLLMProvider
from app.llm.providers.fallback import FallbackChain
from app.llm.exceptions import AllProvidersFailedError, LLMProviderError, RateLimitError


class TestMessage:
    """Tests for Message data model."""
    
    def test_create_user_message(self):
        """Test creating a user message."""
        msg = Message(role="user", content="Hello!")
        
        assert msg.role == "user"
        assert msg.content == "Hello!"
        assert msg.is_user() is True
        assert msg.is_assistant() is False
        assert msg.is_system() is False
    
    def test_create_assistant_message(self):
        """Test creating an assistant message."""
        msg = Message(role="assistant", content="Hi there!")
        
        assert msg.is_assistant() is True
        assert msg.is_user() is False
    
    def test_create_system_message(self):
        """Test creating a system message."""
        msg = Message(role="system", content="You are a coach.")
        
        assert msg.is_system() is True
    
    def test_message_with_metadata(self):
        """Test message with optional metadata."""
        msg = Message(
            role="user",
            content="Hello!",
            metadata={"intent": "greeting", "confidence": 0.95}
        )
        
        assert msg.metadata is not None
        assert msg.metadata["intent"] == "greeting"


class TestLLMResponse:
    """Tests for LLMResponse data model."""
    
    def test_create_response(self):
        """Test creating a basic response."""
        response = LLMResponse(
            content="Hello! How can I help?",
            model="gemini-2.0-flash"
        )
        
        assert response.content == "Hello! How can I help?"
        assert response.model == "gemini-2.0-flash"
    
    def test_response_with_usage(self):
        """Test response with token usage."""
        response = LLMResponse(
            content="Response text",
            model="gemini-2.0-flash",
            usage={
                "input_tokens": 10,
                "output_tokens": 20,
                "total_tokens": 30
            }
        )
        
        assert response.usage is not None
        assert response.usage["total_tokens"] == 30
    
    def test_response_with_finish_reason(self):
        """Test response with finish reason."""
        response = LLMResponse(
            content="Complete response",
            model="gemini-2.0-flash",
            finish_reason="stop"
        )
        
        assert response.finish_reason == "stop"


class TestGenerationConfig:
    """Tests for GenerationConfig data model."""
    
    def test_default_config(self):
        """Test default generation config."""
        config = GenerationConfig()
        
        assert config.temperature is None
        assert config.max_tokens is None
    
    def test_custom_config(self):
        """Test custom generation config."""
        config = GenerationConfig(
            temperature=0.5,
            max_tokens=1000,
            top_p=0.9,
            stop_sequences=["END"]
        )
        
        assert config.temperature == 0.5
        assert config.max_tokens == 1000
        assert config.top_p == 0.9
        assert config.stop_sequences == ["END"]
    
    def test_temperature_validation(self):
        """Test temperature must be in valid range."""
        # Valid temperatures
        GenerationConfig(temperature=0.0)
        GenerationConfig(temperature=1.0)
        GenerationConfig(temperature=2.0)
        
        # Invalid temperatures should raise
        with pytest.raises(ValueError):
            GenerationConfig(temperature=-0.5)
        
        with pytest.raises(ValueError):
            GenerationConfig(temperature=2.5)


class MockProvider(BaseLLMProvider):
    """Mock provider for testing."""
    
    def __init__(self, name: str = "mock", available: bool = True):
        self._name = name
        self._available = available
        self._calls = 0
    
    @property
    def provider_name(self) -> str:
        return self._name
    
    @property
    def model_name(self) -> str:
        return f"{self._name}-model"
    
    def is_available(self) -> bool:
        return self._available
    
    async def generate(self, messages, system_prompt=None, config=None) -> LLMResponse:
        self._calls += 1
        return LLMResponse(
            content=f"Response from {self._name}",
            model=self.model_name
        )
    
    async def stream(self, messages, system_prompt=None, config=None):
        self._calls += 1
        yield f"Token from {self._name}"


class FailingProvider(BaseLLMProvider):
    """Provider that always fails."""
    
    def __init__(self, error_type: str = "generic"):
        self._error_type = error_type
    
    @property
    def provider_name(self) -> str:
        return "failing"
    
    @property
    def model_name(self) -> str:
        return "failing-model"
    
    def is_available(self) -> bool:
        return True
    
    async def generate(self, messages, system_prompt=None, config=None):
        if self._error_type == "rate_limit":
            raise RateLimitError(provider="failing")
        raise LLMProviderError(provider="failing", message="Provider failed")
    
    async def stream(self, messages, system_prompt=None, config=None):
        raise LLMProviderError(provider="failing", message="Streaming failed")


class TestFallbackChain:
    """Tests for FallbackChain orchestrator."""
    
    def test_creation_requires_providers(self):
        """Test that chain requires at least one provider."""
        with pytest.raises(ValueError, match="At least one provider"):
            FallbackChain([])
    
    def test_creation_with_providers(self):
        """Test creating chain with providers."""
        providers = [MockProvider("first"), MockProvider("second")]
        chain = FallbackChain(providers)
        
        assert len(chain.providers) == 2
        assert chain.is_available() is True
    
    @pytest.mark.asyncio
    async def test_generate_uses_first_available(self):
        """Test that generate uses first available provider."""
        first = MockProvider("first")
        second = MockProvider("second")
        chain = FallbackChain([first, second])
        
        messages = [Message(role="user", content="Hello")]
        response = await chain.generate(messages)
        
        assert response.content == "Response from first"
        assert first._calls == 1
        assert second._calls == 0
    
    @pytest.mark.asyncio
    async def test_generate_falls_back_on_failure(self):
        """Test that generate falls back to next provider on failure."""
        failing = FailingProvider()
        working = MockProvider("working")
        chain = FallbackChain([failing, working])
        
        messages = [Message(role="user", content="Hello")]
        response = await chain.generate(messages)
        
        assert response.content == "Response from working"
        assert working._calls == 1
    
    @pytest.mark.asyncio
    async def test_generate_skips_unavailable(self):
        """Test that generate skips unavailable providers."""
        unavailable = MockProvider("unavailable", available=False)
        available = MockProvider("available")
        chain = FallbackChain([unavailable, available])
        
        messages = [Message(role="user", content="Hello")]
        response = await chain.generate(messages)
        
        assert response.content == "Response from available"
        assert unavailable._calls == 0
        assert available._calls == 1
    
    @pytest.mark.asyncio
    async def test_generate_rate_limit_moves_to_next(self):
        """Test that rate limit immediately moves to next provider."""
        rate_limited = FailingProvider(error_type="rate_limit")
        working = MockProvider("working")
        chain = FallbackChain([rate_limited, working])
        
        messages = [Message(role="user", content="Hello")]
        response = await chain.generate(messages)
        
        assert response.content == "Response from working"
    
    @pytest.mark.asyncio
    async def test_generate_all_fail_raises(self):
        """Test that all providers failing raises AllProvidersFailedError."""
        chain = FallbackChain([FailingProvider(), FailingProvider()])
        
        messages = [Message(role="user", content="Hello")]
        
        with pytest.raises(AllProvidersFailedError):
            await chain.generate(messages)
    
    @pytest.mark.asyncio
    async def test_stream_uses_first_available(self):
        """Test that streaming uses first available provider."""
        first = MockProvider("first")
        second = MockProvider("second")
        chain = FallbackChain([first, second])
        
        messages = [Message(role="user", content="Hello")]
        tokens = []
        async for token in chain.stream(messages):
            tokens.append(token)
        
        assert len(tokens) == 1
        assert "first" in tokens[0]
    
    def test_get_available_providers(self):
        """Test getting list of available providers."""
        available1 = MockProvider("a1", available=True)
        unavailable = MockProvider("u1", available=False)
        available2 = MockProvider("a2", available=True)
        
        chain = FallbackChain([available1, unavailable, available2])
        
        available = chain.get_available_providers()
        
        assert len(available) == 2
        assert available[0]._name == "a1"
        assert available[1]._name == "a2"
    
    def test_string_representation(self):
        """Test string representation of chain."""
        chain = FallbackChain([MockProvider("first"), MockProvider("second")])
        
        str_repr = str(chain)
        
        assert "first" in str_repr
        assert "second" in str_repr
