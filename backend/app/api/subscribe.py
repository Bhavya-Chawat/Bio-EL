from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.api.deps import get_db, get_current_admin
from app.db.models import Subscriber, SubscriberDistrict

router = APIRouter(prefix="/api/subscribe", tags=["subscribe"])

class SubscribeRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    district_ids: List[int]
    threshold: str = "medium"
    channels: List[str]
    language: str = "en"

# Simple in-memory rate limiting dict
RATE_LIMIT_STORE = {}

@router.post("")
def subscribe(req: SubscribeRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    # Simple rate limiting logic (for demo, max 5 per IP)
    RATE_LIMIT_STORE[client_ip] = RATE_LIMIT_STORE.get(client_ip, 0) + 1
    if RATE_LIMIT_STORE[client_ip] > 10:
        raise HTTPException(status_code=429, detail="Too many requests")
        
    if not req.email and not req.phone:
        raise HTTPException(status_code=400, detail="Must provide email or phone")
        
    phone = req.phone
    if phone:
        phone = phone.strip()
        if not phone.startswith("+"):
            if len(phone) == 10 and phone.isdigit():
                phone = f"+91{phone}"
            elif phone.startswith("91") and len(phone) == 12:
                phone = f"+{phone}"

    sub = Subscriber(
        email=req.email,
        phone=phone,
        preferred_language=req.language,
        threshold=req.threshold,
        channels=req.channels
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    
    for d_id in req.district_ids:
        sd = SubscriberDistrict(subscriber_id=sub.id, district_id=d_id)
        db.add(sd)
    db.commit()
    
    return {"status": "subscribed", "id": sub.id}

@router.delete("/{id}")
def unsubscribe(id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    sub = db.query(Subscriber).filter(Subscriber.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    
    db.query(SubscriberDistrict).filter(SubscriberDistrict.subscriber_id == id).delete()
    db.delete(sub)
    db.commit()
    return {"status": "unsubscribed"}
