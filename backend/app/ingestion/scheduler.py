import datetime
from sqlalchemy.orm import Session
from app.db.models import District, WeatherObservation, RiverLevel, RiskScore
from app.adapters.openweather import get_weather
from app.adapters.cwc_mock import get_cwc_river_level
from app.risk_engine import compute_w_score, compute_e_score, compute_v_score, compute_risk

def run_ingestion_cycle(db: Session, is_replay: bool = False, replay_event: str = None, replay_data: dict = None):
    districts = db.query(District).filter(District.is_seeded == True).all()
    
    computed_at = datetime.datetime.now(datetime.timezone.utc)
    
    for district in districts:
        if is_replay and replay_data:
            # Handle replay logic here if needed
            pass
        else:
            weather = get_weather(district.centroid_lat, district.centroid_lng)
            
            w_score = compute_w_score(weather["rainfall_mm_24h"])
            
            weather_obs = WeatherObservation(
                district_id=district.id,
                observed_at=computed_at,
                source="openweathermap",
                rainfall_mm_24h=weather["rainfall_mm_24h"],
                humidity_pct=weather["humidity_pct"],
                temperature_c=weather["temperature_c"],
                w_score=w_score,
                raw_payload=weather.get("raw_payload")
            )
            db.add(weather_obs)
            
            # Get previous river level for continuous generation
            prev_river = db.query(RiverLevel).filter(
                RiverLevel.district_id == district.id
            ).order_by(RiverLevel.observed_at.desc()).first()
            prev_level = prev_river.level_m if prev_river else None
            
            cwc_level = get_cwc_river_level(
                district.id, 
                weather["rainfall_mm_24h"], 
                district.river_danger_mark_m, 
                district.historical_flood_freq_per_decade,
                prev_level
            )
            
            e_score = compute_e_score(
                cwc_level, 
                district.river_danger_mark_m, 
                district.historical_flood_freq_per_decade
            )
            
            river_obs = RiverLevel(
                district_id=district.id,
                observed_at=computed_at,
                source="cwc_mock",
                level_m=cwc_level,
                danger_mark_m=district.river_danger_mark_m,
                exceedance_pct=(cwc_level - district.river_danger_mark_m) / district.river_danger_mark_m,
                e_score=e_score
            )
            db.add(river_obs)
            
            risk = compute_risk(w_score, e_score, district.v_score)
            
            risk_score = RiskScore(
                district_id=district.id,
                computed_at=computed_at,
                w_score=w_score,
                e_score=e_score,
                v_score=district.v_score,
                r_score=risk["r"],
                zone=risk["zone"],
                is_replay=False
            )
            db.add(risk_score)
            
            # Flush to get risk_score.id then dispatch alerts
            db.flush()
            from app.alerts.dispatcher import dispatch_alerts
            dispatch_alerts(db, risk_score, district)
            
    db.commit()
    print(f"Ingestion cycle complete for {len(districts)} districts.")
