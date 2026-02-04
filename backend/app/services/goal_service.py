# backend/app/services/goal_service.py
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func # MOVED IMPORT

from app.models.goal import Goal
from app.models.user import User # Need to import User to type hint current_user
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate, GoalStatus # MOVED IMPORT


def get_all_goals(
    db: Session, user: User, limit: int = 20, offset: int = 0
) -> List[GoalRead]:
    """Retrieves a list of goals for a given user."""
    statement = (
        select(Goal)
        .where(Goal.user_id == user.id)
        .order_by(Goal.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    goals = db.exec(statement).all()
    return [GoalRead.model_validate(g) for g in goals]


def create_new_goal(db: Session, user: User, goal_in: GoalCreate) -> GoalRead:
    """Creates a new goal for a user with validation."""
    if goal_in.target_date <= date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_date must be in the future",
        )

    # FIX: Use func.count() and GoalStatus Enum
    active_count_statement = select(func.count(Goal.id)).where(Goal.user_id == user.id).where(Goal.status == GoalStatus.ACTIVE)
    active_count = db.exec(active_count_statement).one()

    if active_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of active goals reached",
        )

    try:
        goal = Goal(
            user_id=user.id,
            type=goal_in.type,
            name=goal_in.name,
            target_amount=goal_in.target_amount,
            target_date=goal_in.target_date,
            priority=goal_in.priority,
            primary_flag=goal_in.primary_flag,
            why_text=goal_in.why_text,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return GoalRead.model_validate(goal)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the goal: {e}",
        )


def get_goal_by_id(db: Session, user: User, goal_id: UUID) -> GoalRead:
    """Retrieves a single goal by its ID for a given user."""
    goal = db.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return GoalRead.model_validate(goal)


def update_existing_goal(
    db: Session, user: User, goal_id: UUID, goal_in: GoalUpdate
) -> GoalRead:
    """Updates an existing goal for a user with validation."""
    goal = db.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    update_data = goal_in.model_dump(exclude_unset=True)

    if "target_date" in update_data and update_data["target_date"] <= date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_date must be in the future",
        )

    try:
        for field, value in update_data.items():
            setattr(goal, field, value)
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return GoalRead.model_validate(goal)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the goal: {e}",
        )


def delete_user_goal(db: Session, user: User, goal_id: UUID) -> None:
    """Soft deletes (cancels) a goal for a user."""
    goal = db.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    try:
        # Soft delete: mark as cancelled instead of removing the row
        goal.status = GoalStatus.CANCELLED
        db.add(goal)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting the goal: {e}",
        )
