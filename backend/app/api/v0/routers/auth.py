import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.v0.deps import get_db
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import Profile, User
from app.schemas.auth import Token
from app.schemas.user import UserCreate


# A simple schema for returning messages
class Message(BaseModel):
    message: str


router = APIRouter(prefix="/auth")


# --- Mock Email Service ---
# In a real app, this would use a service like SendGrid or AWS SES.
def _send_verification_email(email: str, token: str):
    """Mocks sending a verification email by printing the link."""
    # Note: In production, the hostname should come from config.
    verification_link = f"http://127.0.0.1:8000/api/v0/auth/verify-email?token={token}"
    print("--- MOCK EMAIL ---")
    print(f"To: {email}")
    print("Subject: Verify Your FinCred Account")
    print("Please click the link below to verify your email address:")
    print(verification_link)
    print("--- END MOCK EMAIL ---")


def _validate_password(password: str) -> None:
    """Password strength checks: min 8 chars, 1 letter, 1 number."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    if len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at most 128 characters long.",
        )
    if not any(c.isalpha() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter.",
        )
    if not any(c.isdigit() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number.",
        )


@router.post(
    "/register", response_model=Message, status_code=status.HTTP_201_CREATED
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Handles user registration.
    Creates an inactive user and sends a verification email.
    """
    normalized_email = user_in.email.lower()
    existing_user = db.exec(
        select(User).where(User.email == normalized_email)
    ).first()

    # Mitigate user enumeration: always return a generic success-like message.
    # If the user exists and isn't verified, we can resend the email.
    if existing_user:
        if not existing_user.is_verified:
            # Resend verification, but don't reveal that the user already existed.
            # Note: This requires storing/regenerating a token. For simplicity,
            # we'll assume the happy path for now and just return the message.
            pass
        return {
            "message": "Registration process started. If an account is created, a verification email will be sent."
        }

    _validate_password(user_in.password)

    verification_token = secrets.token_urlsafe(32)

    # Use a single transaction for atomicity
    try:
        from app.core.config import settings
        
        # In development, we can auto-verify users to simplify testing
        is_verified = settings.ENV == "development"
        
        user = User(
            email=normalized_email,
            password_hash=hash_password(user_in.password),
            verification_token=hash_password(verification_token) if not is_verified else None,
            is_verified=is_verified,
        )
        db.add(user)
        db.flush()  # Use flush to get the user.id without committing

        # Create the associated profile in the same transaction
        profile = Profile(user_id=user.id, full_name=user_in.full_name)
        db.add(profile)

        db.commit()
    except Exception:
        db.rollback()
        # Generic error to avoid leaking implementation details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )

    _send_verification_email(email=normalized_email, token=verification_token)

    return {
        "message": "Registration process started. If an account is created, a verification email will be sent."
    }


@router.get("/verify-email", response_model=Token)
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user's email address with the provided token."""
    # Find all unverified users to check against the token
    unverified_users = db.exec(select(User).where(User.is_verified == False)).all()

    user_to_verify = None
    for user in unverified_users:
        if user.verification_token and verify_password(token, user.verification_token):
            user_to_verify = user
            break

    if not user_to_verify:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )

    user_to_verify.is_verified = True
    user_to_verify.verification_token = None  # Invalidate the token
    db.add(user_to_verify)
    db.commit()

    # Log the user in by returning an access token
    access_token = create_access_token(subject=user_to_verify.email)
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Logs a user in, providing a JWT if credentials are correct."""
    email = form_data.username.lower()
    user = db.exec(select(User).where(User.email == email)).first()

    # Generic error message to prevent user enumeration
    invalid_creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user or not verify_password(form_data.password, user.password_hash):
        raise invalid_creds_exc

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for a verification link.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive."
        )

    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)


class ResendVerificationRequest(BaseModel):
    email: str


@router.post("/resend-verification", response_model=Message)
def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Resends the verification email for an unverified account.
    Returns a generic message to prevent user enumeration.
    """
    email = request.email.lower()
    user = db.exec(select(User).where(User.email == email)).first()

    # Always return the same message to prevent enumeration
    generic_response = {
        "message": "If an account exists with this email and is unverified, a new verification email has been sent."
    }

    if not user or user.is_verified:
        return generic_response

    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = hash_password(verification_token)
    db.add(user)
    db.commit()

    _send_verification_email(email=email, token=verification_token)

    return generic_response
