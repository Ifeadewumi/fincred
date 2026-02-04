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
- LLM provider: TBD (e.g., OpenAI, etc.); ensure prompt engineering strategies and guardrails are documented.
- Prompt templates: define reusable templates for onboarding, goal discovery, planning explanations, and education delivery.

Interfaces with existing architecture
- Reads: Snapshot, Goals, Persona hints, Preferences (from Profile)
- Writes: Updated goals or preferences if discovered via dialogue; creates/updates action plans if user confirms in-dialog
- Triggers: When a plan is generated, a conversation can present what-if scenarios and explanations before confirmation of changes.

Notes
- This layer is the primary conduit for the PRD’s conversational onboarding and adaptive coaching flows. It should be explicitly referenced in architecture diagrams as a distinct layer with well-defined inputs/outputs and API-like contracts for internal services.
