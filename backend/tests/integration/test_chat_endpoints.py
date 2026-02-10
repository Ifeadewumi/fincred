import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel
from app.main import app
from app.db.session import engine
from app.models.user import User
from app.core.security import create_access_token
from uuid import uuid4
from app.api.v0.deps import get_db

# Create tables
SQLModel.metadata.create_all(engine)


@pytest.fixture
def db():
    """Create test database session."""
    with Session(engine) as session:
        yield session
        # Cleanup
        session.rollback()


@pytest.fixture
def client(db):
    """Create test client with database."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def user(db):
    """Create test user."""
    user = User(
        email=f"test_{uuid4().hex[:8]}@example.com",
        password_hash="hashed_password",
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def token(user):
    """Create auth token for test user."""
    return create_access_token(data={"sub": str(user.id)})


@pytest.fixture
def auth_headers(token):
    """Auth headers for requests."""
    return {"Authorization": f"Bearer {token}"}


class TestChatEndpoints:
    """Tests for /chat endpoints."""

    def test_start_conversation(self, client, auth_headers):
        """Test starting a new conversation."""
        response = client.post(
            "/api/v0/chat/start",
            json={"intent": "general"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "greeting" in data
        assert data["intent"] == "general"

    def test_send_message(self, client, auth_headers):
        """Test sending a message to the AI."""
        # Start session first
        start_response = client.post(
            "/api/v0/chat/start",
            json={"intent": "general"},
            headers=auth_headers,
        )
        session_id = start_response.json()["session_id"]

        # Send message
        response = client.post(
            "/api/v0/chat/message",
            json={
                "message": "Hello, I want to save money",
                "session_id": session_id,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert "response" in data
        assert len(data["response"]) > 0

    def test_unauthorized_access(self, client):
        """Test that unauthorized requests are rejected."""
        response = client.post(
            "/api/v0/chat/start",
            json={"intent": "general"},
        )
        assert response.status_code == 401

    def test_llm_health_check(self, client, auth_headers):
        """Test LLM service health endpoint."""
        response = client.get(
            "/api/v0/chat/health",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "llm_available" in data
        assert "providers" in data
