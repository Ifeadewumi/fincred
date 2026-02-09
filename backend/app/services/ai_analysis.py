
from typing import Optional
from sqlmodel import Session

from app.core.config import settings
from app.core.logging_config import get_logger
from app.llm.providers.gemini import GeminiProvider
from app.llm.providers.base import Message
from app.llm.exceptions import LLMError
from app.models.user import User
from app.models.goal import Goal
from app.models.snapshot import Income, ExpenseEstimate, Debt

logger = get_logger(__name__)

class AIAnalysisService:
    def __init__(self):
        self.api_key = settings.GOOGLE_AI_API_KEY
        self.model = "gemini-2.0-flash" # Use fast model for UI interactions
        
        if not self.api_key:
            logger.warning("GOOGLE_AI_API_KEY not set. AI features will fail.")
            self.provider = None
        else:
            self.provider = GeminiProvider(
                api_key=self.api_key,
                model=self.model,
                temperature=0.7
            )

    async def _generate(self, prompt: str) -> str:
        if not self.provider:
            return "AI service unavailable. Please check backend configuration."
        try:
            response = await self.provider.generate([Message(role="user", content=prompt)])
            return response.content
        except Exception as e:
            logger.error(f"AI Generation failed: {e}")
            return "I'm having trouble analyzing that right now. Please try again."

    async def get_feasibility_analysis(self, user: User, goal_name: str, target_amount: float, monthly_contribution: float) -> str:
        # Construct a simple context from user data
        # Note: In a real app, we'd fetch actual snapshot data here or pass it in
        
        prompt = f"""
        Act as a empathetic financial coach. Analyze the feasibility of this goal:
        
        Goal: {goal_name}
        Target: {target_amount}
        Proposed Monthly Contribution: {monthly_contribution}
        
        User Context:
        - Income: (Unknown from this context, assume generic or ask for it if needed, but for MVP we focus on the math provided)
        
        Wait, I need the snapshot data. 
        
        Task:
        1. Determine if saving {monthly_contribution} is realistic for a typical person or based on provided data.
        2. Label it as "Comfortable", "Tight", or "Unrealistic".
        3. Explain why in 2 sentences.
        
        Current User Snapshot (if available):
        - Income: {user.monthly_income if hasattr(user, 'monthly_income') else 'Not set'}
        """
        
        # Better approach: Pass full snapshot data to this method
        return await self._generate(prompt)

    async def analyze_snapshot_feasibility(self, income: float, expenses: float, debt_total: float, goal_name: str, goal_target: float, monthly_contribution: float) -> str:
        wiggle_room = income - expenses - monthly_contribution
        
        prompt = f"""
        Act as a financial coach. Analyze this financial plan:
        
        Financial Snapshot:
        - Monthly Net Income: {income}
        - Fixed Expenses: {expenses}
        - Total Debt: {debt_total}
        
        Goal: {goal_name} (Target: {goal_target})
        Proposed Monthly Saving: {monthly_contribution}
        
        Remaining "Wiggle Room" after expenses and this goal: {wiggle_room}
        
        Task:
        1. Classify this plan as "Comfortable", "Tight", or "Unrealistic".
        2. Provide a 2-sentence explanation.
        3. Be encouraging but realistic.
        """
        return await self._generate(prompt)

    async def get_checkin_feedback(self, moved_money_score: float, mood_score: int, notes: str) -> str:
        status = "Completed" if moved_money_score == 1.0 else ("Partial" if moved_money_score > 0 else "Missed")
        
        prompt = f"""
        User just completed a weekly financial check-in.
        - Action Status: {status}
        - Mood (1-5): {mood_score}
        - Note: "{notes}"
        
        Provide 2 sentences of feedback.
        - If success: Celebrate it.
        - If missed: Be compassionate and suggest a small step.
        - Acknowledge their mood if extremely high or low.
        """
        return await self._generate(prompt)

    async def get_motivational_quote(self) -> str:
        prompt = "Give me one short, punchy, original financial motivation quote. No attribution."
        return await self._generate(prompt)
