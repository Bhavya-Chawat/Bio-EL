from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.models import AlertsLog, District

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/recent")
def get_recent_alerts(limit: int = 50, db: Session = Depends(get_db)):
    # Join with District to get the name
    logs = db.query(AlertsLog, District).join(District, AlertsLog.district_id == District.id)\
             .order_by(AlertsLog.dispatched_at.desc()).limit(limit).all()
    
    results = []
    for log, district in logs:
        results.append({
            "id": log.id,
            "district_name": district.name,
            "state": district.state,
            "channel": log.channel,
            "status": log.status,
            "dispatched_at": log.dispatched_at,
            "message": log.message_body
        })
    return results
