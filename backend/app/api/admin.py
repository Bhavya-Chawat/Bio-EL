from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_admin
from app.core.security import verify_password, create_access_token
from app.db.models import AdminUser, AdminReport, AlertsLog, Subscriber
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

class ReportCreate(BaseModel):
    district_id: int
    disease: str
    case_count: int
    notes: str

@router.post("/reports")
def create_report(req: ReportCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    admin = db.query(AdminUser).filter(AdminUser.username == current_admin).first()
    report = AdminReport(
        admin_user_id=admin.id,
        district_id=req.district_id,
        disease=req.disease,
        case_count=req.case_count,
        notes=req.notes
    )
    db.add(report)
    db.commit()
    return {"status": "created", "id": report.id}

@router.get("/alerts-log")
def get_alerts_log(limit: int = 100, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    logs = db.query(AlertsLog).order_by(AlertsLog.dispatched_at.desc()).limit(limit).all()
    return logs

@router.get("/subscribers")
def get_subscribers(limit: int = 100, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    subs = db.query(Subscriber).limit(limit).all()
    return subs
