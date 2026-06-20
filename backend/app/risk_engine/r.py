def compute_risk(w: int, e: int, v: int) -> dict:
    if w is None or e is None or v is None:
        w = w or 1
        e = e or 1
        v = v or 1
    r = w * e * v
    zone = "high" if r >= 15 else "medium" if r >= 7 else "low"
    return {"w": w, "e": e, "v": v, "r": r, "zone": zone}
