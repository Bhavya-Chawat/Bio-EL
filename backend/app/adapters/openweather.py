import os
import requests

def get_weather(lat: float, lon: float):
    """
    Fetches real weather data from OpenWeatherMap using the free-tier API.
    Provides a rolling 24h rainfall aggregate from the current and 5-day/3-hour forecast endpoint.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"rainfall_mm_24h": None, "humidity_pct": None, "temperature_c": None, "stale": True}
        
    try:
        # Current weather for humidity and temp
        current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        current_res = requests.get(current_url, timeout=5)
        current_data = current_res.json()
        
        # Forecast for rolling 24h rainfall
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        forecast_res = requests.get(forecast_url, timeout=5)
        forecast_data = forecast_res.json()
        
        humidity_pct = current_data.get("main", {}).get("humidity")
        temperature_c = current_data.get("main", {}).get("temp")
        
        rainfall_mm_24h = 0.0
        # Sum rainfall for the next 8 periods (8 * 3 hours = 24 hours)
        for item in forecast_data.get("list", [])[:8]:
            rain_data = item.get("rain", {})
            rainfall_mm_24h += rain_data.get("3h", 0.0)
            
        return {
            "rainfall_mm_24h": rainfall_mm_24h,
            "humidity_pct": humidity_pct,
            "temperature_c": temperature_c,
            "stale": False,
            "raw_payload": {"current": current_data, "forecast_summary": "aggregated 8 periods"}
        }
    except Exception as e:
        return {"rainfall_mm_24h": None, "humidity_pct": None, "temperature_c": None, "stale": True, "error": str(e)}
