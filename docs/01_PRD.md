# BioShield Flood Dashboard — Product Requirements Document (PRD)

**Course:** Biosafety Standards and Ethics — Experiential Learning
**Project:** BioShield Flood Dashboard
**Doc version:** 1.0 (build scope, not the academic report)

---

## 1. Problem & Why It Matters

India has no real-time, public, district-level platform that turns live weather/flood data into a
quantitative biological risk score and a timely biosafety alert. The 48–72 hour pre-flood window
is wasted: chlorine tablets, ORS, and vector-control teams aren't pre-positioned, and citizens
aren't warned until people are already sick with cholera, typhoid, hepatitis, or leptospirosis.

BioShield closes this gap by operationalizing a 3-factor risk model:

```
R = W × E × V        (W, E, V each scored 1–3 → R ranges 1–27)
```

- **W — Weather Severity** (rainfall/humidity/temperature, IMD-style thresholds)
- **E — Exposure** (river-level proximity to danger mark + historical flood frequency)
- **V — Vulnerability** (sanitation, age distribution, population density)

## 2. What This Build Actually Is (read this before anything else)

Your ELR report describes the *full vision* — all 766 districts, live IMD/CWC feeds, real SMS/
email/push, public cloud deployment. That is the right vision **to write about**, but not realistic
to *fully* wire up for a working student prototype in a few weeks. So this PRD defines the
**buildable subset** that still proves every concept in the report, end to end, with nothing faked
in a way that misrepresents what's real:

| Report claim | This build |
|---|---|
| All 766 Indian districts | **DB schema and API support all 766** (rows exist as placeholders). **~38 curated flood-prone districts** get real GeoJSON boundaries + realistic seed vulnerability data + live weather. |
| IMD + CWC live feeds | IMD has no public API; CWC's is not freely consumable for a student project. Both are **clearly-labeled mock adapters** producing plausible, internally-consistent data, calibrated against IMD's own published rainfall classification bands. |
| OpenWeatherMap live | **Real**, using the free tier (1,000 calls/day — comfortably covers 38 districts hourly). |
| Census 2011 vulnerability indicators | **Seeded** per curated district using realistic, publicly-known approximations (sanitation/density reputation of each district), clearly marked as seed data, not a live Census API pull (no such API exists). |
| SMS / Email / Push alerts | Dispatcher is **fully built and triggers correctly** on threshold crossings, but **defaults to "mock send"** (logs the exact message + recipient + channel into an audit table) unless real Twilio/SendGrid/Firebase keys are supplied in `.env`. Flip a switch, it's real. |
| Cloud deployment (Vercel/Railway) | **Out of scope for this build.** Runs locally via Docker Compose + `npm run dev` / `uvicorn`. Deployment is a documented stretch step, not required for the viva demo. |
| Historical validation (Kerala 2018, Chennai 2015, Assam 2022) | A **real replay harness** runs synthetic-but-realistic historical weather series through the actual risk engine and reports **whatever numbers the code actually produces**. These numbers should *not* be hand-tuned to match the figures already written in the ELR report — if they differ, that's fine and expected; update the report's results section with the real measured numbers before final submission. Presenting invented numbers as empirical findings would be an integrity problem, not just a build quality one. |

This keeps the demo honest, working, and still impressive in a viva: a working map, a working risk
engine driven by real weather data, a working (mock-mode) alert pipeline, and a working historical
replay — all backed by a schema that visibly scales to the full national vision.

## 3. Goals

**G1.** Live, interactive district risk map for the curated flood-prone districts, real OpenWeatherMap
data driving the W score hourly.
**G2.** Fully implemented R = W × E × V engine, unit-tested at the boundary thresholds.
**G3.** District drill-down: W/E/V breakdown, recommended biosafety actions, 7-day risk trend.
**G4.** Subscription + multi-channel alert pipeline with 12-hour debounce, mock-send by default.
**G5.** Admin panel: JWT-auth login, on-ground disease report logging, alert audit log view.
**G6.** Historical replay: Kerala 2018 / Chennai 2015 / Assam 2022 synthetic series, real computed
validation metrics (not pre-written ones).
**G7.** Everything runs from a clean checkout with `docker compose up` + two commands — no
cloud account required to demo.

## 4. Non-Goals (explicitly out of scope)

- Real IMD/CWC API integration (no usable public API exists for either today).
- Sending real SMS/email/push by default (architecture supports it; off by default).
- Covering all 766 districts with real seed data.
- Public cloud deployment.
- ML-based risk prediction (explicitly Phase II in the report — stays Phase II here too).
- Pixel-perfect Hindi/Tamil translation — i18n scaffolding only, English is the complete language.

## 5. Personas

| Persona | Need |
|---|---|
| **Citizen** in a flood-prone district | "Is my district at risk right now? Should I worry?" |
| **District health officer** | "I want SMS/email alerts the moment my district crosses Medium risk." |
| **NGO / disaster-response volunteer** | "Show me which districts need chlorine tablets and ORS pre-positioned in the next 48h." |
| **Admin / verified official** | "Let me log what's actually happening on the ground to calibrate future predictions." |
| **Evaluator (course instructor)** | "Is this a real working system or slideware? Show me the risk engine actually computing scores from live data." |

## 6. Functional Requirements

### 6.1 Public Dashboard
- FR1: Map of India (Leaflet.js) showing all districts; curated districts colour-coded by current
  risk zone (Low/Medium/High), all others shown as a neutral "not yet monitored" grey.
- FR2: Clicking a curated district opens a detail panel: current W/E/V breakdown, composite R,
  zone, last-updated timestamp, recommended biosafety actions for that zone.
- FR3: 7-day historical trend chart (Recharts) for the selected district.
- FR4: Auto-refresh risk data every 15 minutes (polling is fine; no websocket requirement).

### 6.2 Alerts
- FR5: Subscription form — email and/or phone, choose 1+ districts, choose threshold
  (Medium or High), choose channels.
- FR6: On every hourly recomputation, any subscriber whose threshold is crossed gets a
  dispatch attempt; debounced 12h per (subscriber, district, threshold).
- FR7: Every dispatch (real or mock) is written to an audit log with full message content.

### 6.3 Admin
- FR8: JWT-based admin login.
- FR9: Admin can submit an on-ground disease report (disease, district, case count, notes).
- FR10: Admin can view the alert audit log and subscriber list.

### 6.4 Historical Replay
- FR11: Pick one of the 3 seeded historical events; an animated time-slider replays district
  risk evolution over the event window.
- FR12: A validation report endpoint/page shows actual computed precision metrics (correct
  high-risk classification %, average lead time) for that replay — computed live, not hardcoded.

## 7. Success Criteria (for the viva / submission)

- Risk engine has passing unit tests covering both threshold boundaries (64.5mm, 204.5mm) and
  edge cases (zero rainfall, missing data, max exceedance).
- At least one full hourly ingestion cycle can be triggered and observed end-to-end: weather in →
  W/E/V/R computed → map updates → a subscribed test account gets a mock alert logged.
- Historical replay produces a real, reproducible report (whatever the numbers are).
- A fresh clone + `docker compose up` + documented commands gets a reviewer to a working app
  in under 10 minutes with zero paid accounts required.

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OpenWeatherMap free-tier rate limits (1,000/day) | 38 districts × hourly = 912/day — fits, but add a scheduler guard and cached fallback. |
| Synthetic CWC/IMD data looks arbitrary to an evaluator | Document the generation logic clearly (seeded, deterministic-with-noise, tied to real rainfall) in the TRD/README so it reads as a designed mock, not a hack. |
| Historical replay numbers don't match the ELR report's table | Expected and fine — update the report before final submission. Treat the report's existing numbers as the original *projection*, this build's numbers as the *measured result*. |
| Scope creep into full Twilio/SendGrid setup mid-build | Keep mock-mode as the default and the only required path for grading; real send is a documented optional flip. |
