# BioShield Flood Dashboard — App Flow

Companion to `01_PRD.md` and `02_TRD.md`. Describes screens, navigation, and the three user
journeys the build must support end-to-end.

---

## 1. Screen Inventory

| # | Screen | Route | Auth |
|---|---|---|---|
| 1 | Landing / India risk map | `/` | none |
| 2 | District detail (panel or `/district/[id]`) | `/district/[id]` | none |
| 3 | Alert subscription form | `/subscribe` | none |
| 4 | Admin login | `/admin/login` | none |
| 5 | Admin dashboard (reports + audit log + subscribers) | `/admin` | JWT |
| 6 | Historical replay (event picker + time-slider) | `/replay` | none |

## 2. Journey A — Citizen checks their district

```
Land on "/" → see colour-coded India map (curated districts only are clickable/coloured;
rest shown neutral grey, e.g. "monitoring coming soon")
   → click a coloured district
      → side panel slides in: current zone badge (Low/Med/High), W/E/V breakdown with
        plain-language labels ("Heavy rainfall expected", "River 12% above danger mark",
        "High vulnerability: dense population, low hospital density"), recommended
        biosafety actions for that zone (e.g. High → "boil water, avoid wading in
        floodwater, chlorinate wells"), 7-day trend chart
   → optional: "Get alerts for this district" button → /subscribe pre-filled with this district
```

## 3. Journey B — Citizen / health officer subscribes for alerts

```
"/subscribe" (or reached via Journey A)
   → form: email and/or phone, multi-select districts, threshold (Medium / High),
     channels (SMS / Email / Push), preferred language
   → submit → POST /api/subscribe
   → confirmation screen: "You'll be alerted if {districts} cross {threshold} risk."
   → (later, async) when a threshold crossing happens for that subscriber:
       - mock mode (default): nothing visibly happens to the user, but the exact alert
         message is written to alerts_log — visible to admin in /admin
       - real mode: subscriber actually receives the SMS/email/push
```

## 4. Journey C — Admin logs ground-truth and reviews alerts

```
"/admin/login" → username/password → POST /api/admin/login → JWT stored client-side
   → "/admin" dashboard:
       Tab 1: Submit on-ground report (district, disease, case count, notes)
              → POST /api/admin/reports
       Tab 2: Alert audit log (filterable by district/channel/status)
              → GET /api/admin/alerts-log
       Tab 3: Subscriber list (read-only, for sanity-checking subscription volume)
              → GET /api/admin/subscribers
```

## 5. Journey D — Anyone explores historical replay

```
"/replay" → pick one of: Kerala 2018 / Chennai 2015 / Assam 2022
   → time-slider appears under the map, spanning the seeded event window
   → dragging the slider re-colours districts per their risk_scores row at that timestamp
     (is_replay=true, replay_event=<event>)
   → a small panel shows the live-computed validation summary for that event:
     % of seeded-outbreak districts correctly flagged High before their marker date,
     and average lead time — pulled from GET /api/replay/{event}/validation, not
     hardcoded
```

## 6. Navigation Map

```
┌──────────┐      click district      ┌────────────────┐
│   "/"    │ ───────────────────────▶ │ district panel │
│  (map)   │ ◀─────────────────────── │  /district/[id]│
└────┬─────┘         close             └───────┬────────┘
     │                                          │ "Get alerts"
     │ nav                                      ▼
     │                                  ┌────────────────┐
     │                                  │   /subscribe   │
     │                                  └────────────────┘
     │
     ├──────────────▶ /replay (event picker + slider)
     │
     └──────────────▶ /admin/login ──▶ /admin (3 tabs)
```

## 7. Empty / Error States to Handle

- District clicked but no recent weather data (API failure) → show "stale" badge with
  last-known values and timestamp, not a blank panel.
- Subscribe form submitted with neither email nor phone → inline validation error.
- Admin login failure → inline error, no redirect.
- Replay event with no data loaded yet → disable slider, show "seed data not loaded" notice
  (should not happen if seeding ran, but the UI should degrade gracefully rather than crash).
