import sys
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.ingestion.scheduler import run_ingestion_cycle
from app.db.models import WeatherObservation, RiverLevel, RiskScore, Subscriber, SubscriberDistrict

DATABASE_URL = "sqlite:///./bioshield.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("Adding test subscriber...")
sub = db.query(Subscriber).filter(Subscriber.email == "test@test.com").first()
if not sub:
    sub = Subscriber(email="test@test.com", threshold="low", channels=["email"])
    db.add(sub)
    db.commit()
    db.refresh(sub)
    # Add to district id 1
    sd = SubscriberDistrict(subscriber_id=sub.id, district_id=1)
    db.add(sd)
    db.commit()

print("Running ingestion cycle...")
run_ingestion_cycle(db)

obs = db.query(WeatherObservation).count()
riv = db.query(RiverLevel).count()
rsk = db.query(RiskScore).count()

print(f"Weather rows: {obs}")
print(f"River rows: {riv}")
print(f"Risk rows: {rsk}")

db.close()
