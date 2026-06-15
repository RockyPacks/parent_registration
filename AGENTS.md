# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

A multi-step student enrollment platform for South African schools. Parents register learners through a 6-step form: Student & Guardian info → Document Upload → Academic History → Fee Agreement → Declaration → Review & Submit.

**Stack:** React 19 + TypeScript (Vite) frontend, FastAPI (Python) backend, Supabase (PostgreSQL + Auth + Storage).

---

## Development Commands

### Frontend

```bash
cd frontend
npm install
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build
npm test           # Jest tests
npm run test:watch # Jest in watch mode
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Swagger docs at http://localhost:8000/docs
```

### Database Migrations

```bash
cd backend
python run_migration.py      # Run a specific migration
python apply_migrations.py   # Apply all pending migrations
```

Migrations live in `backend/db/migrations/` as numbered SQL files (e.g. `005_*.sql`). Always increment the prefix.

---

## Environment Variables

**Frontend** (`.env.local`):
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — main Supabase project
- `VITE_SCHOOLS_SUPABASE_URL` / `VITE_SCHOOLS_SUPABASE_ANON_KEY` — separate Supabase project for school/organization data (knit-architect)
- `VITE_API_BASE_URL` — backend URL, defaults to `http://localhost:8000/api/v1`

**Backend** (`.env`):
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` — required
- `FRONTEND_URL` — added to CORS allowlist

The frontend talks directly to Supabase for auth and the schools dropdown; it talks to the FastAPI backend for all enrollment data.

---

## Architecture

### Auth Flow

1. User signs in via Supabase Auth (frontend `src/services/auth.ts` + `supabase.ts`)
2. Supabase returns a JWT
3. Every API call to the FastAPI backend sends `Authorization: Bearer <jwt>`
4. Backend verifies the JWT using `SUPABASE_JWT_SECRET` (`backend/app/core/security.py`) and extracts `user_id` via the `get_current_user` FastAPI dependency

### Frontend State

`App.tsx` is the single source of truth — it holds enrollment data, step completion flags, and authentication state. It passes data and callbacks down to step components. There is no Redux or Zustand. Auto-save is triggered on step transitions.

The 6-step workflow is rendered through `MainContent.tsx`, which maps the current step to the correct component. Step components live in `frontend/src/components/form/`.

### Backend Layers

```
Router (api/v1/routers/)  →  Service (services/)  →  Repository (repositories/)  →  Supabase
```

- **Routers** handle HTTP, validate with Pydantic schemas (`api/v1/schemas/`), and call services
- **Services** contain business logic
- **Repositories** contain all Supabase SDK calls; `base.py` provides shared CRUD helpers

Middleware stack (applied in `main.py`): TrustedHost → Rate Limiting (60 req/min) → Request Size Limit (10 MB) → CORS → GZip → Security Headers → Performance Monitoring.

### Database / RLS

Supabase RLS policies restrict every table to `auth.uid() = user_id`. When adding new tables, always add RLS policies — do not rely solely on backend auth.

The schools dropdown reads from a **separate** Supabase project (`VITE_SCHOOLS_SUPABASE_URL`) — the knit-architect organizations table — not the main enrollment database.

### PDF Generation

The Declaration step generates a PDF client-side using `jspdf` + `html2canvas`. The resulting file is uploaded to Supabase Storage and a signed URL is stored in the `declarations` table.

---

## Key Files

| Path | Purpose |
|------|---------|
| `frontend/App.tsx` | Root component; owns all enrollment + auth state |
| `frontend/src/components/MainContent.tsx` | Step router — maps step index to form component |
| `frontend/src/services/api.ts` | All HTTP calls to FastAPI; handles camelCase ↔ snake_case |
| `frontend/src/services/auth.ts` | Supabase auth helpers (login, signup, session) |
| `backend/app/main.py` | FastAPI app creation and middleware registration |
| `backend/app/core/security.py` | JWT verification and `get_current_user` dependency |
| `backend/app/repositories/base.py` | Base repository with shared Supabase helpers |
| `backend/db/migrations/` | SQL migration files — numbered, applied in order |

## Production Deployment

Frontend and backend are deployed to **Render**. Backend is at `parent-registration.onrender.com`; frontend at `parent-registration-frontend.onrender.com`. CORS is pre-configured for these domains in `main.py`.
