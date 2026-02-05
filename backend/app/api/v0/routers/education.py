# backend/app/api/v0/routers/education.py
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.education import EducationContextFeasibility, EducationSnippetRead, EducationTopic
from app.services import education_service

router = APIRouter(prefix="/education")


@router.get("/snippets", response_model=List[EducationSnippetRead])
def get_snippets(
    db: Session = Depends(get_session),
    topic: Optional[EducationTopic] = Query(None, description="Filter by topic"),
    context_goal_type: Optional[str] = Query(None, description="Filter by goal type (e.g., 'debt_payoff')"),
    context_feasibility: Optional[EducationContextFeasibility] = Query(None, description="Filter by feasibility context ('Comfortable', 'Tight', 'Unrealistic')"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Fetches education snippets based on optional filters.
    Authentication is not strictly required for reading education content.
    """
    # Note: Authentication not added here for education snippets as per API design,
    # but could be added if snippets are user-specific or sensitive.
    return education_service.get_education_snippets(
        db=db,
        topic=topic,
        context_goal_type=context_goal_type,
        context_feasibility=context_feasibility,
        limit=limit,
        offset=offset,
    )


@router.get("/snippets/{snippet_id}", response_model=EducationSnippetRead)
def get_snippet_by_id(
    snippet_id: UUID, # CHANGED
    db: Session = Depends(get_session),
):
    """
    Retrieves a single education snippet by its ID.
    Authentication is not strictly required for reading education content.
    """
    # Note: Authentication not added here for education snippets.
    return education_service.get_education_snippet_by_id(
        db=db, snippet_id=snippet_id
    )
