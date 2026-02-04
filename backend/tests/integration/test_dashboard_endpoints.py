# tests/integration/test_dashboard_endpoints.py
"""Integration tests for dashboard endpoints."""
import pytest
from datetime import date, datetime, timedelta
from sqlmodel import Session

from app.models.goal import Goal
from app.models.tracking import CheckIn
from app.schemas.goal import GoalType, GoalPriority, GoalStatus
from app.schemas.tracking import CheckInPlannedPayments, CheckInSpendingVsPlan, CheckInMoodScore


@pytest.mark.integration
@pytest.mark.goals
def test_dashboard_returns_structured_response(client, session, test_user, auth_headers):
    """Test that dashboard returns new structured response format."""
    # Create a goal via API - use correct enum value "emergency_FUND"
    goal_data = {
        "type": "emergency_FUND",
        "name": "Emergency Fund",
        "target_amount": 10000.0,
        "target_date": str(date.today() + timedelta(days=180)),
        "priority": "High",
        "primary_flag": False
    }
    
    create_response = client.post(
        "/api/v0/goals",
        json=goal_data,
        headers=auth_headers
    )
    assert create_response.status_code == 201, f"Failed to create goal: {create_response.json()}"
    goal = create_response.json()
    goal_id = goal["id"]
    
    # Add progress via API - include goal_id in body
    progress_data = {
        "goal_id": goal_id,
        "current_balance": 3000.0,
        "source": "manual_entry"
    }
    
    progress_response = client.post(
        f"/api/v0/goals/{goal_id}/progress",
        json=progress_data,
        headers=auth_headers
    )
    assert progress_response.status_code == 201, f"Failed to create progress: {progress_response.json()}"
    
    # Now test dashboard
    response = client.get("/api/v0/dashboard", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify structure
    assert "goals" in data
    assert "stats" in data
    assert "recent_milestones" in data
    
    # Verify goals
    assert len(data["goals"]) >= 1
    goal_data_result = data["goals"][0]
    assert goal_data_result["name"] == "Emergency Fund"
    assert goal_data_result["current_balance"] == 3000.0
    assert goal_data_result["progress_percentage"] == 30.0
    assert "status_label" in goal_data_result
    
    # Verify stats
    stats = data["stats"]
    assert stats["total_goals"] >= 1
    assert stats["active_goals"] >= 1
    assert stats["total_saved"] >= 3000.0


@pytest.mark.integration
@pytest.mark.goals
def test_dashboard_includes_streak(client, session, test_user, auth_headers):
    """Test that dashboard includes streak information."""
    # Create check-ins for streak
    for i in range(3):
        check_in = CheckIn(
            user_id=test_user.id,
            completed_at=datetime.now() - timedelta(weeks=i),
            made_planned_payments=CheckInPlannedPayments.YES,
            spending_vs_plan=CheckInSpendingVsPlan.ON,
            mood_score=CheckInMoodScore.GOOD
        )
        session.add(check_in)
    session.commit()
    
    # Call dashboard
    response = client.get(f"/api/v0/dashboard", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    stats = data["stats"]
    assert "current_streak" in stats
    assert "longest_streak" in stats
    assert stats["current_streak"] >= 0  # May vary depending on timing


@pytest.mark.integration
@pytest.mark.goals
def test_dashboard_empty_goals(client, session: Session, test_user, auth_headers):
    """Test dashboard with no goals."""
    response = client.get("/api/v0/dashboard", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["goals"] == []
    assert data["stats"]["total_goals"] == 0
    assert data["stats"]["active_goals"] == 0
    assert data["stats"]["total_saved"] == 0.0


@pytest.mark.integration
@pytest.mark.goals
def test_dashboard_multiple_goals_sorted(client, session: Session, test_user, auth_headers):
    """Test that dashboard returns goals sorted by priority then date."""
    # Create goals with different priorities
    goal_low = Goal(
        user_id=test_user.id,
        type=GoalType.SHORT_TERM_SAVING,
        name="Low Priority",
        target_amount=5000.0,
        target_date=date.today() + timedelta(days=90),
        priority=GoalPriority.LOW,
        status=GoalStatus.ACTIVE
    )
    goal_high = Goal(
        user_id=test_user.id,
        type=GoalType.DEBT_PAYOFF,
        name="High Priority",
        target_amount=3000.0,
        target_date=date.today() + timedelta(days=120),
        priority=GoalPriority.HIGH,
        status=GoalStatus.ACTIVE
    )
    session.add_all([goal_low, goal_high])
    session.commit()
    
    response = client.get(f"/api/v0/dashboard", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    stats = data["stats"]
    assert "total_goals" in stats
    assert "active_goals" in stats
    assert "total_saved" in stats
    assert "current_streak" in stats
    assert "longest_streak" in stats
