# backend/app/services/education_service.py
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.education import EducationSnippet
from app.schemas.education import EducationContextFeasibility, EducationTopic, EducationSnippetRead


def get_education_snippets(
    db: Session,
    topic: Optional[EducationTopic] = None,
    context_goal_type: Optional[str] = None, # Corresponds to GoalType
    context_feasibility: Optional[EducationContextFeasibility] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[EducationSnippetRead]:
    """Retrieves education snippets based on optional filters."""
    statement = select(EducationSnippet)

    if topic:
        statement = statement.where(EducationSnippet.topic == topic)
    if context_goal_type:
        statement = statement.where(EducationSnippet.context_goal_type == context_goal_type)
    if context_feasibility:
        statement = statement.where(EducationSnippet.context_feasibility == context_feasibility)

    statement = statement.limit(limit).offset(offset)
    snippets = db.exec(statement).all()
    return [EducationSnippetRead.model_validate(s) for s in snippets]


def get_education_snippet_by_id(db: Session, snippet_id: UUID) -> EducationSnippetRead:
    """Retrieves a single education snippet by its ID."""
    snippet = db.get(EducationSnippet, snippet_id)
    if not snippet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education Snippet not found")
    return EducationSnippetRead.model_validate(snippet)

