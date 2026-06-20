import random

def get_cwc_river_level(district_id: int, recent_rainfall: float, danger_mark_m: float, flood_freq_factor: int, previous_level: float = None) -> float:
    """
    MOCK ADAPTER:
    Synthetic river-level generator.
    level = baseline + f(recent_rainfall) + flood_freq_factor + small_bounded_noise
    """
    if recent_rainfall is None:
        recent_rainfall = 0.0

    # Baseline is slightly below danger mark
    baseline = danger_mark_m * 0.8
    
    # Rainfall effect (up to 30% increase for extreme rain)
    rain_effect = (recent_rainfall / 250.0) * (danger_mark_m * 0.3)
    
    # Frequency factor effect (frequent flood areas naturally run higher)
    freq_effect = (flood_freq_factor / 10.0) * (danger_mark_m * 0.1)
    
    # If we have a previous level, we bound the noise so it doesn't jump wildly
    if previous_level is not None:
        noise = random.uniform(-0.5, 0.5)
        new_level = previous_level + (rain_effect * 0.1) + noise # gradual change
        # Keep it somewhat grounded to the calculated baseline
        attraction = (baseline + rain_effect + freq_effect - new_level) * 0.2
        return max(0.0, new_level + attraction)
    else:
        noise = random.uniform(-1.0, 1.0)
        return max(0.0, baseline + rain_effect + freq_effect + noise)
