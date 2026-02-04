# app/schemas/planning.py
from datetime import date
from typing import List

from sqlmodel import SQLModel


class PlannedGoal(SQLModel):
    goal_id: int
    name: str
    type: str
    target_amount: float
    target_date: date
    required_monthly_contribution: float
    feasibility: str  # Comfortable, Tight, Unrealistic
    explanation: str


class PlanSummary(SQLModel):
    estimated_monthly_surplus: float
    total_required_contributions: float
    buffer_remaining: float


class PlanResponse(SQLModel):
    goals: List[PlannedGoal]
    summary: PlanSummary
