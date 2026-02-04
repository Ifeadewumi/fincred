# tests/unit/test_exceptions.py
"""
Unit tests for custom exceptions.

Tests exception creation, error codes, status codes, and serialization.
"""
import pytest
from fastapi import status

from app.core.exceptions import (
    ErrorCode,
    FinCredException,
    AuthenticationError,
    ResourceNotFoundError,
    GoalLimitExceededError,
    InvalidGoalDateError,
    PasswordTooWeakError,
    NoFieldsToUpdateError,
    DatabaseError
)


@pytest.mark.unit
class TestErrorCode:
    """Tests for ErrorCode enum."""
    
    def test_error_code_values_are_strings(self):
        """Test that all error codes are strings."""
        for error_code in ErrorCode:
            assert isinstance(error_code.value, str)
    
    def test_error_code_unique_values(self):
        """Test that all error codes have unique values."""
        values = [code.value for code in ErrorCode]
        assert len(values) == len(set(values)), "Error codes should be unique"


@pytest.mark.unit
class TestFinCredException:
    """Tests for base FinCredException."""
    
    def test_exception_creation(self):
        """Test that exception is created with correct attributes."""
        exc = FinCredException(
            message="Test error",
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"foo": "bar"}
        )
        
        assert exc.message == "Test error"
        assert exc.error_code == ErrorCode.INTERNAL_SERVER_ERROR
        assert exc.status_code == 500
        assert exc.details == {"foo": "bar"}
    
    def test_exception_to_dict(self):
        """Test that exception serializes to dict correctly."""
        exc = FinCredException(
            message="Test error",
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            details={"key": "value"}
        )
        
        result = exc.to_dict()
        
        assert result["error_code"] == "INTERNAL_SERVER_ERROR"
        assert result["message"] == "Test error"
        assert result["details"] == {"key": "value"}
    
    def test_exception_to_dict_no_details(self):
        """Test that exception without details doesn't include empty dict."""
        exc = FinCredException(
            message="Test error",
            error_code=ErrorCode.INTERNAL_SERVER_ERROR
        )
        
        result = exc.to_dict()
        
        assert "error_code" in result
        assert "message" in result
        # Details should not be in result if empty
        assert "details" not in result or result["details"] == {}


@pytest.mark.unit
class TestAuthenticationError:
    """Tests for AuthenticationError."""
    
    def test_default_message(self):
        """Test default message is set correctly."""
        exc = AuthenticationError()
        
        assert exc.message == "Authentication failed"
        assert exc.error_code == ErrorCode.INVALID_CREDENTIALS
        assert exc.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_custom_message(self):
        """Test custom message is set correctly."""
        exc = AuthenticationError(message="Invalid email or password")
        
        assert exc.message == "Invalid email or password"


@pytest.mark.unit
class TestResourceNotFoundError:
    """Tests for ResourceNotFoundError."""
    
    def test_with_resource_id(self):
        """Test error message includes resource ID."""
        exc = ResourceNotFoundError("Goal", "123")
        
        assert "Goal" in exc.message
        assert "123" in exc.message
        assert exc.error_code == ErrorCode.RESOURCE_NOT_FOUND
        assert exc.status_code == status.HTTP_404_NOT_FOUND
        assert exc.details["resource_type"] == "Goal"
        assert exc.details["resource_id"] == "123"
    
    def test_without_resource_id(self):
        """Test error message without resource ID."""
        exc = ResourceNotFoundError("User")
        
        assert "User" in exc.message
        assert exc.details["resource_type"] == "User"
        assert "resource_id" not in exc.details


@pytest.mark.unit
class TestGoalLimitExceededError:
    """Tests for GoalLimitExceededError."""
    
    def test_default_values(self):
        """Test error with default max count."""
        exc = GoalLimitExceededError(current_count=5)
        
        assert exc.status_code == status.HTTP_400_BAD_REQUEST
        assert exc.error_code == ErrorCode.GOAL_LIMIT_EXCEEDED
        assert exc.details["current_count"] == 5
        assert exc.details["max_count"] == 5
    
    def test_custom_max_count(self):
        """Test error with custom max count."""
        exc = GoalLimitExceededError(current_count=10, max_count=10)
        
        assert exc.details["current_count"] == 10
        assert exc.details["max_count"] == 10


@pytest.mark.unit
class TestInvalidGoalDateError:
    """Tests for InvalidGoalDateError."""
    
    def test_default_message(self):
        """Test default error message."""
        exc = InvalidGoalDateError()
        
        assert exc.message == "Goal target date must be in the future"
        assert exc.error_code == ErrorCode.INVALID_GOAL_DATE
        assert exc.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_custom_message(self):
        """Test custom error message."""
        exc = InvalidGoalDateError("Date cannot be more than 10 years in future")
        
        assert exc.message == "Date cannot be more than 10 years in future"


@pytest.mark.unit
class TestPasswordTooWeakError:
    """Tests for PasswordTooWeakError."""
    
    def test_with_strength(self):
        """Test error includes password strength."""
        exc = PasswordTooWeakError(
            message="Password must contain special characters",
            strength="weak"
        )
        
        assert exc.error_code == ErrorCode.PASSWORD_TOO_WEAK
        assert exc.status_code == status.HTTP_400_BAD_REQUEST
        assert exc.details["strength"] == "weak"


@pytest.mark.unit
class TestNoFieldsToUpdateError:
    """Tests for NoFieldsToUpdateError."""
    
    def test_default_message(self):
        """Test default error message."""
        exc = NoFieldsToUpdateError()
        
        assert exc.message == "No valid fields provided for update"
        assert exc.error_code == ErrorCode.NO_FIELDS_TO_UPDATE
        assert exc.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.unit
class TestDatabaseError:
    """Tests for DatabaseError."""
    
    def test_without_original_error(self):
        """Test database error without original exception."""
        exc = DatabaseError()
        
        assert exc.message == "Database operation failed"
        assert exc.error_code == ErrorCode.DATABASE_ERROR
        assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def test_with_original_error(self):
        """Test database error with original exception."""
        original = ValueError("Connection failed")
        exc = DatabaseError(original_error=original)
        
        assert exc.details["original_error"] == "Connection failed"
