# Architecture-PRD Alignment

This document aligns the MVP architecture map with the Product Requirements Document (PRD) and specifies concrete gaps and patches to fully map to the PRD.

Overview
- PRD envisions an AI-assisted, conversational financial coach with: conversational onboarding, goal discovery, dynamic planning with tradeoffs, subtleties of feasibility, recurring actions, nudges, and contextual education.
- Current architecture map covers: onboarding data capture, goals, planning, actions, tracking, nudges, education, and analytics, built on FastAPI/PostgreSQL with a planning engine.

What matches the PRD (high level)
- Onboarding with data capture (income, expenses, debts, savings) and snapshot
- Goals definition and planning engine with feasibility labels (Comfortable, Tight, Unrealistic)
- Action plans and commitments linked to goals
- Tracking, weekly check-ins, mood/feedback
- Nudges and weekly summaries, with channels (email/push)
- Education snippets and contextual content
- Analytics/events scaffolding
- Clear out-of-scope items (bank integrations, direct transfers) as per PRD

Gaps to align with the PRD and fixes

- ~~Explicit conversational AI backbone~~ → **RESOLVED:** Implemented in `backend/app/api/v0/routers/chat.py`
  - Full `/chat` endpoint suite implemented: start, message, stream, session management, health check
  - ConversationService handles sessions, context building, and intent detection
  - Gemini LLM provider with fallback chain support

- Planning engine depth
  - **Status:** PARTIAL - Basic planning engine exists; LLM explanations need implementation
  - Gap: Planning engine generates feasibility labels but not personalized LLM explanations
  - See: `backend/app/services/planning.py` for current implementation

- Persona alignment explicitness
  - **Status:** NOT YET ADDRESSED
  - Gap: MVP persona not explicitly annotated in architecture

- Non-functional targets
  - **Status:** NOT YET ADDRESSED
  - Gap: Architecture lacks explicit latency, uptime, and accessibility targets

- Phase mapping traceability
  - **Status:** NOT YET ADDRESSED
  - Gap: Phase-to-component traceability implicit, not explicit

Proposed alignments (patchable changes)

- ~~Add ARCHITECTURE_Dialog_LL_LAYER.md~~ → **COMPLETE:** Implemented with Gemini provider
- ~~Add AI Chat endpoints to API_DESIGN.md~~ → **COMPLETE:** Added Section 12
- **NEW:** Add LLM-enhanced planning explanations (planned in `backend/app/services/planning_explanations.py`)
- **NEW:** Annotate MVP persona focus (Persona #2: young professionals)
- **NEW:** Introduce Non-functional Alignment box with explicit targets
- **NEW:** Add Phase-to-Architecture traceability, mapping PRD phases to components

Implementation plan (high level)
- Patch 1: Add ARCHITECTURE_Dialog_LL_LAYER.md to define the Layer, its interfaces, and data contracts.
- Patch 2: Add ARCHITECTURE_PRD_ALIGNMENT.md refinements to include explicit phase mapping and NF targets.

Notes
- The new artifacts are intended to be read together with the existing architecture map and PRD. They do not replace existing docs but augment them with explicit alignment and implementation guidance.

Owner choices
- If you want, I can proceed with implementing the patches now. Please confirm and I will apply the two new Markdown files with the detailed content.
