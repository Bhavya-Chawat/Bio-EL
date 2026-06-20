def compute_v_score(open_defecation_pct: float, elderly_child_pct: float, hospital_density_per_100k: float) -> int:
    if open_defecation_pct is None or elderly_child_pct is None or hospital_density_per_100k is None:
        return 1
    points = 0
    points += 1 if open_defecation_pct > 15 else 0
    points += 1 if elderly_child_pct > 30 else 0
    points += 1 if hospital_density_per_100k < 50 else 0
    if points >= 2:
        return 3
    elif points == 1:
        return 2
    return 1
