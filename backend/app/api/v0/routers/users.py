# app/api/v0/routers/users.py
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api.v0.deps import get_current_user, get_db
from app.models.user import Profile
from app.schemas.user import UserRead, ProfileUpdate

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me/profile")
def update_profile(
    profile_in: ProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Fetch profile by user_id rather than assuming same primary key
    profile = db.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    for field, value in profile_in.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
