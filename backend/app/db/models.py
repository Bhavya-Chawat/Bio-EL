from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON, DateTime, ARRAY, Text
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class District(Base):
    __tablename__ = 'districts'
    id = Column(Integer, primary_key=True, index=True)
    lgd_code = Column(String(10), unique=True, index=True)
    name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    centroid_lat = Column(Float)
    centroid_lng = Column(Float)
    # Replaced PostGIS GEOMETRY with JSON for SQLite
    geometry = Column(JSON)
    is_seeded = Column(Boolean, default=False)
    population = Column(Integer)
    open_defecation_pct = Column(Float)
    elderly_child_pct = Column(Float)
    hospital_density_per_100k = Column(Float)
    river_danger_mark_m = Column(Float)
    historical_flood_freq_per_decade = Column(Integer)
    v_score = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WeatherObservation(Base):
    __tablename__ = 'weather_observations'
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey('districts.id'))
    observed_at = Column(DateTime(timezone=True), nullable=False)
    source = Column(String(20), nullable=False)
    rainfall_mm_24h = Column(Float)
    humidity_pct = Column(Float)
    temperature_c = Column(Float)
    w_score = Column(Integer)
    raw_payload = Column(JSON)

class RiverLevel(Base):
    __tablename__ = 'river_levels'
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey('districts.id'))
    observed_at = Column(DateTime(timezone=True), nullable=False)
    source = Column(String(20), default='cwc_mock')
    level_m = Column(Float)
    danger_mark_m = Column(Float)
    exceedance_pct = Column(Float)
    e_score = Column(Integer)

class RiskScore(Base):
    __tablename__ = 'risk_scores'
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey('districts.id'), index=True)
    computed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    w_score = Column(Integer)
    e_score = Column(Integer)
    v_score = Column(Integer)
    r_score = Column(Integer)
    zone = Column(String(10))
    is_replay = Column(Boolean, default=False)
    replay_event = Column(String(30))

class Subscriber(Base):
    __tablename__ = 'subscribers'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255))
    phone = Column(String(20))
    preferred_language = Column(String(5), default='en')
    threshold = Column(String(10), default='medium')
    channels = Column(JSON) # Storing ARRAY as JSON in SQLite
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SubscriberDistrict(Base):
    __tablename__ = 'subscriber_districts'
    subscriber_id = Column(Integer, ForeignKey('subscribers.id'), primary_key=True)
    district_id = Column(Integer, ForeignKey('districts.id'), primary_key=True)

class AlertsLog(Base):
    __tablename__ = 'alerts_log'
    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey('subscribers.id'))
    district_id = Column(Integer, ForeignKey('districts.id'))
    risk_score_id = Column(Integer, ForeignKey('risk_scores.id'))
    channel = Column(String(10))
    dispatch_mode = Column(String(10))
    status = Column(String(20))
    message_body = Column(Text)
    dispatched_at = Column(DateTime(timezone=True), server_default=func.now())

class AdminUser(Base):
    __tablename__ = 'admin_users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default='admin')

class AdminReport(Base):
    __tablename__ = 'admin_reports'
    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey('admin_users.id'))
    district_id = Column(Integer, ForeignKey('districts.id'))
    disease = Column(String(50))
    case_count = Column(Integer)
    notes = Column(Text)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
