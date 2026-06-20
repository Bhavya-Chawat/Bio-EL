from datetime import datetime, timedelta, timezone

# Simple in-memory debounce store since Redis is not required.
# Keys are strings like "alert:{subscriber_id}:{district_id}:{threshold}"
# Values are datetime objects representing when the debounce expires.
_debounce_store = {}

def is_debounced(subscriber_id: int, district_id: int, threshold: str) -> bool:
    key = f"alert:{subscriber_id}:{district_id}:{threshold}"
    expiry = _debounce_store.get(key)
    if expiry and expiry > datetime.now(timezone.utc):
        return True
    return False

def set_debounce(subscriber_id: int, district_id: int, threshold: str, hours: int = 12):
    key = f"alert:{subscriber_id}:{district_id}:{threshold}"
    _debounce_store[key] = datetime.now(timezone.utc) + timedelta(hours=hours)
