
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.v0.deps import get_current_user
from app.models.user import User
from app.services.ai_analysis import AIAnalysisService

router = APIRouter(prefix="/ai")

class FeasibilityRequest(BaseModel):
    monthly_income: float
    fixed_expenses: float
    total_debt: float
    goal_name: str
    goal_target: float
    monthly_contribution: float

class FeasibilityResponse(BaseModel):
    analysis: str

class CheckInFeedbackRequest(BaseModel):
    score: float
    mood: int
    notes: str

class FeedbackResponse(BaseModel):
    feedback: str

class QuoteResponse(BaseModel):
    quote: str

@router.post("/feasibility", response_model=FeasibilityResponse)
async def analyze_feasibility(
    request: FeasibilityRequest,
    user: User = Depends(get_current_user)
):
    service = AIAnalysisService()
    analysis = await service.analyze_snapshot_feasibility(
        income=request.monthly_income,
        expenses=request.fixed_expenses,
        debt_total=request.total_debt,
        goal_name=request.goal_name,
        goal_target=request.goal_target,
        monthly_contribution=request.monthly_contribution
    )
    return FeasibilityResponse(analysis=analysis)

@router.post("/checkin-feedback", response_model=FeedbackResponse)
async def get_feedback(
    request: CheckInFeedbackRequest,
    user: User = Depends(get_current_user)
):
    service = AIAnalysisService()
    feedback = await service.get_checkin_feedback(
        moved_money_score=request.score,
        mood_score=request.mood,
        notes=request.notes
    )
    return FeedbackResponse(feedback=feedback)

@router.get("/quote", response_model=QuoteResponse)
async def get_quote():
    service = AIAnalysisService()
    quote = await service.get_motivational_quote()
    return QuoteResponse(quote=quote)
