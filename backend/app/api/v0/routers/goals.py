# app/api/v0/routers/goals.py
from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session
from uuid import UUID

from app.api.v0.deps import get_current_user, get_db
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate
from app.services import goal_service # Import the service

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalRead])
def list_goals(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Retrieves a list of goals for the current user."""
    return goal_service.get_all_goals(db=db, user=current_user, limit=limit, offset=offset)


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new goal for the current user."""
    return goal_service.create_new_goal(db=db, user=current_user, goal_in=goal_in)


@router.get("/{goal_id}", response_model=GoalRead)
def get_goal(
    goal_id: UUID, # CHANGED
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a single goal by ID for the current user."""
    return goal_service.get_goal_by_id(db=db, user=current_user, goal_id=goal_id)


@router.put("/{goal_id}", response_model=GoalRead)
def update_goal(
    goal_id: UUID, # CHANGED
    goal_in: GoalUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates an existing goal for the current user."""
    return goal_service.update_existing_goal(db=db, user=current_user, goal_id=goal_id, goal_in=goal_in)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: UUID, # CHANGED
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft deletes (cancels) a goal for the current user."""
    goal_service.delete_user_goal(db=db, user=current_user, goal_id=goal_id)
    return None
