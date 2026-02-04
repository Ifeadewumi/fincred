# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
import re

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

# Security Constants
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
PASSWORD_REQUIRE_LETTER = True
PASSWORD_REQUIRE_NUMBER = True

# Use PBKDF2-HMAC-SHA256 for password hashing to avoid bcrypt backend
# issues on some platforms while still providing strong, salted hashes.
# Note: Consider migrating to bcrypt if platform compatibility issues are resolved,
# as bcrypt is generally preferred for password hashing.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using PBKDF2-HMAC-SHA256.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        password: Plain text password to verify
        password_hash: Hashed password to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: Token subject (typically user email or ID)
        expires_minutes: Token expiration time in minutes (defaults to config value)
        
    Returns:
        Encoded JWT token string
    """
    if expires_minutes is None:
        expires_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    
    # Use timezone-aware datetime (Python 3.12+ best practice)
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode = {"sub": subject, "exp": expire}
    
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Token payload dictionary if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def validate_password_strength(password: str) -> tuple[bool, str, Literal["weak", "medium", "strong"]]:
    """
    Validate password against security requirements and assess strength.
    
    Args:
        password: Plain text password to validate
        
    Returns:
        Tuple of (is_valid, error_message, strength_score)
        - is_valid: True if password meets minimum requirements
        - error_message: Description of validation failure (empty if valid)
        - strength_score: "weak", "medium", or "strong"
    """
    # Check minimum length
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long", "weak"
    
    # Check maximum length
    if len(password) > MAX_PASSWORD_LENGTH:
        return False, f"Password must be at most {MAX_PASSWORD_LENGTH} characters long", "weak"
    
    # Check for at least one letter
    if PASSWORD_REQUIRE_LETTER and not any(c.isalpha() for c in password):
        return False, "Password must contain at least one letter", "weak"
    
    # Check for at least one number
    if PASSWORD_REQUIRE_NUMBER and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number", "weak"
    
    # Assess strength beyond minimum requirements
    strength = "medium"
    strength_score = 0
    
    # Length bonus
    if len(password) >= 12:
        strength_score += 1
    if len(password) >= 16:
        strength_score += 1
    
    # Character variety
    has_lowercase = any(c.islower() for c in password)
    has_uppercase = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    
    char_variety = sum([has_lowercase, has_uppercase, has_digit, has_special])
    
    if char_variety >= 3:
        strength_score += 1
    if char_variety >= 4:
        strength_score += 1
    
    # Determine final strength
    if strength_score >= 3:
        strength = "strong"
    elif strength_score <= 1:
        strength = "weak"
    
    return True, "", strength