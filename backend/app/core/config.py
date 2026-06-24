import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./bioshield.db"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecret")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    ALERT_DISPATCH_MODE: str = os.getenv("ALERT_DISPATCH_MODE", "mock")
    ALERT_DEBOUNCE_HOURS: int = 12

settings = Settings()
