# tests/unit/test_progress_calculations.py
"""Unit tests for progress calculation functions."""
import pytest
from datetime import date, datetime, timedelta
from uuid import uuid4

from app.schemas.tracking import ProgressStatus
from app.services.progress_service import (
    calculate_progress_percentage,
    calculate_progress_status,
    detect_milestones_reached,
)


class TestCalculateProgressPercentage:
    """Tests for calculate_progress_percentage function."""
    
    def test_normal_progress(self):
        """Test normal progress calculation."""
        result = calculate_progress_percentage(5000, 10000)
        assert result == 50.0
    
    def test_zero_current(self):
        """Test with zero current amount."""
        result = calculate_progress_percentage(0, 10000)
        assert result == 0.0
    
    def test_complete_progress(self):
        """Test 100% progress."""
        result = calculate_progress_percentage(10000, 10000)
        assert result == 100.0
    
    def test_over_100_percent_capped(self):
        """Test that progress over 100% is capped."""
        result = calculate_progress_percentage(15000, 10000)
        assert result == 100.0
    
    def test_zero_target(self):
        """Test with zero target (edge case)."""
        result = calculate_progress_percentage(5000, 0)
        assert result == 0.0


class TestCalculateProgressStatus:
    """Tests for calculate_progress_status function."""
    
    def test_on_track_status(self):
        """Test goal that is ahead of schedule."""
        # Create a mock goal
        class MockGoal:
            target_amount = 10000
            target_date = date.today() + timedelta(days=100)
            created_at = datetime.now() - timedelta(days=50)  # 50 days in, 100 days remaining
        
        goal = MockGoal()
        # After 50 days, should have ~3333 (33.3%), but have 5000 (50%)
        current_balance = 5000
        
        status = calculate_progress_status(goal, current_balance)
        assert status == ProgressStatus.ON_TRACK
    
    def test_slightly_behind_status(self):
        """Test goal that is slightly behind schedule."""
        class MockGoal:
            target_amount = 10000
            target_date = date.today() + timedelta(days=100)
            created_at = datetime.now() - timedelta(days=50)
        
        goal = MockGoal()
        # After 50 days, should have ~3333 (33.3%), but have 3000 (30%)
        current_balance = 3000
        
        status = calculate_progress_status(goal, current_balance)
        assert status == ProgressStatus.SLIGHTLY_BEHIND
    
    def test_off_track_status(self):
        """Test goal that is significantly behind."""
        class MockGoal:
            target_amount = 10000
            target_date = date.today() + timedelta(days=100)
            created_at = datetime.now() - timedelta(days=50)
        
        goal = MockGoal()
        # After 50 days, should have ~3333 (33.3%), but have only 500 (5%)
        current_balance = 500
        
        status = calculate_progress_status(goal, current_balance)
        assert status == ProgressStatus.OFF_TRACK
    
    def test_completed_status(self):
        """Test goal that is completed."""
        class MockGoal:
            target_amount = 10000
            target_date = date.today() + timedelta(days=100)
            created_at = datetime.now() - timedelta(days=50)
        
        goal = MockGoal()
        current_balance = 10000
        
        status = calculate_progress_status(goal, current_balance)
        assert status == ProgressStatus.COMPLETED
    
    def test_not_started_status(self):
        """Test goal with no progress."""
        class MockGoal:
            target_amount = 10000
            target_date = date.today() + timedelta(days=100)
            created_at = datetime.now() - timedelta(days=10)
        
        goal = MockGoal()
        current_balance = 0
        
        status = calculate_progress_status(goal, current_balance)
        assert status == ProgressStatus.NOT_STARTED
    
    def test_past_due_incomplete(self):
        """Test goal that is past due but not complete."""
        class MockGoal:
            target_amount = 10000
            target_date = date.today() - timedelta(days=10)  # Past due
            created_at = datetime.now() - timedelta(days=100)
        
        goal = MockGoal()
        current_balance = 5000
        
        status = calculate_progress_status(goal, current_balance)
        assert status == ProgressStatus.OFF_TRACK


class TestDetectMilestonesReached:
    """Tests for milestone detection."""
    
    def test_single_milestone_quarter(self):
        """Test detecting 25% milestone."""
        goal_id = uuid4()
        milestones = detect_milestones_reached(
            goal_id=goal_id,
            new_balance=2600,
            old_balance=2000,
            target_amount=10000
        )
        assert "25%" in milestones
        assert len(milestones) == 1
    
    def test_single_milestone_half(self):
        """Test detecting 50% milestone."""
        goal_id = uuid4()
        milestones = detect_milestones_reached(
            goal_id=goal_id,
            new_balance=5100,
            old_balance=4500,
            target_amount=10000
        )
        assert "50%" in milestones
        assert len(milestones) == 1
    
    def test_multiple_milestones(self):
        """Test detecting multiple milestones in one update."""
        goal_id = uuid4()
        milestones = detect_milestones_reached(
            goal_id=goal_id,
            new_balance=8000,
            old_balance=2000,
            target_amount=10000
        )
        # Should detect 25%, 50%, and 75%
        assert "25%" in milestones
        assert "50%" in milestones
        assert "75%" in milestones
        assert len(milestones) == 3
    
    def test_completion_milestone(self):
        """Test detecting 100% completion."""
        goal_id = uuid4()
        milestones = detect_milestones_reached(
            goal_id=goal_id,
            new_balance=10000,
            old_balance=9000,
            target_amount=10000
        )
        assert "100%" in milestones
    
    def test_no_milestones(self):
        """Test when no milestones are crossed."""
        goal_id = uuid4()
        milestones = detect_milestones_reached(
            goal_id=goal_id,
            new_balance=2200,
            old_balance=2000,
            target_amount=10000
        )
        assert len(milestones) == 0
