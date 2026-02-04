# app/api/v0/deps.py
from typing import Generator, Annotated

from fastapi import Depends, HTTPException, Security, status, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import get_session
from app.models.user import User

# Define the security scheme.
# HTTPBearer() will create a simple UI for pasting a bearer token.
bearer_scheme = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    yield from get_session()


def get_current_user(
    auth: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current user from a JWT bearer token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # The token is in the 'credentials' attribute of the auth object
        token = auth.credentials
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


def get_pagination(
    limit: Annotated[int, Query(ge=1, le=100, description="Number of items per page")] = 20,
    offset: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0
) -> dict:
    """
    Reusable pagination dependency.
    
    Use in endpoints:
        @router.get("/items")
        async def list_items(pagination: Annotated[dict, Depends(get_pagination)]):
            limit = pagination["limit"]
            offset = pagination["offset"]
    
    Returns:
        dict with 'limit' and 'offset' keys
    """
    return {"limit": limit, "offset": offset}
