# Product Requirements Document (PRD) – MVP
Working name: **FinCred** (placeholder)

## 1. Product overview

**One-liner**  
A behavior‑change app that helps young professionals, new grads with debt, and FIRE enthusiasts turn financial goals into step‑by‑step plans, then stay on track with smart nudges until those goals are achieved.

**Core idea**  
Combine basic financial planning with behavioral science to:
- Clarify goals (debt payoff, emergency fund, FI number, etc.)
- Diagnose where the user stands today
- Generate a realistic, prioritized plan
- Drive follow‑through via habits, automation, and feedback

## 2. Problem & rationale

**Problems for our target users:**
- They have **competing goals** (debt payoff vs investing vs lifestyle).
- They **know** what they “should” do but struggle with **consistency**.
- Tools today:
  - Budgeting apps = tracking, not behavior change.
  - Spreadsheets = overwhelming, static, no feedback loops.
  - FIRE content = high‑level theory, not personalized execution.

**Why now / why this:**
- Growing FIRE movement and financial anxiety among young adults.
- Plenty of data/trackers, few products explicitly designed around **behavioral change** and **implementation support**.

## 3. Objectives & success criteria

### Business objectives (for MVP)

- Validate that:
  - Users are willing to input meaningful financial data.
  - Users follow the generated plan for at least a few weeks.
- Learn which **nudges** and **habits** are most effective.

### User objectives

1. “I can see a **clear plan** from where I am to where I want to go.”
2. “I know **what I should do this week** for my top financial goal.”
3. “I feel **less stress and more control** over my money.”

### MVP success metrics (leading indicators)

- **Activation:**
  - ≥ 60% of new signups complete onboarding and create at least 1 goal + plan.
- **Engagement (first 4 weeks):**
  - ≥ 40% of activated users complete at least 2 weekly check‑ins.
  - ≥ 30% set up at least 1 recurring action (e.g., automated transfer or manual habit).
- **Perceived value (qualitative):**
  - ≥ 70% of interviewed beta users say the app “makes it easier to stick to my plan.”

(Actual financial outcome metrics—like higher savings rate—will be tracked but may not move significantly in MVP timeframe.)

## 4. Target users & personas

### Primary segments

1. **New grads with debt**  
   - Age: 21–28  
   - Key goal: Pay off student loans / high‑interest debt while still building a small buffer.  
   - Pain: Overwhelm, doesn’t know what’s realistic or which loan to prioritize.

2. **Young professionals (0–10 years into career)**  
   - Age: 23–35  
   - Key goals: Build emergency fund, pay off consumer debt, start investing.  
   - Pain: Competing priorities, variable spending, lack of consistent system.

3. **Early‑stage FIRE enthusiasts**  
   - Age: 24–40  
   - Key goals: Hit FI number by target age, aggressively save/invest.  
   - Pain: Translating FIRE theory into actionable daily/weekly routines and staying on track with high savings rates.

For MVP, **optimize primarily for persona #2**, while still supporting #1 and #3 with slightly different goal templates.

## 5. Key use cases (MVP)

1. User defines 1–3 top financial goals (e.g., debt payoff, emergency fund, FI number).
2. User inputs their current financial picture at a high level.
3. App generates a **prioritized, feasible plan** with required monthly contributions and tradeoffs.
4. User sets up **recurring actions** (automatic transfers and/or manual habits).
5. User receives **weekly check‑ins** and **simple nudges** to adjust behavior.
6. User **tracks progress** and sees whether they are on track, ahead, or behind.

## 6. In‑scope features (MVP)

### 6.1 Platforms

- **Primary:** Mobile‑friendly web app (responsive) or lightweight mobile app (choose one based on implementation preference; PRD assumes mobile‑first, but web is acceptable as long as UX is simple and habit‑friendly).
- Email notifications for nudges and weekly summaries.
- Push notifications optional for MVP (nice‑to‑have if mobile).

### 6.2 Onboarding & profile

**Goals:**
- Capture enough info to create a meaningful plan without overwhelming the user.
- Begin behavior‑change orientation from the first session.

**Requirements:**
- Create account (email + password, or OAuth provider).
- Collect:
  - Age range, country (for currency), employment status (optional).
  - Net monthly income (or salary / frequency).
  - Rough monthly spending (either a single number or simple categories).
  - Existing debts (simple: type, balance, interest rate, minimum payment).
  - Existing savings/investments (balances only, no institutions).
- Select **initial primary goal** from templates:
  - “Pay off high‑interest debt”
  - “Build an emergency fund”
  - “Save for [short‑term goal] (e.g., travel, moving, course)”
  - “Start on FIRE path” (define FI number and target age – simplified).
- Ask one **behavioral question**:
  - “What typically derails your plans?” (e.g., emotional spending, forgetting, unexpected expenses).
  - “How often do you want to be reminded/check in?” (1–2 times/week).

### 6.3 Goal definition & planning

**Goals:**
- Turn vague goals into **specific, time‑bound targets.**
- Generate a simple, explainable plan.

**Requirements:**
- For each goal:
  - Type (debt payoff, emergency fund, short‑term savings, FIRE starter).
  - Target amount and target date (app can suggest a default).
  - Priority (High / Medium / Low).
- App uses:
  - Income, spending, and existing obligations to:
    - Estimate available monthly surplus.
    - Allocate surplus across goals based on priority.
- Output per goal:
  - Required contribution per month.
  - Feasibility label: `Comfortable`, `Tight`, or `Unrealistic`.
  - Simple explanation: “Given your current numbers, contributing $X/month is [tight / comfortable].”
- User can:
  - Adjust goal dates or amounts and see updated required contributions.
  - Reorder priorities and see how contributions shift.

**Behavioral layer:**
- Ask user to **commit**:  
  - “For the next 30 days, I will contribute $X/month or $Y/week towards [goal].”
- Option to write a **short reason**: “Why is this goal important to you?” (used later in nudges).

### 6.4 Action & habit setup

**Goals:**
- Translate the plan into concrete recurring actions.
- Encourage automation where possible.

**Requirements:**
- For each goal, suggest:
  - **Automated action:** “Set up an automatic transfer of $X on [date after payday].”
  - **Manual habit:** “Each week, review spending and move leftover cash into savings.”
- For MVP, *do not* handle actual banking integration; users manually confirm:
  - “I set up this transfer with my bank” (check box).
  - If they haven’t, the app will remind them.
- User can:
  - Choose frequency: monthly/bi‑weekly/weekly.
  - Choose preferred reminder day/time (approximate).

### 6.5 Tracking & check‑ins

**Goals:**
- Maintain engagement and allow small course corrections.
- Provide simple, encouraging feedback.

**Requirements:**
- **Progress dashboard:**
  - Top 1–2 goals with:
    - Current amount vs target.
    - “On track / Slightly behind / Off track” label.
  - Basic trend (line or progress bar).
- **Weekly check‑in flow:**
  - 2–4 quick questions:
    - “Did you make your planned transfer/payment this week?” (Yes/No/Partial)
    - “How was your spending compared to your plan?” (Under/On/Over)
    - Mood or stress rating (1–5).
  - Immediate feedback:
    - If on track: positive reinforcement, streak count.
    - If off track: empathetic message + actionable suggestion.
- Manual updates:
  - Users can adjust “current saved” or “current debt balance” for each goal.
  - Option to note “unexpected expense” as reason.

### 6.6 Nudges & notifications (behavioral engine v1)

**Goals:**
- Drive consistency without overwhelming users.

**Requirements:**
- **Weekly summary email**:
  - Goals overview.
  - On‑track vs off‑track status.
  - Suggested “focus for this week” single action.
- **Just‑in‑time nudges** (limited set for MVP):
  - Reminder 1–2 days before planned transfer/payment date.
  - Reminder to complete weekly check‑in if missed.
- Nudge content:
  - Short, positive, and specific.
  - Occasionally include user’s written “why” statement.
- Basic personalization:
  - Honor user’s selected frequency.
  - If user repeatedly ignores certain nudges, reduce that type.

### 6.7 Education snippets (micro‑content)

**Goals:**
- Provide “just‑in‑time” financial education related to current decision.

**Requirements (lightweight):**
- 8–12 short snippets:
  - Debt payoff methods (snowball vs avalanche).
  - Why an emergency fund matters.
  - Basics of FIRE (savings rate & FI number).
  - How to choose a realistic timeline.
- Displayed contextually:
  - When user chooses goal type.
  - When plan is labeled “tight” or “unrealistic.”
- No deep library or search needed for MVP.

## 7. Out‑of‑scope (for MVP)

- Bank account aggregation and transaction imports.
- Executing transfers/payments within the app.
- Detailed investment advice or portfolio recommendations.
- Complex tax optimization, retirement calculators, or multi‑currency support.
- Social/sharing features (e.g., shared goals, community feeds).
- Gamification beyond simple streaks and basic badges.

## 8. Non‑functional requirements

- **Security & privacy:**
  - All user data encrypted at rest and in transit.
  - No collection of bank credentials in MVP.
  - Clear positioning as **educational/coaching**, not regulated investment advice.
- **Performance:**
  - Main screens should load within ~2 seconds on average mobile connections.
- **Reliability:**
  - Core functions (login, view plan, log check‑in) > 99% uptime target.
- **Accessibility:**
  - Mobile‑friendly, readable typography, minimal input friction.

## 9. Analytics & event tracking (MVP)

Track at minimum:

- **Onboarding funnel:**
  - Account created
  - Income/expense input completed
  - First goal created
  - First plan generated
- **Behavioral events:**
  - Check‑in completed (weekly)
  - Planned action confirmed (e.g., “transfer set up”)
  - Goal progress update made
- **Engagement:**
  - App opens per week
  - Email open/click for weekly summary and reminders
- **Outcomes (self‑reported):**
  - Initial baseline savings rate (rough).
  - Updated savings rate or debt payment amount after 4 weeks (if user updates data).

## 10. Risks & open questions

**Risks:**
- Users may be reluctant to input accurate numbers without clear trust signals.
- Over‑ or under‑nudging could reduce engagement.
- If plans feel unrealistic or too generic, users will churn.

**Open questions (to validate via MVP):**
- How much data are users willing to enter in onboarding before dropping off?
- What’s the ideal cadence and tone of nudges for different personas?
- Do users value more precise financial modeling, or simpler, more “human” guidance?
