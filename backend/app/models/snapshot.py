# app/models/snapshot.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class Income(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    amount: float
    frequency: str  # e.g., monthly, biweekly, weekly, annual
    source_label: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExpenseEstimate(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    total_amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Debt(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    type: str  # e.g., student_loan, credit_card, personal_loan
    label: Optional[str] = None
    balance: float
    interest_rate_annual: float
    min_payment: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SavingsAccount(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    label: Optional[str] = None
    balance: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
