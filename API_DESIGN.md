# API Design – FinCred MVP

This document outlines a high-level REST-style API for the FinCred MVP.

Base URL: `/api/v0`.

All endpoints are versioned under `/api/v0/...` for the initial MVP; breaking changes in the future will use `/api/v1`, `/api/v2`, etc.

## 1. Authentication & user profile

### POST `/auth/register`
Create a new user.

**Request body (JSON)**
- `email` (string)
- `password` (string)

**Validation**
- `email` must be a valid email address and unique per user.
- `password` must meet minimum strength rules (e.g., length ≥ 8 and ≤ 128; additional complexity rules may be added later).

**Response**
- `user` (object)
- `token` (JWT or similar)

### POST `/auth/login`
Authenticate an existing user.

**Request body**
- `email`
- `password`

**Response**
- `user`
- `token`

### GET `/me`
Return the authenticated user and profile.

**Response**
- `user`: id, email, created_at
- `profile`: country, currency, age_range, employment_status, reminder_frequency, persona_hint

### PUT `/me/profile`
Update profile and preferences.

**Request body (partial)**
- `country`
- `currency`
- `age_range`
- `employment_status`
- `reminder_frequency`
- `preferred_checkin_day_of_week`
- `persona_hint`

**Validation**
- All fields are optional; when provided, they must be within allowed value sets (e.g., supported currencies, reasonable reminder frequencies).

---

## 2. Onboarding – financial snapshot

### GET `/snapshot`
Get the current basic snapshot (income, expenses, debts, savings).

### PUT `/snapshot`
Create or update snapshot in a single call (simple MVP option).

**Validation**
- Income, expenses, debt balances, and savings balances must be non-negative numbers.
- Interest rates must be within a reasonable range (e.g., 0–1 for decimal or 0–100 for percentages).

**Request body (example)**
```json
{
  "income": { "amount": 4000, "frequency": "monthly" },
  "expenses": { "total_amount": 2500 },
  "debts": [
    { "type": "credit_card", "label": "Card A", "balance": 2000, "interest_rate_annual": 0.22, "min_payment": 80 }
  ],
  "savings": [
    { "label": "Emergency fund", "balance": 500 }
  ]
}
```

**Response**
- Normalized snapshot representation with IDs created/updated.

(Alternatively, you can expose separate CRUD endpoints for income, debts, savings; but a single snapshot endpoint is simpler for MVP.)

---

## 3. Goals & planning

### GET `/goals`
List all goals for the current user.

### POST `/goals`
Create a new goal.

**Request body**
- `type` (debt_payoff, emergency_fund, short_term_saving, fire_starter)
- `name`
- `target_amount`
- `target_date`
- `priority`
- `primary_flag` (optional)

**Validation**
- `target_amount` must be greater than 0.
- `target_date` must be in the future.
- The number of active goals per user may be capped (e.g., 5) to keep plans manageable.

**Response**
- Created goal object.

### GET `/goals/{goal_id}`
Get details of a single goal, including latest progress and actions (optional expansions).

### PUT `/goals/{goal_id}`
Update a goal (e.g., change date, amount, priority, status, why_text).

### DELETE `/goals/{goal_id}`
Soft-delete or cancel a goal.

**Behavior**
- Prefer marking the goal as `cancelled`/`inactive` (soft delete) rather than removing it entirely, to preserve history.

---

### POST `/planning/plan`
Generate or refresh a plan based on current snapshot and goals.

**Behavior**
- Reads current snapshot and all active goals.
- Runs planning engine.
- Returns per-goal required monthly contribution and feasibility labels.

**Response example**
```json
{
  "goals": [
    {
      "goal_id": "g1",
      "required_monthly_contribution": 300,
      "feasibility": "Tight",
      "explanation": "Given your income and expenses, contributing $300/mo leaves little buffer."
    }
  ],
  "summary": {
    "estimated_monthly_surplus": 600,
    "allocated_to_goals": 550,
    "buffer_remaining": 50
  }
}
```

(You may store the results in a `Plan` table, but for MVP this can be a computed response each time.)

---

## 4. Action plans / habits

### GET `/goals/{goal_id}/actions`
List action plans for a goal.

### POST `/goals/{goal_id}/actions`
Create an action plan / habit for a goal.

**Request body**
- `type` (automated_transfer, manual_habit)
- `amount`
- `frequency` (monthly, biweekly, weekly)
- `day_of_period`
- `is_confirmed_set_up` (optional, default false)

### PUT `/actions/{action_id}`
Update an action plan (e.g., confirm set-up, change frequency or amount).

### DELETE `/actions/{action_id}`
Delete/cancel an action plan.

---

## 5. Goal progress & dashboard

### GET `/dashboard`
Return a compact view of top goals and current status.

**Response example**
```json
{
  "goals": [
    {
      "goal_id": "g1",
      "name": "Emergency fund",
      "target_amount": 3000,
      "current_balance": 500,
      "target_date": "2026-06-30",
      "status_label": "Slightly behind"
    }
  ]
}
```

### GET `/goals/{goal_id}/progress`
List historical progress records for a goal.

Supports optional pagination parameters similar to `/goals`.

### POST `/goals/{goal_id}/progress`
Create a new progress record (manual update).

**Request body**
- `current_balance`
- `note` (optional, e.g., "unexpected car repair")

**Validation**
- `current_balance` must be non-negative.

---

## 6. Weekly check‑ins

### GET `/checkins`
List past check-ins (for history view).

### POST `/checkins`
Create a new check-in.

**Request body**
- `made_planned_payments` (yes, no, partial)
- `spending_vs_plan` (under, on, over)
- `mood_score` (1–5)
- `comment` (optional)

**Validation**
- `mood_score` must be an integer within the expected range (e.g., 1–5).

**Response**
- Check-in record.
- Optionally, computed feedback text and current streak value.

Example response fragment:
```json
{
  "checkin": { "id": "c1", "mood_score": 3, "created_at": "2026-01-25T12:00:00Z" },
  "feedback": {
    "message": "You missed one planned payment, but this is normal. Let’s adjust this week’s amount",
    "streak": 4
  }
}
```

---

## 7. Nudges & notifications

Most notification scheduling will be done server-side via background jobs. The API mainly exposes read-only views for the client.

### GET `/notifications/upcoming`
List upcoming notifications for the user (optional, for debugging / settings UI).

### GET `/notifications/history`
List sent notifications (optional).

Server-side (no direct public endpoint, but important design notes):
- A scheduler job periodically:
  - Finds due `NudgeSchedule` records (`next_send_at <= now` and `status = active`).
  - Sends emails/push via a provider.
  - Updates `last_sent_at` and computes the next `next_send_at`.

---

## 8. Education snippets

### GET `/education/snippets`
Fetch snippets filtered by context.

**Query parameters**
- `goal_type` (optional)
- `feasibility` (optional)

**Response**
- List of relevant snippets (short text blocks) to display inline.

Example:
```json
{
  "snippets": [
    {
      "id": "s1",
      "short_title": "Snowball vs Avalanche",
      "content": "Snowball focuses on paying off the smallest balances first..."
    }
  ]
}
```

---

## 9. Analytics events (optional public API)

If you use a third‑party analytics SDK you may not need this. Otherwise:

### POST `/events`
Log a client-side analytics event.

**Request body**
- `name` (e.g., "onboarding_step_completed")
- `properties` (JSON object)

**Response**
- 200 OK on success.

---

## 10. Authentication & security considerations

- All endpoints (except `/auth/register`, `/auth/login`) require an auth token.
- Use HTTPS everywhere in non-local environments.
- Rate-limit auth and write-heavy endpoints to mitigate brute-force and abuse.
- JWT access tokens include expirations; clients should refresh/re-authenticate as needed.
- For MVP, scope tokens per user only (no multi-tenant roles yet).
- Secrets (JWT keys, DB passwords, email API keys) must be stored only in environment configuration, not in source control.

## 11. Error responses

To keep error handling consistent:

- Validation errors may use FastAPI’s default 422 format.
- Other errors should generally return a JSON body like:

  ```json
  {
    "detail": "Human-readable message",
    "code": "OPTIONAL_ERROR_CODE"
  }
  ```

Typical status codes:

- `400` – bad input / validation errors not covered by 422.
- `401` – unauthenticated (missing/invalid token).
- `403` – forbidden (reserved for future roles/permissions).
- `404` – resource not found (goal, action, notification, etc.).
- `409` – conflicts (e.g., duplicate email on registration).

This design is intentionally minimal and focused on enabling the core flows: onboarding, planning, action setup, check-ins, and nudges. You can refine payloads and add pagination/filters as the product evolves.
