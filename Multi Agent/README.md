# FluxCore - Enterprise Smart Grid Command Center

FluxCore is an enterprise-grade, autonomous multi-agent **Smart Grid Operations Center** designed to orchestrate power grids, BESS (Battery Energy Storage Systems) dispatches, dynamic load shedding, and resilience threat simulations.

---

## ?? The Nine-Agent Intelligence Suite

Each agent operates on an independent state machine (`Idle ? Analysis ? Optimization ? Execute ? Reflect`) and utilizes its own Gemini client configurations:

1. **Demand Forecast Agent** (`demand_forecast.py`): Tracks grid load patterns and forecasts next-hour demand levels.
2. **Renewable Energy Intelligence Agent** (`renewable_energy.py`): Computes wind/solar generation based on live weather data.
3. **Battery Energy Agent** (`battery_energy.py`): Calculates battery State-of-Charge (SOC) and plans arbitrage dispatches.
4. **Grid Reliability Agent** (`grid_reliability.py`): Monitors system voltage thresholds and frequency stability index curves.
5. **Predictive Maintenance Agent** (`predictive_maintenance.py`): Tracks asset degradation and estimates Remaining Useful Life (RUL).
6. **Economic Intelligence Agent** (`economic_intelligence.py`): Tracks utility tariffs and market price spreads.
7. **Cybersecurity Agent**: Detects SCADA network packet anomalies and IP warning flags.
8. **EV Coordination Agent**: Allocates vehicle charging station load and plans V2G discharges.
9. **Carbon Optimization Agent**: Manages clean energy integration to offset grid footprint.

---

## ?? Environment Key Configuration

Define these keys in your shell to activate dedicated generative reasoning models for each agent. If a key is missing, only that agent falls back to deterministic rule checking:

```powershell
$env:CYBERSECURITY_AGENT_GEMINI_API_KEY="your-gemini-api-key"
$env:EV_COORDINATION_AGENT_GEMINI_API_KEY="your-gemini-api-key"
$env:MAINTENANCE_AGENT_GEMINI_API_KEY="your-gemini-api-key"
```

---

## ?? Commands to Run the Project

### 1. Start the API Gateway Backend (Python)
```powershell
cd backend
pip install -r requirements.txt
py -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Start the Mission Control Frontend (Vite + React)
```powershell
cd frontend
npm install
npm run dev
```
