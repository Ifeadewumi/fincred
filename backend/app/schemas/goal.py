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
    """Base goal model with common fields."""
    type: GoalType = Field(
        description="Type of financial goal"
    )
    name: str = Field(
        min_length=1,
        max_length=100,
        description="Goal name (1-100 characters)"
    )
    target_amount: float = Field(
        gt=0,
        description="Target amount to save or pay off (must be positive)"
    )
    target_date: date = Field(
        description="Target completion date (must be in the future)"
    )
    priority: GoalPriority = Field(
        description="Goal priority level"
    )
    primary_flag: bool = Field(
        default=False,
        description="Whether this is the user's primary/main goal"
    )
    why_text: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Personal motivation for this goal (max 500 characters)"
    )


class GoalCreate(GoalBase):
    """Schema for creating a new goal."""
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "type": "short_term_saving",
                    "name": "Emergency Fund",
                    "target_amount": 10000.0,
                    "target_date": "2025-12-31",
                    "priority": "High",
                    "primary_flag": True,
                    "why_text": "Build 6 months of expenses for financial security"
                },
                {
                    "type": "debt_payoff",
                    "name": "Credit Card Debt",
                    "target_amount": 5000.0,
                    "target_date": "2025-06-30",
                    "priority": "High",
                    "primary_flag": False,
                    "why_text": "Become debt-free and improve credit score"
                }
            ]
        }
    }



class GoalRead(GoalBase):
    id: UUID
    user_id: UUID  # Add user_id so tests/services can verify ownership
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
