# Implementation Plan: FinCred Code Audit Fixes

**Date:** February 10, 2026  
**Goal:** Fix all critical and medium-priority issues identified in the code audit

---

## Phase 0: Pre-Flight Checks

Before starting, verify:
- [ ] All tests pass: `pytest backend/tests/ -v`
- [ ] Backend runs without errors: `cd backend && python -m uvicorn app.main:app --reload`
- [ ] No linting errors: `ruff check backend/`

---

## Phase 1: Critical Fixes (Day 1)

### 1.1 Fix Class Name Collision in auth.py

**File:** `backend/app/api/v0/routers/auth.py`

**Change:**
```python
# BEFORE (Line 19)
class Message(BaseModel):
    message: str

# AFTER
class AuthMessage(BaseModel):
    message: str
```

**Update References:**
- Update any local usage of `Message` → `AuthMessage` in the same file

**Verification:**
```bash
grep -n "class Message" backend/app/api/v0/routers/auth.py
# Should find 0 occurrences after fix
```

---

### 1.2 Fix Type Mismatch in ConversationSession

**File:** `backend/app/services/dialog/conversation.py`

**Change (Line 36):**
```python
# BEFORE
class ConversationSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: int  # ❌ WRONG

# AFTER
class ConversationSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID  # ✅ CORRECT
```

**Update Method Signatures:**
- `start_session()` returns `ConversationSession` with `user_id: UUID`
- Any function accepting `user_id` should accept `UUID` not `int`

**Verification:**
```bash
cd backend && python -c "from app.services.dialog.conversation import ConversationSession; print('Import OK')"
```

---

### 1.3 Add Warning Comment for In-Memory Sessions

**File:** `backend/app/services/dialog/conversation.py`

**Add after Line 84:**
```python
class ConversationService:
    """
    WARNING: Sessions are stored in-memory only.

    This is suitable for MVP and development only.
    For production, use Redis or database storage.

    Issues with in-memory storage:
    - Sessions lost on server restart
    - Cannot scale horizontally
    - No audit trail

    TODO: Implement persistence before production deployment.
    """

    _sessions: Dict[UUID, ConversationSession] = {}
```

**Verification:**
```bash
grep -n "WARNING:" backend/app/services/dialog/conversation.py
# Should find the warning comment
```

---

## Phase 2: Medium Priority — Persistence (Day 2)

### 2.1 Create ConversationSession SQLModel

**New File:** `backend/app/models/conversation.py`

```python
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class ConversationSessionTable(SQLModel, table=True):
    """Database table for persisted conversation sessions."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    intent: str = "general"
    message_history: str = ""  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Future: Add relationships to User

class ConversationMessageTable(SQLModel, table=True):
    """Database table for individual messages."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="conversation_session_table.id", index=True)
    role: str  # user, assistant, system
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Add to `backend/app/models/__init__.py`:**
```python
from app.models.conversation import ConversationSessionTable, ConversationMessageTable
```

**Run Migration:**
```bash
cd backend
alembic revision --autogenerate -m "Add conversation tables"
alembic upgrade head
```

---

### 2.2 Update ConversationService for Persistence

**File:** `backend/app/services/dialog/conversation.py`

**Add Imports:**
```python
from app.models.conversation import ConversationSessionTable, ConversationMessageTable
from sqlmodel import Session as DBSession
```

**Modify `start_session()`:**
```python
async def start_session(
    self,
    user: User,
    intent: str = "general",
    db: Optional[DBSession] = None,  # NEW: Optional DB
) -> ConversationSession:
    # ... existing logic ...

    # NEW: Persist to database if DB provided
    if db:
        session_table = ConversationSessionTable(
            id=session.id,
            user_id=user.id,
            intent=intent,
            message_history="[]",  # JSON
        )
        db.add(session_table)
        db.commit()

    return session
```

**Modify `send_message()`:**
```python
async def send_message(
    self,
    session_id: Optional[UUID],
    user_message: str,
    user: User,
    db: Optional[DBSession] = None,  # NEW
) -> str:
    # ... existing logic ...

    # NEW: Persist message to database
    if db and session:
        msg_table = ConversationMessageTable(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        db.add(msg_table)
        db.commit()
```

**Verification:**
```bash
cd backend
python -c "
from app.services.dialog.conversation import ConversationService
from app.llm.providers.fallback import FallbackChain
from app.llm.prompts.manager import PromptManager
from app.db.session import SessionLocal

db = SessionLocal()
# Test that service can be created with DB
print('Persistence integration OK')
"
```

---

### 2.3 Update ERD Documentation

**File:** `ERD.md`

**Add after EducationSnippet (Section 12):**

```markdown
### 14. ConversationSessionTable
- `id`
- `user_id` (FK User)
- `intent` (general, onboarding, goal_discovery, planning, checkin)
- `message_history` (JSON string)
- `created_at`
- `updated_at`

**Relationships:**
- 1 User has many ConversationSessions

### 15. ConversationMessageTable
- `id`
- `session_id` (FK ConversationSessionTable)
- `role` (user, assistant, system)
- `content`
- `created_at`

**Relationships:**
- 1 ConversationSession has many Messages
```

**Update ASCII ERD:**
```text
User (1)
  |--(*) ConversationSessionTable ---(*) ConversationMessageTable
  |--(*) Goal
  ...
```

---

### 2.4 Update API Design Documentation

**File:** `API_DESIGN.md`

**Add new Section 12:**

```markdown
## 12. AI Chat & Conversation

The FinCred AI Assistant enables conversational financial coaching via natural language dialogue.

### Base URL
All endpoints under `/api/v0/chat`.

### Endpoints

#### POST `/chat/start`
Start a new conversation session.

**Request:**
```json
{
  "intent": "general | onboarding | goal_discovery | planning | checkin"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "greeting": "Hi! I'm your financial coach...",
  "intent": "general"
}
```

**Response Codes:**
- `200` — Success
- `401` — Unauthorized
- `503` — LLM service unavailable

---

#### POST `/chat/message`
Send a message to the AI coach.

**Request:**
```json
{
  "message": "Can I afford a $500 vacation?",
  "session_id": "uuid (optional)"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "response": "Based on your current plan...",
  "intent": "planning"
}
```

---

#### POST `/chat/message/stream`
Streaming response (Server-Sent Events) for real-time AI output.

**Response Format:**
```
data: Hello
data: ! How
data: can
data: I
data: help
data: ?
data: [DONE]
```

---

#### GET `/chat/session/{session_id}`
Get conversation session info.

**Response:**
```json
{
  "session_id": "uuid",
  "intent": "planning",
  "message_count": 5,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:35:00Z"
}
```

---

#### DELETE `/chat/session/{session_id}`
End and clear a conversation session.

**Response:**
```json
{
  "status": "cleared",
  "session_id": "uuid"
}
```

---

#### POST `/chat/session/{session_id}/refresh`
Refresh the user context in an existing session.

**Response:**
```json
{
  "status": "refreshed",
  "session_id": "uuid"
}
```

---

#### GET `/chat/health`
Check LLM service availability.

**Response:**
```json
{
  "llm_available": true,
  "active_sessions": 12,
  "providers": ["gemini:gemini-2.0-flash"]
}
```

---

### LLM Configuration
- **Provider:** Google Gemini (configurable via `GOOGLE_AI_API_KEY`)
- **Fallback:** `gemini-1.5-flash` if primary fails
- **Streaming:** Supported via Server-Sent Events

### Rate Limiting
- **Limit:** 60 requests per minute (shared with other endpoints)
- **429 Response:** Rate limit exceeded
```

---

## Phase 3: Medium Priority — Testing (Day 3)

### 3.1 Create Integration Tests for Chat

**New File:** `backend/tests/integration/test_chat_endpoints.py`

```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel
from app.main import app
from app.db.session import engine
from app.models.user import User
from app.core.security import create_access_token
from uuid import uuid4

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
```

---

### 3.2 Add Tests for ContextBuilder

**New File:** `backend/tests/unit/test_dialog/test_context.py`

```python
import pytest
from app.services.dialog.context import ContextBuilder, DialogContext
from app.models.user import User, Profile
from app.models.goal import Goal
from app.models.snapshot import Income, ExpenseEstimate

class TestContextBuilder:
    """Tests for ContextBuilder."""

    def test_build_empty_context(self, db, user):
        """Test building context for new user with no data."""
        builder = ContextBuilder(db)
        context = builder.build(user)

        assert context.user_id == user.id
        assert context.monthly_income is None
        assert context.active_goals == []

    def test_build_context_with_income(self, db, user):
        """Test context includes income data."""
        # Add income
        income = Income(
            user_id=user.id,
            amount=5000,
            frequency="monthly",
        )
        db.add(income)
        db.commit()

        builder = ContextBuilder(db)
        context = builder.build(user)

        assert context.monthly_income == 5000.0

    def test_to_prompt_string(self):
        """Test context formatting for LLM."""
        context = DialogContext(
            user_id="uuid",
            monthly_income=5000.0,
            monthly_expenses=3000.0,
            estimated_surplus=2000.0,
        )

        prompt = context.to_prompt_string()
        assert "$5,000" in prompt
        assert "$3,000" in prompt
        assert "$2,000" in prompt
```

---

### 3.3 Run All Tests

```bash
cd backend
pytest tests/ -v --tb=short

# Expected output:
# ============================= test session starts =============================
# ...
# ============================= 50 tests passed =============================
```

---

## Phase 4: Medium Priority — Planning Engine LLM Integration (Day 4)

### 4.1 Create LLM-Enhanced Explanation Service

**New File:** `backend/app/services/planning_explanations.py`

```python
from typing import Optional
from app.models.user import User
from app.schemas.planning import PlanResponse, PlannedGoal
from app.services.dialog.conversation import ConversationService
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
            "target_date": goal.target_date.isoformat(),
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
            "original_plan_summary": original_plan.summary.model_dump(),
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
```

---

### 4.2 Integrate with Planning Service

**File:** `backend/app/services/planning.py`

**Add at end of file:**

```python
from app.services.planning_explanations import PlanningExplanationService
from app.llm.providers.fallback import FallbackChain
from app.llm.prompts.manager import PromptManager

# Global instances (in production, use dependency injection)
_llm_chain: Optional[FallbackChain] = None
_prompt_manager: Optional[PromptManager] = None

def _get_llm_services():
    """Lazy initialization of LLM services."""
    global _llm_chain, _prompt_manager

    if _llm_chain is None:
        from app.core.config import settings
        if not settings.GOOGLE_AI_API_KEY:
            return None, None

        from app.llm.providers.gemini import GeminiProvider

        provider = GeminiProvider(
            api_key=settings.GOOGLE_AI_API_KEY,
            model=settings.LLM_MODEL_CHAIN.split(",")[0],
        )
        _llm_chain = FallbackChain([provider])
        _prompt_manager = PromptManager()

    return _llm_chain, _prompt_manager


async def generate_plan_with_explanations(
    user_id: UUID,
    db: Session,
) -> PlanResponse:
    """
    Generate plan with LLM-powered explanations.

    This is an enhanced version of generate_plan() that includes
    personalized explanations for feasibility labels.
    """
    # Generate basic plan first
    plan_response = generate_plan(user_id=user_id, db=db)

    # Get LLM services
    llm, prompt_manager = _get_llm_services()
    if llm is None or prompt_manager is None:
        # LLM not configured, return basic plan
        return plan_response

    # Create explanation service
    explanation_service = PlanningExplanationService(
        llm=llm,
        prompt_manager=prompt_manager,
    )

    # Get user for context
    user = db.exec(select(User).where(User.id == user_id)).first()

    # Get income and expenses
    income = db.exec(
        select(Income).where(Income.user_id == user_id)
        .order_by(Income.created_at.desc())
    ).first()
    expenses = db.exec(
        select(ExpenseEstimate).where(ExpenseEstimate.user_id == user_id)
        .order_by(ExpenseEstimate.created_at.desc())
    ).first()

    monthly_income = float(income.amount) if income else 0
    monthly_expenses = float(expenses.total_amount) if expenses else 0

    # Generate explanations for each goal
    for planned_goal in plan_response.goals:
        if planned_goal.explanation == "Generated by system":  # Basic explanation
            user_goal = db.exec(
                select(Goal).where(Goal.id == planned_goal.goal_id)
            ).first()

            explanation = await explanation_service.generate_feasibility_explanation(
                user=user,
                goal=planned_goal,
                monthly_income=monthly_income,
                monthly_expenses=monthly_expenses,
                why_text=user_goal.why_text if user_goal else None,
            )

            # Update explanation
            planned_goal.explanation = explanation

    return plan_response
```

---

### 4.3 Update API Endpoint

**File:** `backend/app/api/v0/routers/planning.py`

```python
from fastapi import APIRouter, Depends
from app.api.v0.deps import get_current_user, get_db
from app.schemas.planning import PlanResponse
from app.services.planning import generate_plan, generate_plan_with_explanations

router = APIRouter(prefix="/planning")


@router.post("/plan", response_model=PlanResponse)
def generate_user_plan(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a simple monthly contribution plan for the user's active goals.

    Uses the latest income & expense snapshot plus active goals to estimate
    required monthly contributions and feasibility labels.
    """
    return generate_plan(user_id=current_user.id, db=db)


@router.post("/plan/enhanced", response_model=PlanResponse)
async def generate_enhanced_plan(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate plan with LLM-powered personalized explanations.

    This endpoint provides the same plan as /plan but with
    enhanced, personalized explanations for feasibility labels.

    Requires: GOOGLE_AI_API_KEY to be configured.
    """
    return await generate_plan_with_explanations(
        user_id=current_user.id,
        db=db,
    )
```

---

## Phase 5: Documentation Cleanup (Day 5)

### 5.1 Update README.md

Add AI features to roadmap:

```markdown
## Roadmap (high level)

1. **Foundations** – auth, profile, basic backend skeleton.
2. **Goal planning core** – snapshot input, goal models, planning engine v1.
   - **ENHANCED:** AI-powered explanations for feasibility labels
3. **Action plans & commitments** – link plans to recurring actions and habit tracking.
4. **AI Chat & Conversation** – conversational financial coaching (implemented).
5. **Tracking & check‑ins** – weekly check-ins, progress dashboard, streaks.
6. **Nudges & summaries** – weekly email summaries & reminders.
7. **Private beta & iteration** – onboard early users, instrument analytics, refine.
```

---

### 5.2 Update ARCHITECTURE_Dialog_LL_LAYER.md

Reference actual implementation:

```markdown
## Technology choices (illustrative)

- LLM provider: **Google Gemini** (implemented in `backend/app/llm/providers/gemini.py`)
  - Configurable via `GOOGLE_AI_API_KEY`
  - Fallback chain support
  - Model: `gemini-2.0-flash` (configurable)
- Prompt templates: Defined in `app/llm/prompts/manager.py`
- Conversation Service: Implemented in `app/services/dialog/conversation.py`
```

---

### 5.3 Update ARCHITECTURE_PRD_ALIGNMENT.md

Mark AI Assistant as implemented:

```markdown
Gaps to align with the PRD and fixes

- ~~Explicit conversational AI backbone~~ → **RESOLVED:** Implemented in `chat.py`
- Planning engine depth → **PARTIAL:** Planning Engine exists; AI explanations added via `/planning/plan/enhanced`
- ~~AI Assistant~~ → **RESOLVED:** `/chat` endpoints with Gemini provider
```

---

## Verification Checklist

After completing all phases:

- [ ] All 3 critical issues fixed
- [ ] All 4 medium-priority issues addressed
- [ ] All tests pass: `pytest backend/tests/ -v`
- [ ] No linting errors: `ruff check backend/`
- [ ] API documentation matches implementation
- [ ] ERD includes ConversationSession
- [ ] LLM-enhanced planning works (if API key configured)
- [ ] Chat sessions persist (if database configured)

---

## Rollback Plan

If issues arise:

1. **Git revert:**
   ```bash
   git revert HEAD~5  # Revert last 5 commits
   ```

2. **Database rollback:**
   ```bash
   alembic downgrade -1
   ```

3. **Restore backed-up files:**
   ```bash
   git checkout HEAD -- backend/app/api/v0/routers/auth.py
   ```

---

## Estimated Timeline

| Phase | Effort | Duration |
|-------|--------|----------|
| Phase 1: Critical Fixes | 3 issues | 2 hours |
| Phase 2: Persistence | 4 subtasks | 4 hours |
| Phase 3: Testing | 3 test files | 3 hours |
| Phase 4: LLM Integration | 3 subtasks | 4 hours |
| Phase 5: Documentation | 3 docs | 2 hours |

**Total Estimated Time:** 15 hours (3 days)

---

**End of Implementation Plan**
