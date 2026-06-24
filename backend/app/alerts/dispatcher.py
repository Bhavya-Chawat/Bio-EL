from sqlalchemy.orm import Session
from app.db.models import AlertsLog, Subscriber, SubscriberDistrict, District, RiskScore
from app.alerts.debounce import is_debounced, set_debounce
from app.core.config import settings
import os
from twilio.rest import Client
import logging

logger = logging.getLogger(__name__)

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', errors='replace').decode('ascii'))

def render_message(district_name: str, zone: str, language: str = "en") -> str:
    if language == "hi":
        return f"सतर्क: {district_name} जिले में जैविक खतरा '{zone}' स्तर को पार कर गया है। कृपया सुरक्षित रहें।"
    
    if zone == "high":
        return f"BioShield Alert: {district_name} is currently under High Risk. Please check the dashboard for details and follow safety guidelines."
    elif zone == "medium":
        return f"BioShield Alert: {district_name} is currently under Medium Risk. Please monitor the situation and take necessary precautions."
    else:
        return f"BioShield Alert: Risk level for {district_name} has normalized to low baseline."

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
            message = render_message(district.name, risk_score.zone, sub.preferred_language)
            dispatch_mode = settings.ALERT_DISPATCH_MODE
            
            for channel in sub.channels:
                if is_debounced(db, sub.id, district.id, channel, risk_score.zone):
                    continue
                    
                channel_status = "sent"
                
                if channel == "sms":
                    # Strictly only send the SMS if it is a high risk area
                    if risk_score.zone != "high":
                        continue
                        
                    if sub.phone:
                        success = send_twilio_sms(sub.phone, message)
                        if success:
                            safe_print(f"[SMS SENT] to {sub.phone}: {message}")
                        else:
                            channel_status = "mock_logged"
                            safe_print(f"[MOCK SMS] to {sub.phone}: {message}")
                    else:
                        continue
                else:
                    # Mock dispatch for other channels
                    channel_status = "mock_logged"
                    safe_print(f"[MOCK EMAIL/SYSTEM] to {sub.email or sub.phone}: {message}")
                    
                log_entry = AlertsLog(
                    subscriber_id=sub.id,
                    district_id=district.id,
                    risk_score_id=risk_score.id,
                    channel=channel,
                    dispatch_mode=dispatch_mode,
                    status=channel_status,
                    message_body=message
                )
                db.add(log_entry)
                set_debounce(sub.id, district.id, channel, risk_score.zone)
                
    db.commit()
