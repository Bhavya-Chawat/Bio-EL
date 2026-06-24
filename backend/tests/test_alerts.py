from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, District, Subscriber, SubscriberDistrict, RiskScore, AlertsLog
from app.alerts.dispatcher import dispatch_alerts
from app.alerts.debounce import is_debounced, _debounce_store
from datetime import datetime, timezone

def test_alerts_dispatch():
    # Setup in-memory sqlite db
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    # Reset in-memory debounce store before test
    _debounce_store.clear()
    
    try:
        # Create test district
        district = District(
            id=1,
            lgd_code="123",
            name="Test District",
            state="Test State",
            v_score=2,
            river_danger_mark_m=10.0,
            historical_flood_freq_per_decade=5
        )
        db.add(district)
        
        # Create subscriber subscribed to both sms and email
        sub = Subscriber(
            id=1,
            email="test@example.com",
            phone="+919876543210",
            preferred_language="en",
            threshold="medium",
            channels=["sms", "email"]
        )
        db.add(sub)
        db.flush()
        
        # Link subscriber to district
        sd = SubscriberDistrict(subscriber_id=sub.id, district_id=district.id)
        db.add(sd)
        db.commit()
        
        # Scenario 1: Medium risk score -> SMS should not be sent/logged, only email
        risk_score_medium = RiskScore(
            id=1,
            district_id=district.id,
            computed_at=datetime.now(timezone.utc),
            zone="medium",
            r_score=8
        )
        dispatch_alerts(db, risk_score_medium, district)
        
        # Check logs - only email should be logged, not SMS
        logs = db.query(AlertsLog).filter(AlertsLog.subscriber_id == sub.id).all()
        assert len(logs) == 1
        assert logs[0].channel == "email"
        
        # Email channel should be debounced for medium risk
        assert is_debounced(db, sub.id, district.id, "email", "medium") is True
        
        # SMS channel should NOT be debounced for medium risk (as it was never dispatched)
        assert is_debounced(db, sub.id, district.id, "sms", "medium") is False
        
        # Escalation check: if the risk level is high, email channel should NOT be debounced (escalation bypass)
        assert is_debounced(db, sub.id, district.id, "email", "high") is False
        
        # Clear in-memory debounce store to force database-backed lookup
        _debounce_store.clear()
        
        # Verify the database-backed lookup also identifies the email debounce for medium risk
        assert is_debounced(db, sub.id, district.id, "email", "medium") is True
        
        # Delete the previous alert logs to clear persistent debounce
        db.query(AlertsLog).delete()
        db.commit()
        _debounce_store.clear()
        
        # Scenario 2: High risk score -> Both SMS and Email should be sent/logged
        risk_score_high = RiskScore(
            id=2,
            district_id=district.id,
            computed_at=datetime.now(timezone.utc),
            zone="high",
            r_score=18
        )
        dispatch_alerts(db, risk_score_high, district)
        
        logs = db.query(AlertsLog).filter(AlertsLog.subscriber_id == sub.id).all()
        assert len(logs) == 2
        channels = [l.channel for l in logs]
        assert "sms" in channels
        assert "email" in channels
        
    finally:
        db.close()
