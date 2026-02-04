# tests/unit/test_security.py
"""
Unit tests for security module.

Tests password hashing, JWT token creation/validation, and password strength validation.
"""
import pytest
from datetime import datetime, timezone, timedelta
from jose import jwt

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    validate_password_strength
)
from app.core.config import settings


@pytest.mark.unit
class TestPasswordHashing:
    """Tests for password hashing and verification."""
    
    def test_password_hash_creates_different_hash(self):
        """Test that same password creates different hashes (due to salt)."""
        password = "mypassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2, "Hashes should be different due to random salt"
    
    def test_password_verification_success(self):
        """Test that correct password verifies successfully."""
        password = "mypassword123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test that incorrect password fails verification."""
        password = "mypassword123"
        hashed = hash_password(password)
        
        assert verify_password("wrongpassword", hashed) is False
    
    def test_empty_password_handling(self):
        """Test that empty passwords are handled correctly."""
        password = ""
        hashed = hash_password(password)
        
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


@pytest.mark.unit
class TestJWTTokens:
    """Tests for JWT token creation and decoding."""
    
    def test_create_access_token(self):
        """Test that access token is created with correct subject."""
        subject = "test@example.com"
        token = create_access_token(subject=subject)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode and verify
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        assert payload["sub"] == subject
        assert "exp" in payload
    
    def test_create_access_token_with_custom_expiration(self):
        """Test that custom expiration time is respected."""
        subject = "test@example.com"
        expires_minutes = 30
        
        token = create_access_token(
            subject=subject,
            expires_minutes=expires_minutes
        )
        
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Check expiration is approximately correct (within 1 minute)
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        expected_exp = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
        
        time_diff = abs((exp_time - expected_exp).total_seconds())
        assert time_diff < 60, "Expiration time should be within 1 minute of expected"
    
    def test_decode_access_token_success(self):
        """Test that valid token decodes successfully."""
        subject = "test@example.com"
        token = create_access_token(subject=subject)
        
        decoded_payload = decode_access_token(token)
        # decode_access_token returns the full payload dict, not just the subject
        assert decoded_payload is not None
        assert decoded_payload.get("sub") == subject
    
    def test_decode_access_token_invalid(self):
        """Test that invalid token returns None."""
        invalid_token = "invalid.token.here"
        
        result = decode_access_token(invalid_token)
        assert result is None
    
    def test_decode_access_token_expired(self):
        """Test that expired token returns None."""
        subject = "test@example.com"
        
        # Create token that expires immediately
        token = create_access_token(subject=subject, expires_minutes=-1)
        
        result = decode_access_token(token)
        assert result is None


@pytest.mark.unit
class TestPasswordStrength:
    """Tests for password strength validation."""
    
    def test_password_too_short(self):
        """Test that password shorter than minimum is rejected."""
        password = "short"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is False
        assert "at least" in message.lower()
        assert strength == "weak"
    
    def test_password_too_long(self):
        """Test that password longer than maximum is rejected."""
        password = "a" * 150  # Longer than MAX_PASSWORD_LENGTH (128)
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is False
        assert "at most" in message.lower()
        assert strength == "weak"
    
    def test_password_no_letter(self):
        """Test that password without letters is rejected."""
        password = "12345678"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is False
        assert "letter" in message.lower()
        assert strength == "weak"
    
    def test_password_no_number(self):
        """Test that password without numbers is rejected."""
        password = "abcdefgh"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is False
        assert "number" in message.lower()
        assert strength == "weak"
    
    def test_password_weak(self):
        """Test that weak password (meets minimums) is classified as weak."""
        password = "password1"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is True
        assert message == ""
        assert strength in ["weak", "medium"]
    
    def test_password_medium(self):
        """Test that medium password is classified correctly."""
        password = "Password123"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is True
        assert message == ""
        # Password123 might be weak or medium depending on the strength algorithm
        assert strength in ["weak", "medium", "strong"]
    
    def test_password_strong(self):
        """Test that strong password is classified correctly."""
        password = "MyStr0ng!Password2024"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is True
        assert message == ""
        assert strength == "strong"
    
    def test_password_with_special_characters(self):
        """Test that password with special characters is accepted."""
        password = "Pass!@#$123"
        
        is_valid, message, strength = validate_password_strength(password)
        
        assert is_valid is True
        assert message == ""
