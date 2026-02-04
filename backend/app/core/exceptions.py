# app/core/exceptions.py
"""
Custom exception hierarchy for the FinCred API.

Provides domain-specific exceptions with proper HTTP status code mapping
and structured error responses for client consumption.
"""
from typing import Any, Dict, Optional
from enum import Enum
from fastapi import status


class ErrorCode(str, Enum):
    """
    Enumeration of error codes for client-side error handling.
    
    These codes allow clients to programmatically handle specific error cases
    without parsing error messages.
    """
    # Authentication & Authorization
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    ACCOUNT_NOT_VERIFIED = "ACCOUNT_NOT_VERIFIED"
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"
    
    # Validation
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    
    # Resources
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    
    # Business Logic
    GOAL_LIMIT_EXCEEDED = "GOAL_LIMIT_EXCEEDED"
    INVALID_GOAL_DATE = "INVALID_GOAL_DATE"
    PASSWORD_TOO_WEAK = "PASSWORD_TOO_WEAK"
    EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED"
    NO_FIELDS_TO_UPDATE = "NO_FIELDS_TO_UPDATE"
    
    # Server
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"


class FinCredException(Exception):
    """
    Base exception class for all FinCred application exceptions.
    
    All custom exceptions should inherit from this class to ensure
    consistent error handling and response formatting.
    """
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize a FinCred exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            status_code: HTTP status code to return
            details: Optional additional details for debugging
        """
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert exception to dictionary for JSON serialization.
        
        Returns:
            Dictionary with error details
        """
        error_dict = {
            "error_code": self.error_code.value,
            "message": self.message,
        }
        
        if self.details:
            error_dict["details"] = self.details
        
        return error_dict


# =============================================================================
# Authentication & Authorization Exceptions
# =============================================================================

class AuthenticationError(FinCredException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.INVALID_CREDENTIALS,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class TokenExpiredError(FinCredException):
    """Raised when a JWT token has expired."""
    
    def __init__(self, message: str = "Token has expired", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.TOKEN_EXPIRED,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class TokenInvalidError(FinCredException):
    """Raised when a JWT token is invalid."""
    
    def __init__(self, message: str = "Invalid token", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.TOKEN_INVALID,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class InsufficientPermissionsError(FinCredException):
    """Raised when user lacks required permissions."""
    
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class AccountNotVerifiedError(FinCredException):
    """Raised when account email is not verified."""
    
    def __init__(self, message: str = "Email not verified", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.ACCOUNT_NOT_VERIFIED,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class AccountInactiveError(FinCredException):
    """Raised when account is inactive."""
    
    def __init__(self, message: str = "Account is inactive", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.ACCOUNT_INACTIVE,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


# =============================================================================
# Validation Exceptions
# =============================================================================

class ValidationError(FinCredException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class InvalidInputError(FinCredException):
    """Raised when input data is invalid."""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        if field and not details:
            details = {"field": field}
        elif field and details:
            details["field"] = field
        
        super().__init__(
            message=message,
            error_code=ErrorCode.INVALID_INPUT,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


# =============================================================================
# Resource Exceptions
# =============================================================================

class ResourceNotFoundError(FinCredException):
    """Raised when a requested resource is not found."""
    
    def __init__(self, resource_type: str, resource_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        if resource_id:
            message = f"{resource_type} with ID '{resource_id}' not found"
        else:
            message = f"{resource_type} not found"
        
        if not details:
            details = {"resource_type": resource_type}
            if resource_id:
                details["resource_id"] = resource_id
        
        super().__init__(
            message=message,
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class ResourceAlreadyExistsError(FinCredException):
    """Raised when attempting to create a resource that already exists."""
    
    def __init__(self, resource_type: str, identifier: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        if identifier:
            message = f"{resource_type} '{identifier}' already exists"
        else:
            message = f"{resource_type} already exists"
        
        if not details:
            details = {"resource_type": resource_type}
            if identifier:
                details["identifier"] = identifier
        
        super().__init__(
            message=message,
            error_code=ErrorCode.RESOURCE_ALREADY_EXISTS,
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class ResourceConflictError(FinCredException):
    """Raised when a resource operation conflicts with current state."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code=ErrorCode.RESOURCE_CONFLICT,
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


# =============================================================================
# Business Logic Exceptions
# =============================================================================

class GoalLimitExceededError(FinCredException):
    """Raised when user tries to create more goals than allowed."""
    
    def __init__(self, current_count: int, max_count: int = 5):
        super().__init__(
            message=f"Maximum number of active goals ({max_count}) reached",
            error_code=ErrorCode.GOAL_LIMIT_EXCEEDED,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"current_count": current_count, "max_count": max_count}
        )


class InvalidGoalDateError(FinCredException):
    """Raised when goal target date is invalid."""
    
    def __init__(self, message: str = "Goal target date must be in the future"):
        super().__init__(
            message=message,
            error_code=ErrorCode.INVALID_GOAL_DATE,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class PasswordTooWeakError(FinCredException):
    """Raised when password doesn't meet security requirements."""
    
    def __init__(self, message: str, strength: str = "weak"):
        super().__init__(
            message=message,
            error_code=ErrorCode.PASSWORD_TOO_WEAK,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"strength": strength}
        )


class EmailAlreadyRegisteredError(FinCredException):
    """Raised when attempting to register with an existing email."""
    
    def __init__(self, email: Optional[str] = None):
        # Don't expose the email in the message for security
        message = "This email address is already registered"
        super().__init__(
            message=message,
            error_code=ErrorCode.EMAIL_ALREADY_REGISTERED,
            status_code=status.HTTP_409_CONFLICT
        )


class NoFieldsToUpdateError(FinCredException):
    """Raised when update request contains no valid fields."""
    
    def __init__(self, message: str = "No valid fields provided for update"):
        super().__init__(
            message=message,
            error_code=ErrorCode.NO_FIELDS_TO_UPDATE,
            status_code=status.HTTP_400_BAD_REQUEST
        )


# =============================================================================
# Server Exceptions
# =============================================================================

class DatabaseError(FinCredException):
    """Raised when a database operation fails."""
    
    def __init__(self, message: str = "Database operation failed", original_error: Optional[Exception] = None):
        details = {}
        if original_error:
            details["original_error"] = str(original_error)
        
        super().__init__(
            message=message,
            error_code=ErrorCode.DATABASE_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class ExternalServiceError(FinCredException):
    """Raised when an external service call fails."""
    
    def __init__(self, service_name: str, message: str = "External service error"):
        super().__init__(
            message=message,
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service_name}
        )
