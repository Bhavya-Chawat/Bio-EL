import json
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import District, AdminUser
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = "sqlite:///./bioshield.db"

def seed_db():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Clean up existing telemetry
    from app.db.models import WeatherObservation, RiverLevel, RiskScore
    db.query(WeatherObservation).delete()
    db.query(RiverLevel).delete()
    db.query(RiskScore).delete()
    db.commit()

    # Seed Admin User
    admin = db.query(AdminUser).filter(AdminUser.username == "admin").first()
    if not admin:
        hashed_password = pwd_context.hash("admin")
        new_admin = AdminUser(username="admin", password_hash=hashed_password, role="admin")
        db.add(new_admin)
        print("Admin user seeded.")

    # Load mock districts
    with open("app/seed/data/curated_districts.json", "r") as f:
        curated_districts = json.load(f)

    curated_lgd_codes = set()
    for d_data in curated_districts:
        lgd_code = d_data["lgd_code"]
        curated_lgd_codes.add(lgd_code)

        # Precompute v_score
        open_defecation_pct = d_data["open_defecation_pct"]
        elderly_child_pct = d_data["elderly_child_pct"]
        hospital_density = d_data["hospital_density_per_100k"]

        points = 0
        if open_defecation_pct > 15: points += 1
        if elderly_child_pct > 30: points += 1
        if hospital_density < 50: points += 1

        v_score = 3 if points >= 2 else (2 if points == 1 else 1)

        # Dummy GeoJSON square around centroid
        lat = d_data["centroid_lat"]
        lng = d_data["centroid_lng"]
        delta = 0.1
        geojson = {
            "type": "MultiPolygon",
            "coordinates": [[[[lng - delta, lat - delta], [lng + delta, lat - delta], [lng + delta, lat + delta], [lng - delta, lat + delta], [lng - delta, lat - delta]]]]
        }

        district = db.query(District).filter(District.lgd_code == lgd_code).first()
        if not district:
            district = District(
                lgd_code=lgd_code,
                name=d_data["name"],
                state=d_data["state"],
                centroid_lat=lat,
                centroid_lng=lng,
                geometry=geojson,
                is_seeded=True,
                population=d_data["population"],
                open_defecation_pct=open_defecation_pct,
                elderly_child_pct=elderly_child_pct,
                hospital_density_per_100k=hospital_density,
                river_danger_mark_m=d_data["river_danger_mark_m"],
                historical_flood_freq_per_decade=d_data["historical_flood_freq_per_decade"],
                v_score=v_score
            )
            db.add(district)
        else:
            district.geometry = geojson
            district.v_score = v_score
            district.centroid_lat = lat
            district.centroid_lng = lng

    # Seed 728 dummy districts (to reach 766 total)
    dummy_count = 766 - len(curated_districts)
    dummy_start_idx = 1000
    
    for i in range(dummy_count):
        lgd_code = f"{dummy_start_idx + i}"
        if lgd_code not in curated_lgd_codes:
            district = db.query(District).filter(District.lgd_code == lgd_code).first()
            if not district:
                district = District(
                    lgd_code=lgd_code,
                    name=f"Dummy District {i}",
                    state="Dummy State",
                    is_seeded=False
                )
                db.add(district)

    # Seed 7 days of historical observations for active districts
    from datetime import datetime, timedelta, timezone
    from app.db.models import WeatherObservation, RiverLevel, RiskScore
    import random
    
    active_districts = db.query(District).filter(District.is_seeded == True).all()
    if db.query(RiskScore).count() < 100:
        print("Seeding 7 days of historical telemetry...")
        now = datetime.now(timezone.utc)
        for d in active_districts:
            for day_offset in range(7, 0, -1):
                timestamp = now - timedelta(days=day_offset)
                
                rain = random.choice([0.0, 0.0, 0.0, 2.5, 8.4, 0.0, 15.2])
                w_score = 1
                if rain > 200:
                    w_score = 3
                elif rain > 64.5:
                    w_score = 2
                    
                danger = d.river_danger_mark_m or 15.0
                level = danger * random.uniform(0.70, 0.95)
                e_score = 1
                if d.historical_flood_freq_per_decade >= 7:
                    e_score = 3
                elif d.historical_flood_freq_per_decade >= 3:
                    e_score = 2
                    
                r_score = w_score * e_score * (d.v_score or 1)
                zone = "high" if r_score >= 15 else "medium" if r_score >= 7 else "low"
                
                weather = WeatherObservation(
                    district_id=d.id,
                    observed_at=timestamp,
                    source="seed_historical",
                    rainfall_mm_24h=rain,
                    humidity_pct=random.uniform(60.0, 90.0),
                    temperature_c=random.uniform(24.0, 31.0),
                    w_score=w_score
                )
                db.add(weather)
                
                river = RiverLevel(
                    district_id=d.id,
                    observed_at=timestamp,
                    source="seed_historical",
                    level_m=level,
                    danger_mark_m=danger,
                    exceedance_pct=(level - danger) / danger,
                    e_score=e_score
                )
                db.add(river)
                
                risk = RiskScore(
                    district_id=d.id,
                    computed_at=timestamp,
                    w_score=w_score,
                    e_score=e_score,
                    v_score=d.v_score or 1,
                    r_score=r_score,
                    zone=zone,
                    is_replay=False
                )
                db.add(risk)

    db.commit()
    db.close()
    print("Districts and history seeded.")

if __name__ == "__main__":
    seed_db()
