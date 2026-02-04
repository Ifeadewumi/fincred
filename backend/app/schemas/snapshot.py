# app/schemas/snapshot.py
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel


# --- Enums for data validation ---
class IncomeFrequency(str, Enum):
    MONTHLY = "monthly"
    BIWEEKLY = "biweekly"
    WEEKLY = "weekly"
    ANNUAL = "annual"


class DebtType(str, Enum):
    STUDENT_LOAN = "student_loan"
    CREDIT_CARD = "credit_card"
    PERSONAL_LOAN = "personal_loan"
    MORTGAGE = "mortgage"
    CAR_LOAN = "car_loan"
    OTHER = "other"


class IncomeIn(SQLModel):
    amount: float = Field(ge=0)
    frequency: IncomeFrequency  # Use the Enum for validation
    source_label: Optional[str] = None


class ExpenseEstimateIn(SQLModel):
    total_amount: float = Field(ge=0)


class DebtIn(SQLModel):
    type: DebtType  # Use the Enum for validation
    label: Optional[str] = None
    balance: float = Field(ge=0)
    interest_rate_annual: float = Field(ge=0)
    min_payment: float = Field(ge=0)


class SavingsIn(SQLModel):
    label: Optional[str] = None
    balance: float = Field(ge=0)


class SnapshotPutRequest(SQLModel):
    income: Optional[IncomeIn] = None
    expenses: Optional[ExpenseEstimateIn] = None
    debts: List[DebtIn] = []
    savings: List[SavingsIn] = []


class IncomeOut(IncomeIn):
    id: UUID


class ExpenseEstimateOut(ExpenseEstimateIn):
    id: UUID


class DebtOut(DebtIn):
    id: UUID


class SavingsOut(SavingsIn):
    id: UUID


class SnapshotResponse(SQLModel):
    income: Optional[IncomeOut] = None
    expenses: Optional[ExpenseEstimateOut] = None
    debts: List[DebtOut] = []
    savings: List[SavingsOut] = []
