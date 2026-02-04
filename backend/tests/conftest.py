# tests/conftest.py
"""
Pytest configuration and shared fixtures.

This file contains fixtures and configuration used across all tests.
Fixtures defined here are automatically available to all test modules.
"""
import pytest
from typing import Generator
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_session
from app.models.user import User, Profile
from app.models.goal import Goal
from app.core.security import hash_password


@pytest.fixture(name="engine")
def engine_fixture():
    """
    Create an in-memory SQLite database engine for testing.
    
    Uses StaticPool to maintain the same connection across the test,
    ensuring that the in-memory database persists for the duration.
    
    Yields:
        SQLAlchemy engine instance
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    SQLModel.metadata.create_all(engine)
    
    yield engine
    
    # Drop all tables after test
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    """
    Create a database session for testing.
    
    Each test gets a fresh session that is rolled back after the test,
    ensuring test isolation.
    
    Args:
        engine: Database engine fixture
        
    Yields:
        Database session
    """
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """
    Create a FastAPI test client with database session override.
    
    The test client uses the test database session instead of the
    production database.
    
    Args:
        session: Test database session
        
    Yields:
        FastAPI test client
    """
    from app.api.v0.deps import get_db
    
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_db] = get_session_override
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session) -> User:
    """
    Create a test user in the database.
    
    Creates a user with:
    - Email: test@example.com
    - Password: testpassword123
    - Verified: True
    - Profile with default preferences
    
    Args:
        session: Database session
        
    Returns:
        Created user instance
    """
    # Create user
    user = User(
        email="test@example.com",
        password_hash=hash_password("testpassword123"),
        is_verified=True,
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Create profile
    profile = Profile(
        user_id=user.id,
        notification_enabled=True,
        theme_preference="light"
    )
    session.add(profile)
    session.commit()
    
    return user


@pytest.fixture(name="test_user_token")
def test_user_token_fixture(test_user: User) -> str:
    """
    Generate a JWT token for the test user.
    
    This token can be used in Authorization headers for authenticated
    requests in tests.
    
    Args:
        test_user: Test user instance
        
    Returns:
        JWT token string
    """
    from app.core.security import create_access_token
    return create_access_token(subject=test_user.email)


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(test_user_token: str) -> dict:
    """
    Create Authorization headers for authenticated requests.
    
    Args:
        test_user_token: JWT token for test user
        
    Returns:
        Dictionary with Authorization header
        
    Usage:
        response = client.get("/api/v0/users/me", headers=auth_headers)
    """
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture(name="test_goal")
def test_goal_fixture(session: Session, test_user: User) -> Goal:
    """
    Create a test goal for the test user.
    
    Creates a goal with:
    - Type: SAVINGS
    - Name: Emergency Fund
    - Target Amount: 10000
    - Target Date: 1 year from now
    
    Args:
        session: Database session
        test_user: Test user instance
        
    Returns:
        Created goal instance
    """
    from datetime import date, timedelta
    from app.schemas.goal import GoalType, GoalPriority, GoalStatus
    
    goal = Goal(
        user_id=test_user.id,
        type=GoalType.SHORT_TERM_SAVING,
        name="Emergency Fund",
        target_amount=10000.0,
        target_date=date.today() + timedelta(days=365),
        priority=GoalPriority.HIGH,
        status=GoalStatus.ACTIVE,
        primary_flag=True,
        why_text="Build financial security"
    )
    session.add(goal)
    session.commit()
    session.refresh(goal)
    
    return goal


# Test data factories

@pytest.fixture(name="create_user")
def create_user_fixture(session: Session):
    """
    Factory fixture to create multiple users in tests.
    
    Args:
        session: Database session
        
    Returns:
        Function to create users with custom parameters
        
    Usage:
        user1 = create_user(email="user1@example.com")
        user2 = create_user(email="user2@example.com", is_verified=False)
    """
    def _create_user(
        email: str = "user@example.com",
        password: str = "password123",
        is_verified: bool = True,
        is_active: bool = True
    ) -> User:
        user = User(
            email=email,
            password_hash=hash_password(password),
            is_verified=is_verified,
            is_active=is_active
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Create default profile
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        
        return user
    
    return _create_user


@pytest.fixture(name="create_goal")
def create_goal_fixture(session: Session):
    """
    Factory fixture to create multiple goals in tests.
    
    Args:
        session: Database session
        
    Returns:
        Function to create goals with custom parameters
        
    Usage:
        goal1 = create_goal(user_id=user.id, name="Save for house")
        goal2 = create_goal(user_id=user.id, target_amount=50000)
    """
    def _create_goal(
        user_id,
        name: str = "Test Goal",
        target_amount: float = 5000.0,
        **kwargs
    ) -> Goal:
        from datetime import date, timedelta
        from app.schemas.goal import GoalType, GoalPriority, GoalStatus
        
        goal_data = {
            "user_id": user_id,
            "type": GoalType.SHORT_TERM_SAVING,
            "name": name,
            "target_amount": target_amount,
            "target_date": date.today() + timedelta(days=365),
            "priority": GoalPriority.MEDIUM,
            "status": GoalStatus.ACTIVE,
            "primary_flag": False,
        }
        goal_data.update(kwargs)
        
        goal = Goal(**goal_data)
        session.add(goal)
        session.commit()
        session.refresh(goal)
        
        return goal
    
    return _create_goal
