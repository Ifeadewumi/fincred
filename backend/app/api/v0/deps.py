# app/api/v0/deps.py
from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import get_session
from app.models.user import User

# Token URL should point to the versioned login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v0/auth/login")


def get_db() -> Generator[Session, None, None]:
    yield from get_session()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise credentials_exception
    return user
