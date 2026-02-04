# app/schemas/user.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr
from sqlmodel import SQLModel


class UserBase(SQLModel):
    email: EmailStr
    is_active: bool = True
    is_verified: bool = False


class UserCreate(SQLModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: UUID
    created_at: datetime


class ProfileBase(SQLModel):
    country: Optional[str] = None
    currency: Optional[str] = None
    age_range: Optional[str] = None
    employment_status: Optional[str] = None
    reminder_frequency: Optional[str] = "weekly"
    preferred_checkin_day_of_week: Optional[int] = None
    persona_hint: Optional[str] = None


class ProfileUpdate(ProfileBase):
    pass


# NEW SCHEMAS
class ProfileRead(ProfileBase):
    id: UUID
    user_id: UUID


class UserReadWithProfile(UserRead):
    profile: Optional[ProfileRead] = None
