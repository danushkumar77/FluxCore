import httpx

print("Verifying FluxCore Agent 5 Backend API on port 8001...")

# 1. Test GET /assets
try:
    r = httpx.get("http://127.0.0.1:8001/assets")
    print(f"GET /assets Status: {r.status_code}")
    assets = r.json()
    print(f"Loaded {len(assets)} assets:")
    for a in assets:
        print(f" - {a['id']}: {a['name']} ({a['type']}) | Health: {a['health_index']}% | Status: {a['status']}")
except Exception as e:
    print(f"GET /assets failed: {e}")

# 2. Test GET /asset/criticality
try:
    r = httpx.get("http://127.0.0.1:8001/asset/criticality")
    print(f"GET /asset/criticality Status: {r.status_code}")
    print(f"Fleet Criticality Rankings (Top 3):")
    for item in r.json()[:3]:
        print(f" - {item['asset_id']}: Risk Index {item['risk_index']:.2f} | Priority: {item['priority']}")
except Exception as e:
    print(f"GET /asset/criticality failed: {e}")

# 3. Test POST /asset/run-diagnostics/T-101
try:
    r = httpx.post("http://127.0.0.1:8001/asset/run-diagnostics/T-101")
    print(f"POST /asset/run-diagnostics/T-101 Status: {r.status_code}")
    diag = r.json()
    print(f"Diagnostics Result:")
    print(f" - Health Score: {diag['health_index']}")
    print(f" - Failure Prob: {diag['failure_probability']:.4f}")
    print(f" - Anomaly Score: {diag['anomaly_score']:.4f}")
    print(f" - Active FMEA Modes: {diag['active_failure_modes']}")
except Exception as e:
    print(f"POST /asset/run-diagnostics failed: {e}")

# 4. Test GET /model-info
try:
    r = httpx.get("http://127.0.0.1:8001/model-info")
    print(f"GET /model-info Status: {r.status_code}")
    print(f"Model Info: {r.json()}")
except Exception as e:
    print(f"GET /model-info failed: {e}")
