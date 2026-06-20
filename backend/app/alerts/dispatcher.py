from sqlalchemy.orm import Session
from app.db.models import AlertsLog, Subscriber, SubscriberDistrict, District, RiskScore
from app.alerts.debounce import is_debounced, set_debounce
from app.core.config import settings
import os
from twilio.rest import Client
import logging

logger = logging.getLogger(__name__)

def render_message(district_name: str, zone: str, language: str = "en") -> str:
    if language == "hi":
        return f"सतर्क: {district_name} जिले में जैविक खतरा '{zone}' स्तर को पार कर गया है। कृपया सुरक्षित रहें।"
    
    if zone == "high":
        return f"🚨 BIOSHAZARD CRITICAL [{district_name}]: Cat-4 Waterborne Pathogen Risk (V. cholerae / Typhoid). Initiate BSL-2 precautions (N95, gloves) for all relief personnel. Doxycycline prophylaxis mandated. Secure clean water supplies."
    elif zone == "medium":
        return f"⚠️ BIOSAFETY ELEVATED [{district_name}]: Zoonotic disease risk (Leptospirosis) due to stagnant water. Implement standard PPE and mosquito nets for field workers. Monitor for fever clusters."
    else:
        return f"✅ BIOSAFETY BASELINE [{district_name}]: Risk normalized. Continue routine vector-borne monitoring (Dengue, Malaria). No enhanced PPE required at this time."

def send_twilio_sms(to_phone: str, message: str):
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_phone = os.environ.get("TWILIO_FROM_NUMBER")
    
    if not account_sid or not auth_token or not from_phone:
        logger.warning("Twilio credentials missing. Falling back to mock dispatch.")
        return False
        
    try:
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=message,
            from_=from_phone,
            to=to_phone
        )
        return True
    except Exception as e:
        logger.error(f"Twilio SMS failed: {e}")
        return False

def dispatch_alerts(db: Session, risk_score: RiskScore, district: District):
    threshold_values = {"low": 1, "medium": 2, "high": 3}
    current_val = threshold_values.get(risk_score.zone, 1)
    
    if current_val < 2:
        return # No alerts for low
        
    subs_districts = db.query(SubscriberDistrict).filter(SubscriberDistrict.district_id == district.id).all()
    
    for sd in subs_districts:
        sub = db.query(Subscriber).filter(Subscriber.id == sd.subscriber_id).first()
        if not sub:
            continue
            
        sub_val = threshold_values.get(sub.threshold, 2)
        
        if current_val >= sub_val:
            if not is_debounced(sub.id, district.id, sub.threshold):
                message = render_message(district.name, risk_score.zone, sub.preferred_language)
                
                dispatch_mode = settings.ALERT_DISPATCH_MODE
                status = "sent"
                
                # Real SMS Dispatch if phone exists and mode isn't explicitly mock
                if "sms" in sub.channels and sub.phone:
                    success = send_twilio_sms(sub.phone, message)
                    if not success:
                        status = "mock_logged"
                        print(f"[MOCK SMS] to {sub.phone}: {message}")
                elif dispatch_mode == "mock":
                    status = "mock_logged"
                    print(f"[MOCK EMAIL/SYSTEM] to {sub.email or sub.phone}: {message}")

                for channel in sub.channels:
                    log_entry = AlertsLog(
                        subscriber_id=sub.id,
                        district_id=district.id,
                        risk_score_id=risk_score.id,
                        channel=channel,
                        dispatch_mode=dispatch_mode,
                        status=status,
                        message_body=message
                    )
                    db.add(log_entry)
                
                set_debounce(sub.id, district.id, sub.threshold)
                
    db.commit()
