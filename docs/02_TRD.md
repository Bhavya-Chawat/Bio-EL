# BioShield Flood Dashboard — Technical Requirements Document (TRD)

Companion to `01_PRD.md`. This is the implementation-level spec: stack, schema, API surface,
risk engine logic, data adapters, alerting, and local dev setup.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + TailwindCSS | SSR for the data-heavy map page; matches ELR report. |
| Map | Leaflet.js + react-leaflet | Free, open-source, no billing. |
| Charts | Recharts | 7-day trend lines on district detail. |
| Backend | Python FastAPI + Pydantic v2 | Async, auto OpenAPI docs. |
| ORM / migrations | SQLAlchemy 2.0 (async) + Alembic | Standard, well-supported. |
| DB | PostgreSQL 15 + PostGIS 3.3 | Spatial queries on district boundaries. |
| Cache / debounce | Redis 7 | Map-endpoint caching + 12h alert debounce TTL keys. |
| Auth | JWT (python-jose) for admin routes | Stateless, simple. |
| Alerts (pluggable) | Twilio (SMS), SendGrid (email), Firebase Admin SDK (push) — **mock-mode by default** | Real send only if env keys present. |
| Local infra | Docker Compose (postgres + redis only) | Frontend/backend run natively via `npm run dev` / `uvicorn` for fast iteration. |
| Testing | Pytest (backend), Vitest/Jest (frontend, optional) | Risk engine must be unit-tested. |

## 2. Repo Layout

```
bioshield/
├─ docker-compose.yml              # postgres + redis only
├─ .env.example
├─ README.md
├─ PLAN.md                         # written by the build agent before coding
├─ PROGRESS.md                     # updated after each phase
├─ backend/
│  ├─ requirements.txt
│  ├─ alembic/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ core/            # config.py, security.py
│  │  ├─ db/              # models.py, session.py
│  │  ├─ risk_engine/     # w.py, e.py, v.py, r.py
│  │  ├─ adapters/        # openweather.py, imd_mock.py, cwc_mock.py, census_seed.py
│  │  ├─ alerts/          # dispatcher.py, twilio_adapter.py, sendgrid_adapter.py,
│  │  │                   # fcm_adapter.py, debounce.py, templates/
│  │  ├─ api/             # routers: districts.py, subscribe.py, admin.py, replay.py
│  │  ├─ ingestion/       # scheduler.py (hourly job)
│  │  └─ seed/            # seed_districts.py, geojson/, historical/*.json
│  └─ tests/
└─ frontend/
   ├─ package.json
   ├─ app/
   │  ├─ page.tsx                  # map landing
   │  ├─ district/[id]/page.tsx    # or modal/drawer
   │  ├─ subscribe/page.tsx
   │  ├─ admin/page.tsx
   │  └─ replay/page.tsx
   ├─ components/
   ├─ lib/
   └─ public/geojson/
```

## 3. Curated District Seed Set (38 districts)

Architecture supports all 766 LGD-coded districts (rows exist, `is_seeded=false`, no geometry).
These 38 get real GeoJSON boundaries + seed vulnerability data + live weather polling:

| State | Districts |
|---|---|
| Kerala | Ernakulam, Thrissur, Alappuzha, Idukki, Kottayam, Wayanad |
| Assam | Cachar, Nagaon, Barpeta, Dhemaji, Morigaon, Lakhimpur |
| Tamil Nadu | Chennai, Kancheepuram, Cuddalore, Tiruvallur, Nagapattinam |
| Bihar | Darbhanga, Muzaffarpur, Purnia, Katihar, Saharsa |
| Odisha | Puri, Balasore, Kendrapara, Ganjam, Jagatsinghpur |
| West Bengal | Malda, Murshidabad, Howrah, North 24 Parganas, Cooch Behar |
| Uttar Pradesh | Gorakhpur, Ballia, Varanasi |
| Telangana | Hyderabad |
| Maharashtra | Kolhapur |
| Gujarat | Vadodara |

District centroids (lat, lng) should be sourced from any public lat/lng reference and hardcoded in
`seed_districts.py`. District boundary GeoJSON: use simplified polygons (even rough bounding-box
rectangles per district are acceptable for a viva demo) rather than spending build time hunting for
exact shapefiles — visually the map only needs to look correct, not survey-grade.

## 4. Database Schema

```sql
-- districts: schema supports all 766; only curated rows get geometry + seed indicators
CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  lgd_code VARCHAR(10) UNIQUE,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  geometry GEOMETRY(MultiPolygon, 4326),
  is_seeded BOOLEAN DEFAULT FALSE,
  population INT,
  open_defecation_pct REAL,
  elderly_child_pct REAL,
  hospital_density_per_100k REAL,
  river_danger_mark_m REAL,
  historical_flood_freq_per_decade INT,
  v_score INT,                      -- precomputed from the four fields above
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_districts_geom ON districts USING GIST (geometry);

CREATE TABLE weather_observations (
  id SERIAL PRIMARY KEY,
  district_id INT REFERENCES districts(id),
  observed_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(20) NOT NULL,       -- 'openweathermap' | 'imd_mock'
  rainfall_mm_24h REAL,
  humidity_pct REAL,
  temperature_c REAL,
  w_score INT,
  raw_payload JSONB
);

CREATE TABLE river_levels (
  id SERIAL PRIMARY KEY,
  district_id INT REFERENCES districts(id),
  observed_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(20) DEFAULT 'cwc_mock',
  level_m REAL,
  danger_mark_m REAL,
  exceedance_pct REAL,
  e_score INT
);

CREATE TABLE risk_scores (
  id SERIAL PRIMARY KEY,
  district_id INT REFERENCES districts(id),
  computed_at TIMESTAMPTZ NOT NULL,
  w_score INT, e_score INT, v_score INT, r_score INT,
  zone VARCHAR(10),                  -- 'low' | 'medium' | 'high'
  is_replay BOOLEAN DEFAULT FALSE,
  replay_event VARCHAR(30)           -- 'kerala_2018' | 'chennai_2015' | 'assam_2022' | NULL
);
CREATE INDEX idx_risk_district_time ON risk_scores (district_id, computed_at);

CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(20),
  preferred_language VARCHAR(5) DEFAULT 'en',
  threshold VARCHAR(10) DEFAULT 'medium',
  channels TEXT[],                   -- e.g. {'sms','email'}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriber_districts (
  subscriber_id INT REFERENCES subscribers(id),
  district_id INT REFERENCES districts(id),
  PRIMARY KEY (subscriber_id, district_id)
);

CREATE TABLE alerts_log (
  id SERIAL PRIMARY KEY,
  subscriber_id INT REFERENCES subscribers(id),
  district_id INT REFERENCES districts(id),
  risk_score_id INT REFERENCES risk_scores(id),
  channel VARCHAR(10),
  dispatch_mode VARCHAR(10),         -- 'real' | 'mock'
  status VARCHAR(20),                -- 'sent' | 'mock_logged' | 'failed'
  message_body TEXT,
  dispatched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin'
);

CREATE TABLE admin_reports (
  id SERIAL PRIMARY KEY,
  admin_user_id INT REFERENCES admin_users(id),
  district_id INT REFERENCES districts(id),
  disease VARCHAR(50),
  case_count INT,
  notes TEXT,
  reported_at TIMESTAMPTZ DEFAULT now()
);
```

## 5. Risk Engine

```python
def compute_w_score(rainfall_mm_24h: float) -> int:
    if rainfall_mm_24h > 204.5:   # IMD: Extremely Heavy
        return 3
    elif rainfall_mm_24h > 64.5:  # IMD: Heavy
        return 2
    return 1

def compute_e_score(level_m: float, danger_mark_m: float, flood_freq_per_decade: int) -> int:
    exceedance_pct = (level_m - danger_mark_m) / danger_mark_m
    if exceedance_pct > 0.10 or flood_freq_per_decade >= 7:
        return 3
    elif exceedance_pct > -0.05 or flood_freq_per_decade >= 3:
        return 2
    return 1

def compute_v_score(open_defecation_pct: float, elderly_child_pct: float,
                     hospital_density_per_100k: float) -> int:
    points = 0
    points += 1 if open_defecation_pct > 15 else 0
    points += 1 if elderly_child_pct > 30 else 0
    points += 1 if hospital_density_per_100k < 50 else 0
    if points >= 2:
        return 3
    elif points == 1:
        return 2
    return 1

def compute_risk(w: int, e: int, v: int) -> dict:
    r = w * e * v
    zone = "high" if r >= 15 else "medium" if r >= 7 else "low"
    return {"w": w, "e": e, "v": v, "r": r, "zone": zone}
```

**Required unit tests:** both W boundaries (64.5, 204.5 mm exactly and ±0.1), E boundary
conditions, V with 0/1/2/3 points triggered, R/zone boundaries at exactly 6→7 and 14→15, and a
missing/null-data fallback path for each function.

## 6. Data Adapters

- **`adapters/openweather.py`** — real. Calls OpenWeatherMap's free-tier current-weather +
  5-day/3-hour forecast endpoints per district centroid; aggregates rolling 24h rainfall, current
  humidity/temperature. Cache each district's response for the polling interval to respect the
  1,000 calls/day cap. Falls back to last-known-good value with a `stale=true` flag on failure.
- **`adapters/imd_mock.py`** — mock, clearly labeled. Optionally *derives* its rainfall
  classification from the real OpenWeatherMap rainfall figure (so it's not random noise — it's a
  deterministic re-classification using IMD's published bands), rather than being independently
  fabricated.
- **`adapters/cwc_mock.py`** — mock. Synthetic river-level generator: `level_m = baseline +
  f(recent_rainfall) + historical_flood_freq_factor + small_random_noise`, clamped to be
  internally consistent over time (no teleporting levels between consecutive hourly reads).
- **`adapters/census_seed.py`** — static seed values per curated district (`open_defecation_pct`,
  `elderly_child_pct`, `hospital_density_per_100k`) loaded once at seed time, not refreshed live.

## 7. API Surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | liveness check |
| GET | `/api/districts` | none | list districts (id, name, state, lat/lng, latest zone); `?seeded=true` filters to the 38 |
| GET | `/api/districts/geojson` | none | FeatureCollection of curated district boundaries |
| GET | `/api/districts/{id}` | none | full detail: current W/E/V/R, recommendations, last-updated |
| GET | `/api/districts/{id}/history?days=7` | none | time series for the trend chart |
| POST | `/api/subscribe` | none | `{email?, phone?, district_ids[], threshold, channels[], language}` |
| DELETE | `/api/subscribe/{id}` | token | unsubscribe |
| POST | `/api/admin/login` | none | returns JWT |
| POST | `/api/admin/reports` | JWT | log on-ground disease report |
| GET | `/api/admin/alerts-log` | JWT | audit log, paginated |
| GET | `/api/admin/subscribers` | JWT | subscriber list |
| GET | `/api/replay/events` | none | list of seeded historical events |
| GET | `/api/replay/{event}/timeline` | none | per-district risk score series for that event |
| GET | `/api/replay/{event}/validation` | none | **computed live**: % correctly flagged high-risk, avg lead time vs seeded outbreak markers |
| POST | `/api/internal/ingest/run-now` | JWT | manually trigger one ingestion+scoring cycle (dev/demo convenience) |

## 8. Alerting Subsystem

- Dispatch mode controlled by env var `ALERT_DISPATCH_MODE=mock|real` (default `mock`).
- After each hourly recompute: for every district whose zone just crossed a subscriber's
  threshold upward, check Redis key `alert:{subscriber_id}:{district_id}:{threshold}`
  (12h TTL). If absent: render message (Jinja2 template, subscriber's language), attempt
  dispatch via the relevant adapter (`mock` just logs to `alerts_log` with status
  `mock_logged` and prints the full message to stdout), set the TTL key.
- `real` mode only activates per-channel if the corresponding env keys
  (`TWILIO_*`, `SENDGRID_*`, `FCM_*`) are present; otherwise that channel silently falls back to
  mock even if `ALERT_DISPATCH_MODE=real`, so partial credential sets don't crash the dispatcher.

## 9. Historical Replay & Validation

Seed three synthetic-but-plausible hourly weather/river series (`seed/historical/kerala_2018.json`,
`chennai_2015.json`, `assam_2022.json`) covering the curated districts in each region, spanning the
flood window plus several days before/after. Each series also carries a small set of seeded
"documented outbreak" markers (district + date) used purely to compute the validation metric —
these should be inspired by the kind of timing described in real reporting on those floods, but
**do not present them as verified historical fact**; label them in code/comments as
illustrative/synthetic ground truth for validation purposes.

Replay pipeline: load series with historical timestamps → run through the real risk engine →
store as `risk_scores` rows with `is_replay=true` → `/api/replay/{event}/validation` computes,
from the actual stored rows, the % of outbreak-marked districts that were flagged High-risk
*before* their marker date, and the average lead time. Report exactly what comes out.

## 10. Local Dev Setup

```bash
# 1. infra
docker compose up -d            # postgres + redis

# 2. backend
cd backend
cp .env.example .env            # fill OPENWEATHER_API_KEY; leave alert keys blank for mock mode
pip install -r requirements.txt
alembic upgrade head
python -m app.seed.seed_districts
uvicorn app.main:app --reload

# 3. frontend
cd frontend
npm install
npm run dev
```

`.env.example` keys: `DATABASE_URL`, `REDIS_URL`, `OPENWEATHER_API_KEY`, `JWT_SECRET`,
`ALERT_DISPATCH_MODE`, `TWILIO_ACCOUNT_SID` (optional), `TWILIO_AUTH_TOKEN` (optional),
`SENDGRID_API_KEY` (optional), `FCM_SERVICE_ACCOUNT_JSON` (optional).

## 11. Non-Functional Notes

- Performance targets from the ELR report (sub-120ms district map, sub-40ms cached detail) are
  realistic at 38 districts and should genuinely be measured, not assumed — log actual response
  times in `PROGRESS.md`.
- Security: admin routes JWT-protected; rate-limit `/api/subscribe` to prevent spam signups.
- All timestamps stored UTC; convert in the frontend for display.
