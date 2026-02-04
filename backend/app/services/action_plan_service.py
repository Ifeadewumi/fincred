# backend/app/services/action_plan_service.py
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.action_plan import ActionPlan
from app.models.goal import Goal
from app.models.user import User
from app.schemas.action_plan import ActionPlanCreate, ActionPlanRead, ActionPlanUpdate


def get_action_plans_for_user(
    db: Session, user: User, limit: int = 20, offset: int = 0
) -> List[ActionPlanRead]:
    """Retrieves a list of action plans for a given user."""
    statement = (
        select(ActionPlan)
        .where(ActionPlan.user_id == user.id)
        .order_by(ActionPlan.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    action_plans = db.exec(statement).all()
    return [ActionPlanRead.model_validate(ap) for ap in action_plans]


def get_action_plans_for_goal(
    db: Session, user: User, goal_id: UUID, limit: int = 20, offset: int = 0
) -> List[ActionPlanRead]:
    """Retrieves a list of action plans for a specific goal belonging to the user."""
    goal = db.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    statement = (
        select(ActionPlan)
        .where(ActionPlan.user_id == user.id)
        .where(ActionPlan.goal_id == goal_id)
        .order_by(ActionPlan.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    action_plans = db.exec(statement).all()
    return [ActionPlanRead.model_validate(ap) for ap in action_plans]


def create_new_action_plan(
    db: Session, user: User, action_plan_in: ActionPlanCreate
) -> ActionPlanRead:
    """Creates a new action plan for a user's goal."""
    goal = db.get(Goal, action_plan_in.goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    try:
        action_plan = ActionPlan(user_id=user.id, **action_plan_in.dict())
        db.add(action_plan)
        db.commit()
        db.refresh(action_plan)
        return ActionPlanRead.model_validate(action_plan)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the action plan: {e}",
        )


def get_action_plan_by_id(db: Session, user: User, action_plan_id: UUID) -> ActionPlanRead:
    """Retrieves a single action plan by its ID for a given user."""
    action_plan = db.get(ActionPlan, action_plan_id)
    if not action_plan or action_plan.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action Plan not found")
    return ActionPlanRead.model_validate(action_plan)


def update_existing_action_plan(
    db: Session, user: User, action_plan_id: UUID, action_plan_in: ActionPlanUpdate
) -> ActionPlanRead:
    """Updates an existing action plan for a user."""
    action_plan = db.get(ActionPlan, action_plan_id)
    if not action_plan or action_plan.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action Plan not found")

    update_data = action_plan_in.dict(exclude_unset=True)

    try:
        for field, value in update_data.items():
            setattr(action_plan, field, value)
        db.add(action_plan)
        db.commit()
        db.refresh(action_plan)
        return ActionPlanRead.model_validate(action_plan)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the action plan: {e}",
        )


def delete_user_action_plan(db: Session, user: User, action_plan_id: UUID) -> None:
    """Deletes an action plan for a user."""
    action_plan = db.get(ActionPlan, action_plan_id)
    if not action_plan or action_plan.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action Plan not found")

    try:
        db.delete(action_plan)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting the action plan: {e}",
        )