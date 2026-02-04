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
- Explicit conversational AI backbone
  - PRD calls out natural language conversations and conversational onboarding, goal discovery, and ongoing dialogue.
  - Gap: no explicit Dialog/LLM Layer described in the current map.
- Planning engine depth
  - PRD requires dynamic planning with LLM-driven tradeoffs, explanations, and what-if scenarios.
  - Gap: planning engine described but not explicitly linked to LLM-backed explanations and real-time what-if capabilities.
- Persona alignment explicitness
  - PRD targets MVP for Persona 2 (young professionals) with templates for other personas.
  - Gap: MVP persona is not explicitly annotated in architecture map.
- Non-functional targets
  - PRD includes activation/engagement metrics, latency targets (~2s), uptime (>99.9%), accessibility.
  - Gap: architecture map mentions basic observability but not explicit non-functional targets.
- Phase mapping traceability
  - PRD describes multi-phase roadmap; architecture map should map components to phases.
  - Gap: phase-to-component traceability is implicit, not explicit.

Proposed alignments (patchable changes)
- Add a Dialog/LLM Layer to formalize conversational AI behavior and flows.
- Extend the Planning Engine to include explicit LLM-driven tradeoffs, explanations, and what-if analyses, fed by snapshot, goals, and persona.
- Annotate MVP persona focus in the map (Persona #2; explain how #1 and #3 are supported via templates).
- Introduce a Non-functional Alignment box with explicit targets (activation, engagement, latency, uptime, accessibility).
- Add Phase-to-Architecture traceability, mapping PRD phases to components.

Implementation plan (high level)
- Patch 1: Add ARCHITECTURE_Dialog_LL_LAYER.md to define the Layer, its interfaces, and data contracts.
- Patch 2: Add ARCHITECTURE_PRD_ALIGNMENT.md refinements to include explicit phase mapping and NF targets.

Notes
- The new artifacts are intended to be read together with the existing architecture map and PRD. They do not replace existing docs but augment them with explicit alignment and implementation guidance.

Owner choices
- If you want, I can proceed with implementing the patches now. Please confirm and I will apply the two new Markdown files with the detailed content.
