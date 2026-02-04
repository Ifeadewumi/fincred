# tests/integration/test_goal_service.py
"""
Integration tests for goal service.

Tests goal creation, retrieval, update, and deletion with database interactions.
"""
import pytest
from datetime import date, timedelta
from sqlmodel import Session
from fastapi import status

from app.services.goal_service import (
    get_all_goals,
    create_new_goal,
    get_goal_by_id,
    update_existing_goal,
    delete_user_goal
)
from app.schemas.goal import GoalCreate, GoalUpdate, GoalType, GoalPriority, GoalStatus
from app.models.user import User
from app.models.goal import Goal
from app.core.exceptions import (
    ResourceNotFoundError,
    InvalidGoalDateError,
    GoalLimitExceededError,
    NoFieldsToUpdateError
)


@pytest.mark.integration
@pytest.mark.goals
class TestGetAllGoals:
    """Tests for get_all_goals service function."""
    
    def test_get_all_goals_empty(self, session: Session, test_user: User):
        """Test getting goals when user has none."""
        goals = get_all_goals(session, test_user)
        
        assert goals == []
    
    def test_get_all_goals_with_data(
        self,
        session: Session,
        test_user: User,
        create_goal
    ):
        """Test getting goals when user has multiple goals."""
        # Create 3 goals
        create_goal(test_user.id, name="Goal 1")
        create_goal(test_user.id, name="Goal 2")
        create_goal(test_user.id, name="Goal 3")
        
        goals = get_all_goals(session, test_user)
        
        assert len(goals) == 3
        goal_names = [g.name for g in goals]
        assert "Goal 1" in goal_names
        assert "Goal 2" in goal_names
        assert "Goal 3" in goal_names
    
    def test_get_all_goals_pagination(
        self,
        session: Session,
        test_user: User,
        create_goal
    ):
        """Test goal pagination works correctly."""
        # Create 5 goals
        for i in range(5):
            create_goal(test_user.id, name=f"Goal {i}")
        
        # Get first 2
        page1 = get_all_goals(session, test_user, limit=2, offset=0)
        assert len(page1) == 2
        
        # Get next 2
        page2 = get_all_goals(session, test_user, limit=2, offset=2)
        assert len(page2) == 2
        
        # Ensure no overlap
        page1_ids = {g.id for g in page1}
        page2_ids = {g.id for g in page2}
        assert len(page1_ids & page2_ids) == 0


@pytest.mark.integration
@pytest.mark.goals
class TestCreateNewGoal:
    """Tests for create_new_goal service function."""
    
    def test_create_goal_success(self, session: Session, test_user: User):
        """Test successful goal creation."""
        goal_data = GoalCreate(
            type=GoalType.SAVINGS,
            name="Emergency Fund",
            target_amount=10000.0,
            target_date=date.today() + timedelta(days=365),
            priority=GoalPriority.HIGH,
            primary_flag=True,
            why_text="Financial security"
        )
        
        goal = create_new_goal(session, test_user, goal_data)
        
        assert goal.id is not None
        assert goal.user_id == test_user.id
        assert goal.name == "Emergency Fund"
        assert goal.target_amount == 10000.0
        assert goal.status == GoalStatus.ACTIVE
    
    def test_create_goal_past_date_fails(self, session: Session, test_user: User):
        """Test that creating goal with past date fails."""
        goal_data = GoalCreate(
            type=GoalType.SAVINGS,
            name="Test Goal",
            target_amount=5000.0,
            target_date=date.today() - timedelta(days=1),  # Yesterday
            priority=GoalPriority.MEDIUM
        )
        
        with pytest.raises(InvalidGoalDateError) as exc_info:
            create_new_goal(session, test_user, goal_data)
        
        assert "future" in str(exc_info.value.message).lower()
    
    def test_create_goal_today_date_fails(self, session: Session, test_user: User):
        """Test that creating goal with today's date fails."""
        goal_data = GoalCreate(
            type=GoalType.SAVINGS,
            name="Test Goal",
            target_amount=5000.0,
            target_date=date.today(),  # Today
            priority=GoalPriority.MEDIUM
        )
        
        with pytest.raises(InvalidGoalDateError):
            create_new_goal(session, test_user, goal_data)
    
    def test_create_goal_limit_exceeded(
        self,
        session: Session,
        test_user: User,
        create_goal
    ):
        """Test that creating more than 5 active goals fails."""
        # Create 5 active goals
        for i in range(5):
            create_goal(
                test_user.id,
                name=f"Goal {i}",
                status=GoalStatus.ACTIVE
            )
        
        # Try to create 6th goal
        goal_data = GoalCreate(
            type=GoalType.SAVINGS,
            name="Goal 6",
            target_amount=1000.0,
            target_date=date.today() + timedelta(days=365),
            priority=GoalPriority.LOW
        )
        
        with pytest.raises(GoalLimitExceededError) as exc_info:
            create_new_goal(session, test_user, goal_data)
        
        assert exc_info.value.details["current_count"] == 5
        assert exc_info.value.details["max_count"] == 5


@pytest.mark.integration
@pytest.mark.goals
class TestGetGoalById:
    """Tests for get_goal_by_id service function."""
    
    def test_get_goal_by_id_success(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal
    ):
        """Test successfully getting goal by ID."""
        goal = get_goal_by_id(session, test_user, test_goal.id)
        
        assert goal.id == test_goal.id
        assert goal.name == test_goal.name
    
    def test_get_goal_by_id_not_found(self, session: Session, test_user: User):
        """Test getting goal that doesn't exist."""
        from uuid import uuid4
        fake_id = uuid4()
        
        with pytest.raises(ResourceNotFoundError) as exc_info:
            get_goal_by_id(session, test_user, fake_id)
        
        assert "Goal" in exc_info.value.message
        assert str(fake_id) in exc_info.value.message
    
    def test_get_goal_by_id_wrong_user(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal,
        create_user
    ):
        """Test that user cannot access another user's goals."""
        other_user = create_user(email="other@example.com")
        
        with pytest.raises(ResourceNotFoundError):
            get_goal_by_id(session, other_user, test_goal.id)


@pytest.mark.integration
@pytest.mark.goals
class TestUpdateExistingGoal:
    """Tests for update_existing_goal service function."""
    
    def test_update_goal_name(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal
    ):
        """Test updating goal name."""
        update_data = GoalUpdate(name="Updated Name")
        
        updated_goal = update_existing_goal(
            session,
            test_user,
            test_goal.id,
            update_data
        )
        
        assert updated_goal.name == "Updated Name"
        assert updated_goal.target_amount == test_goal.target_amount  # Unchanged
    
    def test_update_goal_multiple_fields(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal
    ):
        """Test updating multiple fields at once."""
        new_date = date.today() + timedelta(days=730)  # 2 years
        
        update_data = GoalUpdate(
            name="New Name",
            target_amount=20000.0,
            target_date=new_date,
            priority=GoalPriority.LOW
        )
        
        updated_goal = update_existing_goal(
            session,
            test_user,
            test_goal.id,
            update_data
        )
        
        assert updated_goal.name == "New Name"
        assert updated_goal.target_amount == 20000.0
        assert updated_goal.target_date == new_date
        assert updated_goal.priority == GoalPriority.LOW
    
    def test_update_goal_no_fields(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal
    ):
        """Test that updating with no fields raises error."""
        update_data = GoalUpdate()  # Empty update
        
        with pytest.raises(NoFieldsToUpdateError):
            update_existing_goal(session, test_user, test_goal.id, update_data)
    
    def test_update_goal_past_date_fails(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal
    ):
        """Test that updating to past date fails."""
        update_data = GoalUpdate(
            target_date=date.today() - timedelta(days=1)
        )
        
        with pytest.raises(InvalidGoalDateError):
            update_existing_goal(session, test_user, test_goal.id, update_data)


@pytest.mark.integration
@pytest.mark.goals
class TestDeleteUserGoal:
    """Tests for delete_user_goal service function."""
    
    def test_delete_goal_soft_delete(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal
    ):
        """Test that delete is a soft delete (cancels goal)."""
        delete_user_goal(session, test_user, test_goal.id)
        
        # Goal should still exist in database
        goal = session.get(Goal, test_goal.id)
        assert goal is not None
        
        # But status should be CANCELLED
        assert goal.status == GoalStatus.CANCELLED
    
    def test_delete_goal_not_found(self, session: Session, test_user: User):
        """Test deleting goal that doesn't exist."""
        from uuid import uuid4
        fake_id = uuid4()
        
        with pytest.raises(ResourceNotFoundError):
            delete_user_goal(session, test_user, fake_id)
    
    def test_delete_goal_wrong_user(
        self,
        session: Session,
        test_user: User,
        test_goal: Goal,
        create_user
    ):
        """Test that user cannot delete another user's goals."""
        other_user = create_user(email="other@example.com")
        
        with pytest.raises(ResourceNotFoundError):
            delete_user_goal(session, other_user, test_goal.id)
