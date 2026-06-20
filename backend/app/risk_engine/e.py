def compute_e_score(level_m: float, danger_mark_m: float, flood_freq_per_decade: int) -> int:
    if level_m is None or danger_mark_m is None or flood_freq_per_decade is None:
        return 1
    exceedance_pct = (level_m - danger_mark_m) / danger_mark_m
    if exceedance_pct > 0.10 or flood_freq_per_decade >= 7:
        return 3
    elif exceedance_pct > -0.05 or flood_freq_per_decade >= 3:
        return 2
    return 1
