# Feature Breakdown and Simple Roadmap – FinCred MVP

## 1. Feature breakdown

### A. Authentication & basic profile
**User stories**
- As a user, I can sign up/log in so that my data is saved.
- As a user, I can set basic preferences (country/currency, reminder frequency).

**Key components**
- Email/password auth (and/or OAuth), with:
  - Email format validation and uniqueness per user.
  - Password strength rules (e.g., minimum length and reasonable maximum).
- Profile model: `user`, `country`, `currency`, `reminder_frequency`, `persona_hint` (new grad / FIRE / etc.).

---

### B. Onboarding & financial snapshot
**User stories**
- As a user, I can enter my income, rough expenses, debts, and savings in a simple flow.
- As a user, I can choose my primary goal type from templates.

**Key components**
- Onboarding wizard UI (multi-step).
- Data models:
  - `Income` (amount, frequency)
  - `ExpenseEstimate` (simple total or 3–4 categories)
  - `Debt` (type, balance, rate, min_payment)
  - `Savings` / `Investment` (balance)
- Goal template selection and basic behavioral questions:
  - “What derails you?”
  - Preferred check-in frequency.

---

### C. Goal definition & planning engine
**User stories**
- As a user, I can define 1–3 goals with target amount and date.
- As a user, I can see how much I need to contribute each period and whether it’s realistic.

**Key components**
- `Goal` model: type, target_amount, target_date, priority, status.
- Planning engine:
  - Estimate monthly surplus from snapshot.
  - Allocate surplus across goals by priority.
  - Compute required monthly contribution per goal.
  - Label feasibility (`Comfortable`, `Tight`, `Unrealistic`) with an explanation.
- UI to:
  - Configure goals.
  - Adjust date/amount and see recalculated numbers.
  - Reorder priorities.

---

### D. Commitment & habit setup
**User stories**
- As a user, I can translate my plan into specific recurring actions.
- As a user, I can write down why a goal matters and commit to a 30‑day experiment.

**Key components**
- `ActionPlan` / `Habit` model:
  - Type: automated transfer / manual habit.
  - Amount, frequency, day of month/week.
  - Linked to goal.
- Commitment & “why” text stored per goal.
- UI:
  - For each goal, suggest 1–2 actions.
  - Let user confirm “I set this up” or “Remind me later”.

---

### E. Tracking & weekly check‑ins
**User stories**
- As a user, I can see progress towards each goal and whether I’m on track.
- As a user, I can complete a weekly check‑in to log if I followed my plan and how I feel.

**Key components**
- `GoalProgress` model:
  - Current_balance, last_update_date, source (manual/derived).
- Dashboard:
  - Top 1–2 goals with progress bars and status (on/slightly behind/off track).
- Weekly check‑in flow:
  - Questions: transfer done? spending vs plan? mood/stress.
  - Store check‑in entries with timestamps.
  - Instant feedback + streak tracking (simple `streak_count` per user).

---

### F. Nudges & notifications (behavior engine v1)
**User stories**
- As a user, I get timely reminders to take actions I committed to.
- As a user, I get a weekly summary that tells me where I stand and what to focus on.

**Key components**
- `NudgeSchedule` / `Notification` model:
  - Type (weekly_summary, pre_transfer_reminder, checkin_reminder).
  - Channel (email; later push).
  - Next_send_at, status.
- Rules:
  - On sign‑up, create weekly summary + check‑in nudges based on preference.
  - For each action plan, create pre‑due reminder.
  - If multiple nudges are ignored, scale down frequency.
- Email templates and sending pipeline.

---

### G. Education snippets (micro‑content)
**User stories**
- As a user, I get bite‑sized explanations when they’re relevant to the decision I’m making.

**Key components**
- `EducationSnippet` model:
  - Topic, short_title, content, context_trigger (e.g., goal_type=debt, feasibility=Unrealistic).
- Simple renderer in UI:
  - Inline cards during goal setup and plan review.

---

### H. Analytics & admin
**User stories**
- As a product owner, I can see key funnel and engagement metrics.
- As a product owner, I can review anonymized usage patterns.

**Key components**
- Event tracking:
  - `onboarding_step_completed`, `goal_created`, `plan_generated`, `checkin_completed`, `action_confirmed`, `dashboard_viewed`.
- Basic dashboards or exported data to your analytics tool.

---

## 2. Simple roadmap

### Phase 0 – Foundations (Sprints 1–2)
**Goals:** Get basic skeleton app with auth and simple dashboard.

**Scope:**
- Set up repo, CI, environments.
- Implement authentication and user profile, including input validation and basic rate limiting on auth endpoints.
- Add initial logging and a small test suite around auth and config loading.
- Barebones home screen (e.g., “no goals yet, create one”).

**Deliverable:** Users can sign up/log in and see a placeholder home page.

---

### Phase 1 – Goal planning core (Sprints 3–4)
**Goals:** Let users set up a snapshot and generate a plan.

**Scope:**
- Onboarding wizard:
  - Income, rough expenses, debts, savings.
  - Goal template selection + primary goal creation.
- Planning engine v1:
  - Estimate surplus and required monthly contributions.
  - Feasibility labels and explanations.
- Goal management UI:
  - Add/edit/delete goal.
  - Adjust date/amount and recalc.

**User value:** “I can get a personalized, feasible financial plan from my numbers.”

---

### Phase 2 – Action plans & commitments (Sprints 5–6)
**Goals:** Turn plans into actual recurring behaviors.

**Scope:**
- Action/habit model and UI:
  - Suggested actions per goal.
  - User can set frequency and confirm they’ve set up transfers/habits.
- Commitment screen:
  - 30‑day commitment statement.
  - “Why this goal matters” note.
- Basic streak logic tied to completed weekly actions (even if manual).

**User value:** “I know exactly what I’m doing weekly/monthly for my goals.”

---

### Phase 3 – Tracking & check‑ins (Sprints 7–8)
**Goals:** Close the loop with progress and feedback.

**Scope:**
- Progress dashboard:
  - Per‑goal current balance (manual input) and on/off‑track label.
- Weekly check‑in flow:
  - Quick questions, feedback messages, and streak counter.
- Goal progress model and manual updates.

**User value:** “I get regular feedback and can adjust when I slip.”

---

### Phase 4 – Nudges & weekly summaries (Sprints 9–10)
**Goals:** Add behavioral engine v1 to drive consistency.

**Scope:**
- Email infrastructure and templates.
- Weekly summary job:
  - For each user with active plan, send a simple summary + single focus action.
- Reminders:
  - Pre‑action reminder for scheduled transfers/habits.
  - Check‑in reminder if missed.
- Respect user preferences for frequency and quiet hours (simple rules).

**User value:** “I don’t forget, and the app nudges me at the right times.”

---

### Phase 5 – Education snippets & polish (Sprints 11–12)
**Goals:** Reduce confusion and increase perceived guidance.

**Scope:**
- Content authoring for 8–12 snippets.
- Contextual display during:
  - Goal type selection.
  - When a plan is marked “Tight” or “Unrealistic.”
- UX polish:
  - Empty‑state copy.
  - Better visual representation of progress.

**User value:** “I understand *why* the app suggests this plan and feel guided, not judged.”

---

### Phase 6 – Private beta & iteration (ongoing)
**Goals:** Validate concept and tune behavior.

**Scope:**
- Onboard 20–100 test users.
- Instrument analytics funnel dashboards.
- Run qualitative interviews after a few weeks of usage.
- Iterate on onboarding, nudges, and planning logic based on data and feedback.
