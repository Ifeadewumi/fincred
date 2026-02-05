# app/llm/exceptions.py
"""
LLM-specific exceptions for the FinCred application.

Provides domain-specific exceptions for LLM provider errors,
prompt template issues, and conversation handling failures.
"""

from typing import Any, Dict, Optional
from fastapi import status
from app.core.exceptions import FinCredException, ErrorCode


class LLMError(FinCredException):
    """
    Base exception for all LLM-related errors.
    
    All LLM-specific exceptions should inherit from this class.
    """
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
        status_code: int = status.HTTP_503_SERVICE_UNAVAILABLE,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status_code,
            details=details
        )


class LLMProviderError(LLMError):
    """
    Raised when a specific LLM provider fails.
    
    Includes provider name and original error details for debugging.
    """
    
    def __init__(
        self,
        provider: str,
        message: str,
        original_error: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = {"provider": provider}
        if original_error:
            error_details["original_error"] = str(original_error)
        if details:
            error_details.update(details)
        
        super().__init__(
            message=f"LLM provider '{provider}' error: {message}",
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=error_details
        )


class AllProvidersFailedError(LLMError):
    """
    Raised when all LLM providers in the fallback chain fail.
    
    This is a critical error indicating no LLM service is available.
    """
    
    def __init__(
        self,
        message: str = "All LLM providers failed",
        errors: Optional[list] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if errors:
            error_details["provider_errors"] = errors
        
        super().__init__(
            message=message,
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=error_details
        )


class PromptTemplateError(LLMError):
    """
    Raised when a prompt template is invalid, not found, or fails to render.
    """
    
    def __init__(
        self,
        template_name: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = {"template": template_name}
        if details:
            error_details.update(details)
        
        super().__init__(
            message=message or f"Prompt template '{template_name}' error",
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=error_details
        )


class ConversationError(LLMError):
    """
    Raised when conversation processing fails.
    
    This includes session management errors, context building failures,
    and message processing issues.
    """
    
    def __init__(
        self,
        message: str,
        session_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if session_id:
            error_details["session_id"] = session_id
        
        super().__init__(
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=error_details
        )


class RateLimitError(LLMError):
    """
    Raised when an LLM provider rate limit is exceeded.
    """
    
    def __init__(
        self,
        provider: str,
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = {"provider": provider}
        if retry_after:
            error_details["retry_after_seconds"] = retry_after
        if details:
            error_details.update(details)
        
        super().__init__(
            message=f"Rate limit exceeded for LLM provider '{provider}'",
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=error_details
        )


class ContentFilteredError(LLMError):
    """
    Raised when LLM content is blocked by safety filters.
    """
    
    def __init__(
        self,
        message: str = "Content was blocked by safety filters",
        filter_reason: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        error_details = details or {}
        if filter_reason:
            error_details["filter_reason"] = filter_reason
        
        super().__init__(
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=error_details
        )
