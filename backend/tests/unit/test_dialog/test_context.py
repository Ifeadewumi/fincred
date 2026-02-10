import pytest
from app.services.dialog.context import ContextBuilder, DialogContext
from app.models.user import User, Profile
from app.models.goal import Goal
from app.models.snapshot import Income, ExpenseEstimate


class TestContextBuilder:
    """Tests for ContextBuilder."""

    def test_empty_context(self):
        """Test DialogContext can be created with minimal data."""
        context = DialogContext(
            user_id="uuid",
        )
        assert context.user_id == "uuid"
        assert context.monthly_income is None
        assert context.active_goals == []

    def test_context_with_financial_data(self):
        """Test context includes financial snapshot data."""
        context = DialogContext(
            user_id="uuid",
            monthly_income=5000.0,
            monthly_expenses=3000.0,
            estimated_surplus=2000.0,
        )
        assert context.monthly_income == 5000.0
        assert context.monthly_expenses == 3000.0
        assert context.estimated_surplus == 2000.0

    def test_to_prompt_string_basic(self):
        """Test context formatting for LLM."""
        context = DialogContext(
            user_id="uuid",
            monthly_income=5000.0,
            monthly_expenses=3000.0,
            estimated_surplus=2000.0,
        )
        prompt = context.to_prompt_string()
        assert "$5,000" in prompt or "$5000" in prompt
        assert "$3,000" in prompt or "$3000" in prompt
        assert "$2,000" in prompt or "$2000" in prompt

    def test_to_prompt_string_empty(self):
        """Test empty context returns default message."""
        context = DialogContext(user_id="uuid")
        prompt = context.to_prompt_string()
        assert "No financial data available" in prompt

    def test_get_summary_empty(self):
        """Test summary for new user."""
        context = DialogContext(user_id="uuid")
        summary = context.get_summary()
        assert summary == "New user"

    def test_get_summary_with_goals(self):
        """Test summary includes goal count."""
        context = DialogContext(
            user_id="uuid",
            monthly_income=5000.0,
            active_goals=[
                {"name": "Emergency Fund", "target_amount": 5000.0},
                {"name": "Vacation", "target_amount": 2000.0},
            ],
        )
        summary = context.get_summary()
        assert "2 active goals" in summary


class TestDialogContext:
    """Additional tests for DialogContext."""

    def test_persona_hint(self):
        """Test persona hint is stored correctly."""
        context = DialogContext(
            user_id="uuid",
            persona_hint="young_professional",
        )
        assert context.persona_hint == "young_professional"

    def test_debt_summary(self):
        """Test debt information is stored."""
        context = DialogContext(
            user_id="uuid",
            total_debt=15000.0,
            debt_count=2,
        )
        assert context.total_debt == 15000.0
        assert context.debt_count == 2

    def test_savings_summary(self):
        """Test savings information is stored."""
        context = DialogContext(
            user_id="uuid",
            total_savings=5000.0,
            savings_count=1,
        )
        assert context.total_savings == 5000.0
        assert context.savings_count == 1

    def test_recent_checkin(self):
        """Test check-in mood is stored."""
        context = DialogContext(
            user_id="uuid",
            recent_checkin_mood=4,
            days_since_last_checkin=3,
        )
        assert context.recent_checkin_mood == 4
        assert context.days_since_last_checkin == 3
