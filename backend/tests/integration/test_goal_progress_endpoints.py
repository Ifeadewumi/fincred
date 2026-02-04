# tests/integration/test_goal_progress_endpoints.py
"""Integration tests for goal progress endpoints."""
import pytest
from datetime import date, timedelta


@pytest.mark.integration
@pytest.mark.goals
def test_create_progress_record(client, session, test_user, auth_headers):
    """Test creating a new progress record."""
    # Create a goal via API - use correct enum value
    goal_data = {
        "type": "emergency_FUND",
        "name": "Emergency Fund",
        "target_amount": 10000.0,
        "target_date": str(date.today() + timedelta(days=180)),
        "priority": "High"
    }
    create_response = client.post("/api/v0/goals", json=goal_data, headers=auth_headers)
    assert create_response.status_code == 201, f"Failed to create goal: {create_response.json()}"
    goal = create_response.json()
    goal_id = goal["id"]
    
    # Create progress record - include goal_id in body
    progress_data = {
        "goal_id": goal_id,
        "current_balance": 2500.0,
        "source": "manual_entry",
        "note": "First month savings"
    }
    
    response = client.post(
        f"/api/v0/goals/{goal_id}/progress",
        json=progress_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201, f"Failed to create progress: {response.json()}"
    data = response.json()
    
    assert "progress" in data
    assert "milestones_reached" in data
    assert "message" in data
    
    assert data["progress"]["current_balance"] == 2500.0


@pytest.mark.integration
@pytest.mark.goals
def test_list_progress_history(client, session: Session, test_user, auth_headers):
    """Test listing progress history for a goal."""
    # Create a goal
    goal = Goal(
        user_id=test_user.id,
        type=GoalType.EMERGENCY_FUND,
        name="Emergency Fund",
        target_amount=10000.0,
        target_date=date.today() + timedelta(days=180),
        priority=GoalPriority.HIGH,
        status=GoalStatus.ACTIVE
    )
    session.add(goal)
    session.commit()
    
    # Add multiple progress records
    for amount in [1000, 2000, 3000]:
        progress = GoalProgress(
            user_id=test_user.id,
            goal_id=goal.id,
            current_balance=amount,
            source=GoalProgressSource.MANUAL_ENTRY
        )
        session.add(progress)
    session.commit()
    
    # Get progress history
    response = client.get(
        f"/api/v0/goals/{goal.id}/progress",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    progress_list = response.json()
    
    assert len(progress_list) == 3
    # Should be in reverse chronological order (newest first)
    assert progress_list[0]["current_balance"] == 3000.0


@pytest.mark.integration
@pytest.mark.goals
def test_progress_triggers_milestone(client, session: Session, test_user, auth_headers):
    """Test that progress update triggers milestone detection."""
    # Create a goal via API - use correct enum value
    goal_data = {
        "type": "debt_payoff",
        "name": "Credit Card",
        "target_amount": 10000.0,
        "target_date": str(date.today() + timedelta(days=180)),
        "priority": "High"
    }
    create_response = client.post("/api/v0/goals", json=goal_data, headers=auth_headers)
    assert create_response.status_code == 201, f"Failed to create goal: {create_response.json()}"
    goal = create_response.json()
    goal_id = goal["id"]
    
    # Add initial progress via API - include goal_id in body
    initial_progress_data = {
        "goal_id": goal_id,
        "current_balance": 2000.0,
        "source": "manual_entry"
    }
    client.post(f"/api/v0/goals/{goal_id}/progress", json=initial_progress_data, headers=auth_headers)
    
    # Update to cross 25% milestone (2500)
    progress_data = {
        "goal_id": goal_id,
        "current_balance": 2600.0,
        "source": "manual_entry"
    }
    
    response = client.post(
        f"/api/v0/goals/{goal_id}/progress",
        json=progress_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201, f"Failed to create progress: {response.json()}"
    data = response.json()
    
    assert "25%" in data["milestones_reached"]
    assert "Milestones reached" in data["message"]


@pytest.mark.integration
@pytest.mark.goals
def test_progress_pagination(client, session: Session, test_user, auth_headers):
    """Test pagination of progress history."""
    # Create a goal
    goal = Goal(
        user_id=test_user.id,
        type=GoalType.EMERGENCY_FUND,
        name="Emergency Fund",
        target_amount=10000.0,
        target_date=date.today() + timedelta(days=180),
        priority=GoalPriority.HIGH,
        status=GoalStatus.ACTIVE
    )
    session.add(goal)
    session.commit()
    
    # Add 25 progress records
    for i in range(25):
        progress = GoalProgress(
            user_id=test_user.id,
            goal_id=goal.id,
            current_balance=100.0 * (i + 1),
            source=GoalProgressSource.MANUAL_ENTRY
        )
        session.add(progress)
    session.commit()
    
    # Get first page (default limit 20)
    response = client.get(
        f"/api/v0/goals/{goal.id}/progress",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    first_page = response.json()
    assert len(first_page) == 20
    
    # Get second page
    response = client.get(
        f"/api/v0/goals/{goal.id}/progress?offset=20&limit=10",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    second_page = response.json()
    assert len(second_page) == 5  # Remaining records


@pytest.mark.integration
@pytest.mark.goals
def test_progress_goal_not_found(client, session: Session, test_user, auth_headers):
    """Test creating progress for non-existent goal."""
    fake_goal_id = "00000000-0000-0000-0000-000000000000"
    
    # Include goal_id in body
    progress_data = {
        "goal_id": fake_goal_id,
        "current_balance": 1000.0,
        "source": "manual_entry"
    }
    
    response = client.post(
        f"/api/v0/goals/{fake_goal_id}/progress",
        json=progress_data,
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.goals
def test_get_progress_history(client, session, test_user, auth_headers):
    """Test getting progress history for a goal."""
    # Create a goal via API - use correct enum value
    goal_data = {
        "type": "emergency_FUND",
        "name": "Emergency Fund",
        "target_amount": 10000.0,
        "target_date": str(date.today() + timedelta(days=180)),
        "priority": "High"
    }
    create_response = client.post("/api/v0/goals", json=goal_data, headers=auth_headers)
    assert create_response.status_code == 201, f"Failed to create goal: {create_response.json()}"
    goal = create_response.json()
    goal_id = goal["id"]
    
    # Add a progress record - include goal_id in body
    progress_data = {
        "goal_id": goal_id,
        "current_balance": 1000.0,
        "source": "manual_entry"
    }
    client.post(f"/api/v0/goals/{goal_id}/progress", json=progress_data, headers=auth_headers)
    
    # Get progress history
    response = client.get(f"/api/v0/goals/{goal_id}/progress", headers=auth_headers)
    
    assert response.status_code == 200
    progress_list = response.json()
    
    assert len(progress_list) >= 1
