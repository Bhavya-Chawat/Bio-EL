from app.risk_engine import compute_w_score, compute_e_score, compute_v_score, compute_risk

def test_compute_w_score():
    assert compute_w_score(None) == 1
    assert compute_w_score(0) == 1
    assert compute_w_score(64.5) == 1
    assert compute_w_score(64.6) == 2
    assert compute_w_score(204.5) == 2
    assert compute_w_score(204.6) == 3

def test_compute_e_score():
    assert compute_e_score(None, None, None) == 1
    # level_m = 10, danger = 10 -> exceedance = 0 -> > -0.05 is True -> 2
    assert compute_e_score(10.0, 10.0, 0) == 2
    # exceedance > 0.10
    assert compute_e_score(11.1, 10.0, 0) == 3
    # exceedance < -0.05, low freq
    assert compute_e_score(9.0, 10.0, 0) == 1
    # low exceedance, high freq >= 7
    assert compute_e_score(9.0, 10.0, 8) == 3
    # low exceedance, freq >= 3
    assert compute_e_score(9.0, 10.0, 4) == 2

def test_compute_v_score():
    assert compute_v_score(None, None, None) == 1
    # All true
    assert compute_v_score(20.0, 40.0, 30.0) == 3
    # Two true
    assert compute_v_score(20.0, 40.0, 60.0) == 3
    # One true
    assert compute_v_score(10.0, 40.0, 60.0) == 2
    # Zero true
    assert compute_v_score(10.0, 20.0, 60.0) == 1

def test_compute_risk():
    res = compute_risk(1, 1, 1)
    assert res["r"] == 1
    assert res["zone"] == "low"
    
    res = compute_risk(3, 2, 1)
    assert res["r"] == 6
    assert res["zone"] == "low"
    
    res = compute_risk(2, 2, 2)
    assert res["r"] == 8
    assert res["zone"] == "medium"
    
    res = compute_risk(3, 3, 1)
    assert res["r"] == 9
    assert res["zone"] == "medium"
    
    res = compute_risk(3, 3, 2)
    assert res["r"] == 18
    assert res["zone"] == "high"
