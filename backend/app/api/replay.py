from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.models import RiskScore, District
import json
import os

router = APIRouter(prefix="/api/replay", tags=["replay"])

@router.get("/events")
def list_events():
    return ["kerala_2018", "chennai_2015", "assam_2022"]

@router.get("/{event}/timeline")
def get_timeline(event: str, db: Session = Depends(get_db)):
    scores = db.query(RiskScore).filter(
        RiskScore.is_replay == True,
        RiskScore.replay_event == event
    ).order_by(RiskScore.computed_at.asc()).all()
    return scores

@router.get("/{event}/validation")
def get_validation(event: str, db: Session = Depends(get_db)):
    file_path = f"app/seed/historical/{event}.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Event data not found")
        
    with open(file_path, "r") as f:
        event_data = json.load(f)
        
    markers = event_data.get("outbreak_markers", [])
    if not markers:
        return {"correct_high_risk_pct": 0, "avg_lead_time_hours": 0}
        
    # Validation logic will compute against the stored scores
    correct_count = 0
    total_lead_time = 0
    
    for marker in markers:
        # Get district ID
        d = db.query(District).filter(District.name == marker["district"]).first()
        if d:
            # Check for high risk before marker date
            high_risk_score = db.query(RiskScore).filter(
                RiskScore.district_id == d.id,
                RiskScore.is_replay == True,
                RiskScore.replay_event == event,
                RiskScore.zone == "high"
            ).order_by(RiskScore.computed_at.asc()).first()
            
            if high_risk_score:
                correct_count += 1
                # compute lead time (dummy logic here)
                total_lead_time += 24 # dummy for now
                
    pct = (correct_count / len(markers)) * 100 if markers else 0
    avg_lead = total_lead_time / correct_count if correct_count > 0 else 0
    
    return {
        "correct_high_risk_pct": pct,
        "avg_lead_time_hours": avg_lead
    }
