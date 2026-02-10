from typing import Optional
from uuid import UUID
from app.models.user import User
from app.schemas.planning import PlanResponse, PlannedGoal
from app.llm.prompts.manager import PromptManager
from app.llm.providers.fallback import FallbackChain
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class PlanningExplanationService:
    """Generates LLM-powered explanations for planning decisions."""

    def __init__(
        self,
        llm: FallbackChain,
        prompt_manager: PromptManager,
    ):
        self.llm = llm
        self.prompts = prompt_manager

    async def generate_feasibility_explanation(
        self,
        user: User,
        goal: PlannedGoal,
        monthly_income: float,
        monthly_expenses: float,
        why_text: Optional[str] = None,
    ) -> str:
        """
        Generate personalized explanation for feasibility label.

        Args:
            goal: The planned goal with feasibility info
            monthly_income: User's monthly income
            monthly_expenses: User's monthly expenses
            why_text: User's motivation for this goal

        Returns:
            Natural language explanation of feasibility
        """
        context = {
            "goal_name": goal.name,
            "target_amount": f"${goal.target_amount:,.0f}",
            "target_date": goal.target_date.isoformat()
            if hasattr(goal.target_date, "isoformat")
            else str(goal.target_date),
            "required_monthly": f"${goal.required_monthly_contribution:,.0f}",
            "feasibility": goal.feasibility,
            "monthly_income": f"${monthly_income:,.0f}",
            "monthly_expenses": f"${monthly_expenses:,.0f}",
            "why_text": why_text or "No motivation provided",
        }

        system_prompt = self.prompts.get_system_prompt(
            intent="plan_explanation",
            context=context,
        )

        # Generate explanation
        messages = [{"role": "system", "content": system_prompt}]

        user_prompt = f"""
        Please explain why the goal "{goal.name}" is marked as {goal.feasibility}.

        The user needs to contribute ${goal.required_monthly_contribution:,.0f}/month.
        Their monthly surplus is ${monthly_income - monthly_expenses:,.0f}.

        User's motivation: {why_text or "Not specified"}

        Provide a supportive, clear explanation in 2-3 sentences.
        """
        messages.append({"role": "user", "content": user_prompt})

        response = await self.llm.generate(messages=messages)
        return response.content

    async def generate_whatif_explanation(
        self,
        user: User,
        original_plan: PlanResponse,
        scenario_description: str,
    ) -> str:
        """
        Generate explanation for what-if scenario.

        Example scenarios:
        - "What if I reduce expenses by $200/month?"
        - "What if I get a $500 bonus?"
        - "What if I extend the timeline by 3 months?"
        """
        context = {
            "original_plan_summary": original_plan.summary.model_dump()
            if original_plan.summary
            else {},
            "scenario": scenario_description,
        }

        # Use plan_explanation template with scenario context
        system_prompt = self.prompts.get_system_prompt(
            intent="plan_explanation",
            context=context,
        )

        messages = [{"role": "system", "content": system_prompt}]

        user_prompt = f"""
        User wants to explore this scenario: {scenario_description}

        Analyze the impact and provide specific advice.
        Consider:
        1. How does this affect goal timelines?
        2. Is the new plan more comfortable or tight?
        3. What specific actions should the user take?

        Keep response helpful and actionable.
        """
        messages.append({"role": "user", "content": user_prompt})

        response = await self.llm.generate(messages=messages)
        return response.content
