from fastapi import APIRouter
from .districts import router as districts_router
from .subscribe import router as subscribe_router
from .admin import router as admin_router
from .replay import router as replay_router
from app.api.deps import get_db, get_current_admin
from sqlalchemy.orm import Session
from fastapi import Depends
from app.ingestion.scheduler import run_ingestion_cycle

api_router = APIRouter()
api_router.include_router(districts_router)
api_router.include_router(subscribe_router)
api_router.include_router(admin_router)
api_router.include_router(replay_router)

@api_router.post("/api/internal/ingest/run-now")
def run_now(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    run_ingestion_cycle(db)
    return {"status": "ok"}
