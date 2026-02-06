# app/api/v0/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.api.v0.deps import get_current_user, get_db
from app.models.user import Profile, User
from app.schemas.user import UserRead, ProfileUpdate, ProfileRead, UserReadWithProfile

router = APIRouter(prefix="/users")


@router.get("/me", response_model=UserReadWithProfile)
def read_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the authenticated user and their profile.
    """
    # Explicitly load the profile relationship
    user_with_profile = db.exec(
        select(User).options(selectinload(User.profile)).where(User.id == current_user.id)
    ).first()
    if not user_with_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user_with_profile


@router.get("/me/profile", response_model=ProfileRead)
def read_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the authenticated user's profile information.
    """
    profile = db.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("/me/profile", response_model=ProfileRead)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's profile and preferences.
    """
    # Fetch profile by user_id rather than assuming same primary key
    profile = db.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
