# ERD – FinCred MVP

This document describes the core data model for the FinCred MVP in terms of entities and relationships.

## Core entities

### 1. User
- `id`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

Relationships:
- 1 User has 1 Profile.
- 1 User has many Goals.
- 1 User has many Debts.
- 1 User has many SavingsAccounts.
- 1 User has many Incomes and ExpenseEstimates (or a single current snapshot).
- 1 User has many CheckIns.
- 1 User has many Notifications / NudgeSchedules.

### 2. Profile
- `id`
- `user_id` (FK User)
- `country`
- `currency`
- `age_range`
- `employment_status` (optional)
- `reminder_frequency` (e.g., weekly, biweekly)
- `preferred_checkin_day_of_week`
- `persona_hint` (new_grad, young_professional, fire_enthusiast)

### 3. Income
- `id`
- `user_id` (FK User)
- `amount`
- `frequency` (monthly, biweekly, weekly, annual)
- `source_label` (optional)
- `created_at`

### 4. ExpenseEstimate
- `id`
- `user_id` (FK User)
- `total_amount` OR separate simple buckets (e.g., `housing`, `food`, `transport`, `discretionary`)
- `created_at`

(For MVP you can start with a single `total_amount` and evolve to categories later.)

### 5. Debt
- `id`
- `user_id` (FK User)
- `type` (student_loan, credit_card, personal_loan, etc.)
- `name`/`label`
- `balance`
- `interest_rate_annual`
- `min_payment`
- `created_at`

### 6. SavingsAccount (or simple SavingsBalance)
- `id`
- `user_id` (FK User)
- `label` (e.g., "emergency fund", "brokerage")
- `balance`
- `created_at`

### 7. Goal
- `id`
- `user_id` (FK User)
- `type` (debt_payoff, emergency_fund, short_term_saving, fire_starter)
- `name`
- `target_amount`
- `target_date`
- `priority` (High, Medium, Low)
- `status` (active, paused, completed, cancelled)
- `primary_flag` (bool)
- `why_text` (user’s motivation)
- `created_at`
- `updated_at`

Relationships:
- 1 Goal has many ActionPlans.
- 1 Goal has many GoalProgress records.

### 8. ActionPlan / Habit
- `id`
- `user_id` (FK User)
- `goal_id` (FK Goal)
- `type` (automated_transfer, manual_habit)
- `amount`
- `frequency` (monthly, biweekly, weekly)
- `day_of_period` (e.g., day of month or weekday)
- `is_confirmed_set_up` (bool)
- `created_at`
- `updated_at`

Relationships:
- 1 ActionPlan can generate many scheduled Notifications.

### 9. GoalProgress
- `id`
- `user_id` (FK User)
- `goal_id` (FK Goal)
- `current_balance`
- `source` (manual_entry, derived)
- `note` (e.g., unexpected expense)
- `recorded_at`

### 10. CheckIn
- `id`
- `user_id` (FK User)
- `completed_at`
- `period_start` (optional)
- `period_end` (optional)
- `made_planned_payments` (enum: yes, no, partial)
- `spending_vs_plan` (under, on, over)
- `mood_score` (1–5)
- `comment` (optional free text)

### 11. Notification / NudgeSchedule
- `id`
- `user_id` (FK User)
- `action_plan_id` (FK ActionPlan, nullable if generic)
- `type` (weekly_summary, pre_transfer_reminder, checkin_reminder)
- `channel` (email, push)
- `next_send_at`
- `last_sent_at`
- `status` (active, paused, cancelled)

Optionally a separate `NotificationLog` to store each actual send event.

### 12. EducationSnippet
- `id`
- `topic` (debt_methods, emergency_fund, fire_basics, etc.)
- `short_title`
- `content` (short text)
- `context_goal_type` (nullable)
- `context_feasibility` (nullable: Comfortable, Tight, Unrealistic)

### 13. Event (for analytics – optional table if not using an external tool)
- `id`
- `user_id` (FK User)
- `name` (e.g., onboarding_step_completed, goal_created)
- `properties` (JSON)
- `created_at`

## Relationships overview

High-level cardinalities:

- User 1 — 1 Profile
- User 1 — * Income
- User 1 — * ExpenseEstimate
- User 1 — * Debt
- User 1 — * SavingsAccount
- User 1 — * Goal
- Goal 1 — * ActionPlan
- Goal 1 — * GoalProgress
- User 1 — * CheckIn
- User 1 — * Notification/NudgeSchedule
- ActionPlan 1 — * Notification/NudgeSchedule (for reminders)
- EducationSnippet is standalone and selected by context.

## ASCII ERD sketch

```text
User (1)
  |--(1) Profile
  |--(*) Income
  |--(*) ExpenseEstimate
  |--(*) Debt
  |--(*) SavingsAccount
  |--(*) Goal ---(*) ActionPlan ---(*) Notification
  |          \
  |           \--(*) GoalProgress
  |--(*) CheckIn
  |--(*) Notification (generic, e.g., weekly summary)
  |--(*) Event (analytics)

EducationSnippet (independent, selected by goal_type/feasibility context)
```

This ERD is intentionally simple and biased towards the MVP; in later iterations you can normalize or extend it (e.g., separate snapshots, link debts/savings directly to goals for more precision, add transaction‑level data when you integrate banks).
