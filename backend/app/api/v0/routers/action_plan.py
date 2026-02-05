# backend/app/api/v0/routers/action_plan.py
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlmodel import Session

from app.api.v0.deps import get_current_user
from app.models.user import User
from app.schemas.action_plan import ActionPlanCreate, ActionPlanRead, ActionPlanUpdate
from app.services import action_plan_service
from app.db.session import get_session # Need to import get_session for direct use in router

router = APIRouter()


@router.get("/action-plans", response_model=List[ActionPlanRead])
def list_my_action_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session), # Use get_session directly
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Retrieves a list of all action plans for the current user.
    """
    return action_plan_service.get_action_plans_for_user(
        db=db, user=current_user, limit=limit, offset=offset
    )


@router.post("/goals/{goal_id}/action-plans", response_model=ActionPlanRead, status_code=status.HTTP_201_CREATED)
def create_action_plan_for_goal(
    goal_id: UUID, # CHANGED
    action_plan_in: ActionPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session), # Use get_session directly
):
    """
    Creates a new action plan for a specific goal belonging to the current user.
    """
    # Ensure the goal_id in the path matches the goal_id in the request body (if provided)
    # The ActionPlanCreate schema already includes goal_id.
    # We should ensure consistency.
    if action_plan_in.goal_id != goal_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal ID in path and request body must match.",
        )
    return action_plan_service.create_new_action_plan(
        db=db, user=current_user, action_plan_in=action_plan_in
    )


@router.get("/action-plans/{action_plan_id}", response_model=ActionPlanRead)
def get_action_plan(
    action_plan_id: UUID, # CHANGED
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session), # Use get_session directly
):
    """
    Retrieves a single action plan by ID for the current user.
    """
    return action_plan_service.get_action_plan_by_id(
        db=db, user=current_user, action_plan_id=action_plan_id
    )


@router.put("/action-plans/{action_plan_id}", response_model=ActionPlanRead)
def update_action_plan(
    action_plan_id: UUID, # CHANGED
    action_plan_in: ActionPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session), # Use get_session directly
):
    """
    Updates an existing action plan for the current user.
    """
    return action_plan_service.update_existing_action_plan(
        db=db, user=current_user, action_plan_id=action_plan_id, action_plan_in=action_plan_in
    )


@router.delete("/action-plans/{action_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_plan(
    action_plan_id: UUID, # CHANGED
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session), # Use get_session directly
):
    """
    Deletes an action plan for the current user.
    """
    action_plan_service.delete_user_action_plan(
        db=db, user=current_user, action_plan_id=action_plan_id
    )
    return None
