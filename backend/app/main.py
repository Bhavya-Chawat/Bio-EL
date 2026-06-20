from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BioShield Flood Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import districts, subscribe, admin, replay, alerts

app.include_router(districts.router)
app.include_router(subscribe.router)
app.include_router(admin.router)
app.include_router(replay.router)
app.include_router(alerts.router)
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
