# app/schemas/goal.py
from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel


# --- Enums for data validation ---
class GoalType(str, Enum):
    DEBT_PAYOFF = "debt_payoff"
    EMERGENCY_FUND = "emergency_FUND"
    SHORT_TERM_SAVING = "short_term_saving"
    FIRE_STARTER = "fire_starter"


class GoalPriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GoalBase(SQLModel):
    type: GoalType  # Use Enum
    name: str
    target_amount: float
    target_date: date
    priority: GoalPriority  # Use Enum
    primary_flag: bool = False
    why_text: Optional[str] = None


class GoalCreate(GoalBase):
    pass


class GoalRead(GoalBase):
    id: UUID
    status: GoalStatus  # Use Enum
    created_at: datetime
    updated_at: datetime


class GoalUpdate(SQLModel):
    type: Optional[GoalType] = None  # Use Enum
    name: Optional[str] = None
    target_amount: Optional[float] = None
    target_date: Optional[date] = None
    priority: Optional[GoalPriority] = None  # Use Enum
    primary_flag: Optional[bool] = None
    why_text: Optional[str] = None
    status: Optional[GoalStatus] = None  # Use Enum
