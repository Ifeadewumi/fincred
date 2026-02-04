# app/services/planning.py
from __future__ import annotations

from datetime import date
from typing import List
from uuid import UUID # NEW IMPORT

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.goal import Goal
from app.models.snapshot import Income, ExpenseEstimate
from app.schemas.planning import PlannedGoal, PlanSummary, PlanResponse
from app.schemas.goal import GoalPriority, GoalStatus


def _months_between(start: date, end: date) -> int:
    """Rough month difference between two dates (>= 1).

    This doesn't need to be exact for MVP; it just needs to avoid zero.
    """
    if end <= start:
        return 0
    return (end.year - start.year) * 12 + (end.month - start.month) or 1


def generate_plan(user_id: int, db: Session) -> PlanResponse:
    # Get latest income & expenses for surplus estimate
    income = db.exec(
        select(Income).where(Income.user_id == user_id).order_by(Income.created_at.desc())
    ).first()
    expenses = db.exec(
        select(ExpenseEstimate)
        .where(ExpenseEstimate.user_id == user_id)
        .order_by(ExpenseEstimate.created_at.desc())
    ).first()

    if not income:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Income information is required to generate a plan. Please update your financial snapshot.",
        )
    if not expenses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense estimate is required to generate a plan. Please update your financial snapshot.",
        )

    from app.schemas.goal import GoalPriority, GoalStatus # NEW IMPORT

    estimated_surplus = float(income.amount - expenses.total_amount)

    # NEW: Define priority order
    priority_order = {
        GoalPriority.HIGH: 1,
        GoalPriority.MEDIUM: 2,
        GoalPriority.LOW: 3,
    }

    # Load active goals
    goals: List[Goal] = db.exec(
        select(Goal).where(Goal.user_id == user_id).where(Goal.status == GoalStatus.ACTIVE)
    ).all()

    # NEW: Sort goals by priority (High -> Medium -> Low), then by target_date (earliest first)
    goals.sort(key=lambda g: (priority_order[g.priority], g.target_date))


    today = date.today()
    planned_goals: List[PlannedGoal] = []

    # NEW: Allocation logic
    remaining_surplus_for_allocation = estimated_surplus
    total_allocated_contributions = 0.0

    for g in goals:
        months = _months_between(today, g.target_date.date())
        if months <= 0:
            # Goal is in the past or too close, mark as unrealistic
            required_contribution_for_goal = 0.0 # Cannot contribute
            feasibility = "Unrealistic"
            explanation = "Target date is in the past or too close to achieve."
        else:
            required_contribution_for_goal = float(g.target_amount) / months
            # Try to allocate from remaining surplus
            if remaining_surplus_for_allocation >= required_contribution_for_goal:
                # Fully meet this goal's requirement
                allocated_for_this_goal = required_contribution_for_goal
                remaining_surplus_for_allocation -= allocated_for_this_goal
                total_allocated_contributions += allocated_for_this_goal

                # Determine feasibility based on the overall picture
                # This could be more nuanced later, for now, if fully met it's Comfortable
                feasibility = "Comfortable"
                explanation = f"Fully funded based on your current surplus and priorities."

            else:
                # Not enough surplus to fully meet this goal's requirement
                if remaining_surplus_for_allocation > 0:
                    allocated_for_this_goal = remaining_surplus_for_allocation
                    remaining_surplus_for_allocation = 0.0 # Surplus is now depleted
                    total_allocated_contributions += allocated_for_this_goal
                    
                    feasibility = "Tight"
                    explanation = (
                        f"Partially funded with remaining surplus. "
                        f"To fully meet, you need to free up more cash or adjust this goal."
                    )
                else:
                    # No surplus left for this goal or subsequent lower priority goals
                    allocated_for_this_goal = 0.0
                    feasibility = "Unrealistic"
                    explanation = (
                        f"No surplus available to fund this goal after allocating to higher priority goals. "
                        f"Consider adjusting higher priority goals or increasing your surplus."
                    )
        
        planned_goals.append(
            PlannedGoal(
                goal_id=g.id,
                name=g.name,
                type=g.type,
                target_amount=float(g.target_amount),
                target_date=g.target_date.date(),
                required_monthly_contribution=allocated_for_this_goal, # Use allocated amount
                feasibility=feasibility,
                explanation=explanation,
            )
        )

    # NEW: Update summary based on allocation
    summary = PlanSummary(
        estimated_monthly_surplus=estimated_surplus, # Original surplus
        total_required_contributions=total_allocated_contributions, # Total actually allocated
        buffer_remaining=remaining_surplus_for_allocation, # Remaining after allocation
    )

    return PlanResponse(goals=planned_goals, summary=summary)
