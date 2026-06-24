from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.models import AlertsLog, RiskScore
from app.core.config import settings

# Simple in-memory debounce store since Redis is not required.
# Keys are strings like "alert:{subscriber_id}:{district_id}:{channel}:{zone}"
# Values are datetime objects representing when the debounce expires.
_debounce_store = {}

def is_debounced(db: Session, subscriber_id: int, district_id: int, channel: str, current_zone: str, hours: int = None) -> bool:
    if hours is None:
        hours = settings.ALERT_DEBOUNCE_HOURS
        
    if hours <= 0:
        return False
        
    key = f"alert:{subscriber_id}:{district_id}:{channel}:{current_zone}"
    
    # 1. Check in-memory store first
    expiry = _debounce_store.get(key)
    if expiry and expiry > datetime.now(timezone.utc):
        return True
        
    # 2. Check AlertsLog in database for persistent debouncing across restarts
    recent_log = db.query(AlertsLog).filter(
        AlertsLog.subscriber_id == subscriber_id,
        AlertsLog.district_id == district_id,
        AlertsLog.channel == channel
    ).order_by(AlertsLog.dispatched_at.desc()).first()
    
    if recent_log:
        # Check for risk escalation (e.g., from medium/low to high)
        prev_zone = "low"
        if recent_log.risk_score_id:
            risk_score = db.query(RiskScore).filter(RiskScore.id == recent_log.risk_score_id).first()
            if risk_score:
                prev_zone = risk_score.zone
                
        # If the risk has escalated to high, bypass the temporal debounce
        if current_zone == "high" and prev_zone in ("medium", "low"):
            return False
            
        dispatched_at = recent_log.dispatched_at
        if dispatched_at.tzinfo is not None:
            now = datetime.now(timezone.utc)
        else:
            now = datetime.utcnow()
            
        time_passed = now - dispatched_at
        if time_passed < timedelta(hours=hours):
            # Populate in-memory store so subsequent checks don't query the DB
            remaining_seconds = (timedelta(hours=hours) - time_passed).total_seconds()
            if remaining_seconds > 0:
                _debounce_store[key] = datetime.now(timezone.utc) + timedelta(seconds=remaining_seconds)
            return True
            
    return False

def set_debounce(subscriber_id: int, district_id: int, channel: str, current_zone: str, hours: int = None):
    if hours is None:
        hours = settings.ALERT_DEBOUNCE_HOURS
    if hours <= 0:
        return
    key = f"alert:{subscriber_id}:{district_id}:{channel}:{current_zone}"
    _debounce_store[key] = datetime.now(timezone.utc) + timedelta(hours=hours)
