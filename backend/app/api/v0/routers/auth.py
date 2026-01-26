# app/api/v0/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.api.v0.deps import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, Profile
from app.schemas.user import UserCreate
from app.schemas.auth import Token

router = APIRouter(prefix="/auth", tags=["auth"])


def _validate_password(password: str) -> None:
    """Basic password strength checks for registration.

    Adjust rules as needed; for now enforce a minimum length and a max cap
    to guard against absurdly long inputs.
    """
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


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    _validate_password(user_in.password)

    user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create empty profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    db.commit()

    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)
