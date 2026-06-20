def get_imd_classification(rainfall_mm_24h: float) -> str:
    """
    MOCK ADAPTER:
    IMD has no usable public API. This derives its classification from the real
    OpenWeatherMap rainfall value using IMD's published bands.
    """
    if rainfall_mm_24h is None:
        return "Unknown"
    
    if rainfall_mm_24h > 204.5:
        return "Extremely Heavy Rain"
    elif rainfall_mm_24h > 115.5:
        return "Very Heavy Rain"
    elif rainfall_mm_24h > 64.5:
        return "Heavy Rain"
    elif rainfall_mm_24h > 15.5:
        return "Moderate Rain"
    elif rainfall_mm_24h > 2.4:
        return "Light Rain"
    else:
        return "Very Light Rain / No Rain"
