# BioShield Flood Dashboard Implementation Plan

This plan incorporates the user's feedback (using SQLite instead of Postgres, removing Redis, using shadcn with custom colors, and separating mock data).

## Goal Description
Build BioShield Flood Dashboard, a full-stack web application translating weather/river data into a district-level biological risk score. The stack uses Next.js 14 (App Router) + TailwindCSS + shadcn/ui for the frontend, and Python FastAPI + async SQLAlchemy + SQLite for the backend. 

The build focuses on 38 curated flood-prone districts with real OpenWeatherMap polling, mock adapters for IMD and CWC, and a mock-by-default alerting subsystem. Historical replay and validation are included to test the risk engine.

## Proposed Changes

We will execute this project phase by phase. After each phase, we will perform a lightweight check, update `PROGRESS.md`, and proceed automatically.

### Phase 1: Scaffolding
- Set up repo structure (`backend/`, `frontend/`, `.env.example`, `README.md`, `PLAN.md`, `PROGRESS.md`).
- Initialize FastAPI skeleton with `/api/health`.
- Initialize Next.js 14 skeleton with shadcn/ui. Apply custom color palette (`#FDF4AF`, `#A5E9DD`, `#6FBEB2`, `#34908B`).
- Initialize Alembic for SQLite database migrations.

### Phase 2: Schema + Seed
- Migrate all tables to SQLite (`districts`, `weather_observations`, `river_levels`, `risk_scores`, `subscribers`, `subscriber_districts`, `alerts_log`, `admin_users`, `admin_reports`). GeoJSON will be stored as JSON since PostGIS is removed.
- Create `seed_districts.py` to populate 766 placeholder rows + 38 curated districts.
- Extract mock/seed data into separate JSON files.

### Phase 3: Risk Engine
- Implement W, E, V, and R score computations.
- Write pytest suite for boundary conditions.

### Phase 4: Data Adapters + Ingestion
- Implement `adapters/openweather.py` (real, hourly).
- Implement `adapters/imd_mock.py` and `adapters/cwc_mock.py`.
- Implement `ingestion/scheduler.py` to run the hourly job.
- Verify ingestion flow works via DB query.

### Phase 5: Backend API
- Implement all endpoints.
- Set up JWT auth for admin routes.
- Implement rate limiting and debounce using SQLite or in-memory stores.

### Phase 6: Alerting
- Build the dispatcher and mock-mode logging.

### Phase 7: Frontend
- Build all six screens using shadcn.

### Phase 8: Historical Replay & Validation
- Seed three synthetic series.
- Implement the replay pipeline.

### Phase 9: Polish & Local Run Docs
- Finalize `README.md` with local setup commands (no Docker needed).
- Confirm both servers start cleanly.
