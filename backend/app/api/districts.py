from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.api.deps import get_db
from app.db.models import District, RiskScore, WeatherObservation, RiverLevel

router = APIRouter(prefix="/api/districts", tags=["districts"])

@router.get("")
def list_districts(seeded: bool = False, db: Session = Depends(get_db)):
    query = db.query(District)
    if seeded:
        query = query.filter(District.is_seeded == True)
    districts = query.all()
    
    result = []
    for d in districts:
        latest_risk = db.query(RiskScore).filter(RiskScore.district_id == d.id).order_by(RiskScore.computed_at.desc()).first()
        result.append({
            "id": d.id,
            "lgd_code": d.lgd_code,
            "name": d.name,
            "state": d.state,
            "centroid_lat": d.centroid_lat,
            "centroid_lng": d.centroid_lng,
            "is_seeded": d.is_seeded,
            "latest_zone": latest_risk.zone if latest_risk else "low",
            "v_score": d.v_score
        })
    return result

@router.get("/geojson")
def get_geojson(db: Session = Depends(get_db)):
    districts = db.query(District).filter(District.is_seeded == True).all()
    features = []
    for d in districts:
        latest_risk = db.query(RiskScore).filter(RiskScore.district_id == d.id).order_by(RiskScore.computed_at.desc()).first()
        features.append({
            "type": "Feature",
            "properties": {
                "id": d.id,
                "name": d.name,
                "state": d.state,
                "zone": latest_risk.zone if latest_risk else "low"
            },
            "geometry": d.geometry
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/{id}")
def get_district(id: int, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
        
    latest_risk = db.query(RiskScore).filter(RiskScore.district_id == id).order_by(RiskScore.computed_at.desc()).first()
    latest_weather = db.query(WeatherObservation).filter(WeatherObservation.district_id == id).order_by(WeatherObservation.observed_at.desc()).first()
    latest_river = db.query(RiverLevel).filter(RiverLevel.district_id == id).order_by(RiverLevel.observed_at.desc()).first()
    
    return {
        "id": district.id,
        "name": district.name,
        "state": district.state,
        "population": district.population,
        "vulnerability": {
            "open_defecation_pct": district.open_defecation_pct,
            "elderly_child_pct": district.elderly_child_pct,
            "hospital_density_per_100k": district.hospital_density_per_100k
        },
        "current_risk": {
            "w_score": latest_risk.w_score if latest_risk else 1,
            "e_score": latest_risk.e_score if latest_risk else 1,
            "v_score": latest_risk.v_score if latest_risk else 1,
            "r_score": latest_risk.r_score if latest_risk else 1,
            "zone": latest_risk.zone if latest_risk else "low",
            "computed_at": latest_risk.computed_at if latest_risk else None
        },
        "weather": {
            "rainfall_mm_24h": latest_weather.rainfall_mm_24h if latest_weather else None,
            "humidity_pct": latest_weather.humidity_pct if latest_weather else None,
            "temperature_c": latest_weather.temperature_c if latest_weather else None,
            "observed_at": latest_weather.observed_at if latest_weather else None
        },
        "river": {
            "level_m": latest_river.level_m if latest_river else None,
            "danger_mark_m": latest_river.danger_mark_m if latest_river else None,
            "observed_at": latest_river.observed_at if latest_river else None
        }
    }

@router.get("/{id}/history")
def get_district_history(id: int, days: int = 7, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    scores = db.query(RiskScore).filter(
        RiskScore.district_id == id,
        RiskScore.computed_at >= cutoff
    ).order_by(RiskScore.computed_at.asc()).all()
    
    return [{"computed_at": s.computed_at, "r_score": s.r_score, "zone": s.zone} for s in scores]
