# app/schemas/user.py
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class UserBase(SQLModel):
    email: str
    is_active: bool = True


class UserCreate(SQLModel):
    email: str
    password: str


class UserRead(UserBase):
    id: int
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
