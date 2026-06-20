def compute_w_score(rainfall_mm_24h: float) -> int:
    if rainfall_mm_24h is None:
        return 1
    if rainfall_mm_24h > 204.5:
        return 3   # IMD: Extremely Heavy
    elif rainfall_mm_24h > 64.5:
        return 2   # IMD: Heavy
    return 1
