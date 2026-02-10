# Dialog / LLM Layer (Converational AI Backbone)

Purpose
- Formalize the conversational AI layer that drives onboarding, goal discovery, coaching, and contextual education. This layer orchestrates natural language interactions and feeds data to the planning engine, nudges, and education content.

Responsibilities
- Conversational onboarding: collect user data via dialogue, confirm preferences, and establish initial goals.
- AI-guided goal discovery: surface and refine goals with user-provided motivations (the "why").
- In-dialog explanations: provide explanations of planning decisions and feasibility in natural language during planning review.
- Ongoing coaching: answer user questions, perform what-if explorations, and surface contextually relevant snippets.
- Content generation: produce personalized nudges and micro-education content within conversations.
- Data orchestration: read snapshot, goals, actions, and preferences; write any updates that originate from dialog (e.g., discovered goals, updated preferences).

Interfaces and data contracts
- Input to the layer (from client or internal services):
  - OnboardingDialogueInput: captured user answers, stated goals, preferred check-in cadence, persona hints.
  - PlanningDialogueInput: current snapshot, active goals, persona, and any user-provided constraints.
- Output from the layer: dialogue turns, suggested goals (if discovered), explanations, and actions to take (e.g., create an action plan).
- Internal calls:
  - Planning Engine: supply data and receive per-goal plan outputs with explanations.
  - Nudges Engine: request contextual nudges to be surfaced in conversation.
  - Education/Snippet Renderer: fetch relevant snippets to present in-dialog.

Data flow (end-to-end, text form)
- User talks to the system -> Dialog Layer processes intent and collects data -> Dialog Layer calls Planning Engine for a plan -> Planning Engine returns per-goal contributions and feasibility with explanations -> Dialog Layer presents plan with natural-language explanations and asks for confirmations -> Nudges/Education services may be invoked to enrich the conversation.

Non-functional considerations
- Latency: aim for sub-second responses in conversational flows; batching of LLM calls where possible.
- Privacy: avoid sending sensitive credentials; minimize data retained in prompts; clear opt-out paths.
- Safety: guardrails around financial advice; label content as guidance, not professional advice.
- Observability: trace prompts, responses, and data passed between modules for debugging.

Technology choices (illustrative)
- LLM provider: **Google Gemini** (implemented in `backend/app/llm/providers/gemini.py`)
  - Configurable via `GOOGLE_AI_API_KEY`
  - Fallback chain support for resilience
  - Model: `gemini-2.0-flash` (configurable via `LLM_MODEL_CHAIN`)
- Prompt templates: Defined in `app/llm/prompts/manager.py`
- Conversation Service: Implemented in `app/services/dialog/conversation.py`
- Intent Detection: Rule-based keyword matching in `app/services/dialog/intents.py`
- Context Builder: `app/services/dialog/context.py` for user data aggregation

Interfaces with existing architecture
- **Reads:** Snapshot, Goals, Persona hints, Preferences (from Profile)
- **Writes:** Updated goals or preferences if discovered via dialogue; creates/updates action plans if user confirms in-dialog
- **Triggers:** When a plan is generated, conversation can present what-if scenarios via `/chat/message`
- **Implementation:** See `backend/app/api/v0/routers/chat.py` for actual endpoints:
  - `POST /chat/start` - Start new conversation session
  - `POST /chat/message` - Send/receive messages
  - `POST /chat/message/stream` - Streaming responses (SSE)
  - `GET /chat/session/{session_id}` - Get session info
  - `DELETE /chat/session/{session_id}` - Clear session
  - `POST /chat/session/{session_id}/refresh` - Refresh context
  - `GET /chat/health` - LLM health check

Notes
- This layer is the primary conduit for the PRD's conversational onboarding and adaptive coaching flows.
- Sessions are currently in-memory only (see `conversation.py` warning comment).
- For production, implement Redis or database persistence for sessions.

Notes
- This layer is the primary conduit for the PRD’s conversational onboarding and adaptive coaching flows. It should be explicitly referenced in architecture diagrams as a distinct layer with well-defined inputs/outputs and API-like contracts for internal services.
