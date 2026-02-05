# app/api/v0/routers/planning.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from uuid import UUID

from app.api.v0.deps import get_current_user, get_db
from app.schemas.planning import PlanResponse
from app.services.planning import generate_plan

router = APIRouter(prefix="/planning")


@router.post("/plan", response_model=PlanResponse)
def generate_user_plan(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a simple monthly contribution plan for the user's active goals.

    Uses the latest income & expense snapshot plus active goals to estimate
    required monthly contributions and feasibility labels.
    """
    return generate_plan(user_id=current_user.id, db=db)
