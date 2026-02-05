# app/services/dialog/context.py
"""
Context building for dialog sessions.

Aggregates user financial data into a context object that can be
injected into LLM prompts for personalized conversations.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from decimal import Decimal

from app.models.user import User
from app.models.goal import Goal
from app.models.snapshot import Income, ExpenseEstimate, Debt, SavingsAccount
from app.models.tracking import CheckIn
from app.schemas.goal import GoalStatus
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class DialogContext(BaseModel):
    """
    Represents the conversation context with user's financial data.
    
    This is the structured data that gets injected into LLM prompts
    to provide personalized, contextual responses.
    """
    
    # User info
    user_id: int
    user_name: Optional[str] = None
    persona_hint: Optional[str] = None
    
    # Financial snapshot
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    estimated_surplus: Optional[float] = None
    
    # Goals summary
    active_goals: List[Dict[str, Any]] = Field(default_factory=list)
    total_goal_target: Optional[float] = None
    
    # Debts summary
    total_debt: Optional[float] = None
    debt_count: int = 0
    
    # Savings summary
    total_savings: Optional[float] = None
    savings_count: int = 0
    
    # Recent activity
    recent_checkin_mood: Optional[int] = None
    days_since_last_checkin: Optional[int] = None
    
    # Plan summary (if available)
    plan_summary: Optional[Dict[str, Any]] = None
    
    def to_prompt_string(self) -> str:
        """
        Convert context to a formatted string for LLM prompts.
        
        Returns:
            Human-readable context string
        """
        sections = []
        
        # User profile
        if self.persona_hint:
            sections.append(f"**User Profile**: {self.persona_hint}")
        
        # Financial situation
        if self.monthly_income is not None:
            income_str = f"${self.monthly_income:,.0f}/month"
            expense_str = f"${self.monthly_expenses:,.0f}/month" if self.monthly_expenses else "Unknown"
            surplus_str = f"${self.estimated_surplus:,.0f}" if self.estimated_surplus else "Unknown"
            
            sections.append(
                f"**Financial Snapshot**:\n"
                f"  - Monthly Income: {income_str}\n"
                f"  - Monthly Expenses: {expense_str}\n"
                f"  - Estimated Surplus: {surplus_str}"
            )
        
        # Debts
        if self.total_debt and self.total_debt > 0:
            sections.append(
                f"**Debts**: {self.debt_count} debt(s) totaling ${self.total_debt:,.0f}"
            )
        
        # Savings
        if self.total_savings and self.total_savings > 0:
            sections.append(
                f"**Savings**: {self.savings_count} account(s) totaling ${self.total_savings:,.0f}"
            )
        
        # Active goals
        if self.active_goals:
            goals_list = []
            for goal in self.active_goals[:5]:  # Limit to top 5
                goals_list.append(
                    f"  - {goal.get('name', 'Unnamed')}: "
                    f"${goal.get('target_amount', 0):,.0f} by {goal.get('target_date', 'N/A')} "
                    f"(Priority: {goal.get('priority', 'N/A')})"
                )
            
            sections.append(f"**Active Goals** ({len(self.active_goals)} total):\n" + "\n".join(goals_list))
        else:
            sections.append("**Active Goals**: None yet")
        
        # Recent activity
        if self.recent_checkin_mood:
            mood_map = {1: "😞 Low", 2: "😕 Below average", 3: "😐 Neutral", 4: "🙂 Good", 5: "😊 Great"}
            sections.append(f"**Recent Mood**: {mood_map.get(self.recent_checkin_mood, 'Unknown')}")
        
        if self.days_since_last_checkin is not None:
            sections.append(f"**Last Check-in**: {self.days_since_last_checkin} days ago")
        
        # Plan summary
        if self.plan_summary:
            plan_str = (
                f"**Current Plan**:\n"
                f"  - Surplus: ${self.plan_summary.get('estimated_monthly_surplus', 0):,.0f}\n"
                f"  - Total Allocated: ${self.plan_summary.get('total_required_contributions', 0):,.0f}\n"
                f"  - Buffer Remaining: ${self.plan_summary.get('buffer_remaining', 0):,.0f}"
            )
            sections.append(plan_str)
        
        return "\n\n".join(sections) if sections else "No financial data available yet."
    
    def get_summary(self) -> str:
        """
        Get a brief one-line summary of the user's situation.
        
        Returns:
            Brief summary string
        """
        parts = []
        
        if self.monthly_income:
            parts.append(f"Income: ${self.monthly_income:,.0f}/mo")
        
        if self.active_goals:
            parts.append(f"{len(self.active_goals)} active goals")
        
        if self.total_debt and self.total_debt > 0:
            parts.append(f"${self.total_debt:,.0f} debt")
        
        return " | ".join(parts) if parts else "New user"


class ContextBuilder:
    """
    Builds dialog context from database for a given user.
    
    Aggregates financial snapshot, goals, debts, savings, and recent
    activity into a DialogContext for LLM prompts.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the context builder.
        
        Args:
            db: SQLModel database session
        """
        self.db = db
    
    def build(self, user: User) -> DialogContext:
        """
        Build full dialog context for a user.
        
        Args:
            user: User model instance
        
        Returns:
            DialogContext with all available data
        """
        context = DialogContext(
            user_id=user.id,
            user_name=user.email.split("@")[0] if user.email else None,
        )
        
        # Get profile info
        if user.profile:
            context.persona_hint = user.profile.persona_hint
        
        # Get income and expenses
        self._add_financial_snapshot(user.id, context)
        
        # Get goals
        self._add_goals(user.id, context)
        
        # Get debts
        self._add_debts(user.id, context)
        
        # Get savings
        self._add_savings(user.id, context)
        
        # Get recent check-in
        self._add_recent_checkin(user.id, context)
        
        # Calculate surplus
        if context.monthly_income and context.monthly_expenses:
            context.estimated_surplus = context.monthly_income - context.monthly_expenses
        
        # Try to get plan summary
        self._add_plan_summary(user.id, context)
        
        return context
    
    def _add_financial_snapshot(self, user_id: int, context: DialogContext) -> None:
        """Add income and expense data to context."""
        try:
            # Get latest income
            income = self.db.exec(
                select(Income)
                .where(Income.user_id == user_id)
                .order_by(Income.created_at.desc())
            ).first()
            
            if income:
                context.monthly_income = float(income.amount)
            
            # Get latest expenses
            expenses = self.db.exec(
                select(ExpenseEstimate)
                .where(ExpenseEstimate.user_id == user_id)
                .order_by(ExpenseEstimate.created_at.desc())
            ).first()
            
            if expenses:
                context.monthly_expenses = float(expenses.total_amount)
                
        except Exception as e:
            logger.warning(f"Failed to load financial snapshot for user {user_id}: {e}")
    
    def _add_goals(self, user_id: int, context: DialogContext) -> None:
        """Add goals data to context."""
        try:
            goals = self.db.exec(
                select(Goal)
                .where(Goal.user_id == user_id)
                .where(Goal.status == GoalStatus.ACTIVE)
                .order_by(Goal.is_primary.desc(), Goal.created_at)
            ).all()
            
            context.active_goals = [
                {
                    "name": g.name,
                    "type": g.type,
                    "target_amount": float(g.target_amount),
                    "target_date": g.target_date.isoformat() if g.target_date else None,
                    "priority": g.priority.value if g.priority else None,
                    "why_text": g.why_text,
                }
                for g in goals
            ]
            
            context.total_goal_target = sum(
                float(g.target_amount) for g in goals
            ) if goals else 0
            
        except Exception as e:
            logger.warning(f"Failed to load goals for user {user_id}: {e}")
    
    def _add_debts(self, user_id: int, context: DialogContext) -> None:
        """Add debts data to context."""
        try:
            debts = self.db.exec(
                select(Debt).where(Debt.user_id == user_id)
            ).all()
            
            context.debt_count = len(debts)
            context.total_debt = sum(float(d.balance) for d in debts) if debts else 0
            
        except Exception as e:
            logger.warning(f"Failed to load debts for user {user_id}: {e}")
    
    def _add_savings(self, user_id: int, context: DialogContext) -> None:
        """Add savings data to context."""
        try:
            savings = self.db.exec(
                select(SavingsAccount).where(SavingsAccount.user_id == user_id)
            ).all()
            
            context.savings_count = len(savings)
            context.total_savings = sum(float(s.balance) for s in savings) if savings else 0
            
        except Exception as e:
            logger.warning(f"Failed to load savings for user {user_id}: {e}")
    
    def _add_recent_checkin(self, user_id: int, context: DialogContext) -> None:
        """Add recent check-in data to context."""
        try:
            from datetime import datetime, timedelta
            
            checkin = self.db.exec(
                select(CheckIn)
                .where(CheckIn.user_id == user_id)
                .order_by(CheckIn.created_at.desc())
            ).first()
            
            if checkin:
                context.recent_checkin_mood = checkin.mood_score
                
                # Calculate days since last check-in
                if checkin.created_at:
                    delta = datetime.utcnow() - checkin.created_at
                    context.days_since_last_checkin = delta.days
                    
        except Exception as e:
            logger.warning(f"Failed to load check-in for user {user_id}: {e}")
    
    def _add_plan_summary(self, user_id: int, context: DialogContext) -> None:
        """Add plan summary to context if data is available."""
        try:
            if not context.monthly_income or not context.monthly_expenses:
                return
            
            from app.services.planning import generate_plan
            
            plan_response = generate_plan(user_id=user_id, db=self.db)
            
            if plan_response and plan_response.summary:
                context.plan_summary = {
                    "estimated_monthly_surplus": plan_response.summary.estimated_monthly_surplus,
                    "total_required_contributions": plan_response.summary.total_required_contributions,
                    "buffer_remaining": plan_response.summary.buffer_remaining,
                }
                
        except Exception as e:
            # Plan generation may fail if data is incomplete - this is expected
            logger.debug(f"Could not generate plan for context: {e}")
