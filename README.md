# FinCred

FinCred is an AI-powered financial coach that helps young professionals, new grads with debt, and FIRE enthusiasts turn financial goals into step‑by‑step plans, then stay on track with behavioral nudges until those goals are achieved.

This repo currently contains the backend API for the MVP and product design docs (PRD, ERD, API design, roadmap).

## Problem

Many people know what they "should" do with money—pay off high‑interest debt, build an emergency fund, start investing—but struggle with:

- Competing goals (debt vs investing vs lifestyle)
- Inconsistent follow‑through
- Overwhelming or static tools (spreadsheets, generic budgeting apps)
- Lack of personalized, ongoing guidance

FinCred focuses on behavior change and personalized coaching rather than just tracking transactions.

## Who it’s for

Primary users:

- **New grads with debt** – want to pay off student loans / credit cards while building a small buffer.
- **Young professionals** – want an emergency fund, debt payoff, and to start investing.
- **Early‑stage FIRE enthusiasts** – want to push savings rates toward a financial independence goal.

For the MVP, we optimize primarily for young professionals, while still supporting the other segments.

## Core MVP experience

At a high level, the MVP lets a user:

1. **Sign up & set preferences** (auth + basic profile).
2. **Provide a simple financial snapshot** – income, rough expenses, debts, savings.
3. **Define 1–3 goals** – e.g. debt payoff, emergency fund, short‑term saving, FIRE starter.
4. **Get a plan** – required contributions per period, feasibility (“Comfortable/Tight/Unrealistic”), and tradeoffs.
5. **Set up recurring actions** – automatic transfers (confirmed externally) and manual habits.
6. **Check in weekly** – log whether they followed the plan and how they feel.
7. **Receive nudges** – weekly summaries and reminders around actions/check‑ins.
8. **Track progress** – see progress bars, status labels, and basic insights.

Behavioral science and (later) AI are layered on top via:

- Clear, specific goal setting
- Commitments and "why" statements
- Small, recurring actions
- Streaks and milestones
- Contextual nudges and feedback

See `PRD.md` for full product detail.

## Repository structure

Top level:

- `backend/` – FastAPI backend service
- `PRD.md` – Product Requirements Document
- `FEATURE_BREAKDOWN_AND_ROADMAP.md` – feature breakdown + phased roadmap
- `ERD.md` – data model / entity‑relationship design
- `API_DESIGN.md` – high‑level REST API design

Backend layout (MVP):

- `backend/app/main.py` – FastAPI app factory and router registration
- `backend/app/core/` – config and security (settings, JWT, password hashing)
- `backend/app/db/` – database engine & session (SQLModel + Postgres)
- `backend/app/models/` – database models (User, Profile, etc.)
- `backend/app/schemas/` – Pydantic/SQLModel schemas for requests & responses
- `backend/app/api/v0/` – versioned API modules
  - `deps.py` – shared dependencies (DB session, current user)
  - `routers/` – versioned routers (e.g. `auth`, `users`)

## Tech stack (backend MVP)

- **Language:** Python 3.11+
- **Framework:** FastAPI
- **ORM / models:** SQLModel (on top of SQLAlchemy)
- **Database:** PostgreSQL
- **Auth:** JWT-based (via `python-jose`)
- **Password hashing:** Passlib (PBKDF2‑SHA256)
- **Config:** `pydantic-settings` with `.env`

The API is versioned under `/api/v0/...` to make future breaking changes easier to manage.

## Getting started (backend)

From the repo root (`fincred/`):

1. **Create and activate a virtual environment** (example with `python -m venv`):

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # on Windows
   ```

2. **Install dependencies** (example):

   ```bash
   pip install fastapi "uvicorn[standard]" sqlmodel psycopg2-binary \
       python-jose[cryptography] passlib[bcrypt] pydantic-settings
   ```

3. **Configure environment**

   Copy the example env and adjust if needed:

   ```bash
   cd backend
   copy .env.example .env  # or use your editor
   ```

   By default, `.env` contains placeholders like:

   ```env
   PROJECT_NAME="FinCred API"
   SQLALCHEMY_DATABASE_URI="postgresql+psycopg2://user:password@localhost:5432/fincred"
   JWT_SECRET_KEY="dev_secret_change_me"
   JWT_ALGORITHM="HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

   Make sure you have a Postgres instance running and update `SQLALCHEMY_DATABASE_URI` accordingly.

4. **Run the backend**

   From `backend/`:

   ```bash
   uvicorn app.main:app --reload
   ```

5. **Explore the API**

   Once the server is running, open:

   - Swagger UI: `http://127.0.0.1:8000/docs`

   Example endpoints (v0):

   - `POST /api/v0/auth/register` – register with email + password, return JWT
   - `POST /api/v0/auth/login` – obtain a JWT via OAuth2 password flow
   - `GET  /api/v0/me` – get current user
   - `PUT  /api/v0/me/profile` – update profile (country, currency, etc.)

## Roadmap (high level)

Shortened from `FEATURE_BREAKDOWN_AND_ROADMAP.md`:

1. **Foundations** – auth, profile, basic backend skeleton.
2. **Goal planning core** – snapshot input, goal models, planning engine v1.
3. **Action plans & commitments** – link plans to recurring actions and habit tracking.
4. **Tracking & check‑ins** – weekly check‑ins, progress dashboard, streaks.
5. **Nudges & summaries** – weekly email summaries & reminders.
6. **Education & polish** – contextual micro‑content and UI/UX refinements.
7. **Private beta & iteration** – onboard early users, instrument analytics, refine.

## Design references

- Detailed product spec: `PRD.md`
- Data model / ERD: `ERD.md`
- REST API design: `API_DESIGN.md`
- Feature breakdown & phases: `FEATURE_BREAKDOWN_AND_ROADMAP.md`

These documents are the source of truth for product behavior while the MVP is under active development.
