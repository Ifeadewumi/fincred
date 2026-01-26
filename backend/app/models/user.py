# app/models/user.py
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    is_active: bool = True
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    profile: Optional["Profile"] = Relationship(back_populates="user")


class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    country: Optional[str] = None
    currency: Optional[str] = None
    age_range: Optional[str] = None
    employment_status: Optional[str] = None
    reminder_frequency: Optional[str] = "weekly"
    preferred_checkin_day_of_week: Optional[int] = None
    persona_hint: Optional[str] = None

    user: User = Relationship(back_populates="profile")
