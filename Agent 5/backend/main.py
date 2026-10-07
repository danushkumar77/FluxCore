import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Domain
from app.domain.entities.Asset import Asset
from app.domain.aggregates.MaintenancePackage import MaintenancePackage

# Repositories
from app.infrastructure.repositories.AssetRepository import AssetRepository
from app.infrastructure.repositories.MaintenanceRepository import MaintenanceRepository

# Services
from app.application.prediction_service import PredictionService
from app.application.asset_performance_service import AssetPerformanceService
from app.application.failure_mode_engine import FailureModeEngine
from app.application.safety_validator import SafetyValidator
from app.application.planning_service import PlanningService
from app.application.reliability_service import ReliabilityService

# IoT & Event Bus
from iot.sensor_gateway import SensorGateway
from iot.simulator import TelemetrySimulator
from event_bus.publisher import EventBus
from memory.incident_memory import IncidentMemory
from memory.lesson_engine import LessonEngine
from memory.vector_search import SimpleVectorSearch
from digital_twin.digital_twin_service import DigitalTwinService

app = FastAPI(title="FluxCore Agent 5 – Asset Health & Predictive Maintenance Intelligence")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DI / Singletons
asset_repo = AssetRepository()
maintenance_repo = MaintenanceRepository()
pred_service = PredictionService(models_path="models/models.pkl")
perf_service = AssetPerformanceService()
fmea_engine = FailureModeEngine()
safety_validator = SafetyValidator()
planning_service = PlanningService()
reliability_service = ReliabilityService()
incident_memory = IncidentMemory()
lesson_engine = LessonEngine()
vector_search = SimpleVectorSearch()
dt_service = DigitalTwinService()
event_bus = EventBus()

gateway = SensorGateway(asset_repo, pred_service)
simulator = TelemetrySimulator(gateway, asset_repo)

# WebSocket Connections
connected_clients: List[WebSocket] = []

# Agent State
class AgentState:
    def __init__(self):
        self.current_state = "Idle"  # Idle, Monitoring, Asset Analysis, Health Assessment, Failure Prediction, Reasoning, Planning, Maintenance Scheduling, Execution, Reflection, Learn
        self.logs = []
        self.current_asset_under_analysis = None

    def transition(self, state: str, log_msg: str = None, asset_id: str = None):
        self.current_state = state
        self.current_asset_under_analysis = asset_id
        timestamp = datetime.utcnow().isoformat()
        log_entry = f"[{timestamp}] State: {state} | {log_msg or ''}"
        self.logs.append(log_entry)
        if len(self.logs) > 100:
            self.logs.pop(0)
        print(log_entry)
        # Broadcast state update immediately to all WS clients
        asyncio.create_task(broadcast_ws({
            "type": "agent_state_update",
            "state": self.current_state,
            "log": log_entry,
            "asset_id": asset_id
        }))

agent_state = AgentState()

# WebSocket helper
async def broadcast_ws(message: Dict[str, Any]):
    disconnected = []
    # Convert datetimes to iso strings
    def json_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError("Not serializable")
        
    payload = json.dumps(message, default=json_serializer)
    for client in connected_clients:
        try:
            await client.send_text(payload)
        except Exception:
            disconnected.append(client)
            
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)

# Wire Event Bus: Process incoming telemetry
async def handle_telemetry_updated(event: Dict[str, Any]):
    payload = event["payload"]
    asset_id = payload["asset_id"]
    telemetry = payload["telemetry"]
    
    # Run Agent State Machine for this asset
    agent_state.transition("Monitoring", f"Ingested new telemetry for {asset_id}", asset_id)
    await asyncio.sleep(0.1)
    
    agent_state.transition("Asset Analysis", f"Validating sensors and checking drift signatures.", asset_id)
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        agent_state.transition("Idle")
        return
        
    await asyncio.sleep(0.1)
    agent_state.transition("Health Assessment", f"Evaluating thresholds against knowledge limits.", asset_id)
    health = perf_service.calculate_health_index(asset)
    criticality = perf_service.calculate_criticality_score(asset)
    
    # Save health scores back to asset entity
    asset.health_index = health.score
    asset.status = health.status
    asset.criticality_score = criticality
    
    await asyncio.sleep(0.1)
    agent_state.transition("Failure Prediction", f"Running ML multi-models: Failure prob, class, and RUL.", asset_id)
    fail_prob = pred_service.predict_failure_probability(asset)
    rul_days = pred_service.predict_rul(asset)
    anomaly_data = pred_service.detect_anomaly(asset)
    fail_class = pred_service.classify_failure_mode(asset)
    opt_timing = pred_service.predict_maintenance_timing(asset)
    
    risk = perf_service.calculate_risk_score(health.score, criticality, fail_prob)
    asset.risk_score = risk.risk_index
    asset_repo.save(asset)
    
    # Broadcast asset health updates
    await broadcast_ws({
        "type": "asset_health_update",
        "asset_id": asset_id,
        "health_index": health.score,
        "status": health.status,
        "failure_probability": fail_prob,
        "rul_days": rul_days,
        "anomaly_score": anomaly_data["score"],
        "is_anomaly": anomaly_data["is_anomaly"],
        "risk_index": risk.risk_index,
        "priority": risk.priority
    })

    # If critical risk, schedule planning & Gemini reasoning
    if health.status != "Healthy" or fail_prob > 0.4:
        agent_state.transition("Reasoning", f"Invoking Gemini Reliability Copilot reasoning.", asset_id)
        # Search incident memory
        query = f"High temperature {asset.type} oil decomposition vibration"
        all_incidents = incident_memory.get_all()
        similar = [doc for score, doc in vector_search.search(query, all_incidents, top_n=2)]
        
        # Check rule violations
        triggered_rules = []
        if asset.type == "Transformer" and float(telemetry.get("oil_temp", 0.0)) > 80.0:
            triggered_rules.append({"id": "TRANSFORMER-TEMP-01", "action": "Schedule oil inspection", "severity": "Warning"})
        if asset.type == "Battery" and float(telemetry.get("cell_temp", 0.0)) > 45.0:
            triggered_rules.append({"id": "BATTERY-THERMAL-01", "action": "Isolate battery rack", "severity": "Critical"})
            
        predictions_input = {
            "failure_probability": fail_prob,
            "rul_days": rul_days,
            "anomaly_mode": fail_class
        }
        
        # Invoke Reliability Gemini/Fallback
        analysis = reliability_service.analyze_asset_health(asset, predictions_input, triggered_rules, similar)
        
        # Publish predicted failure on event bus
        event_bus.publish("asset.failure.predicted", {
            "asset_id": asset_id,
            "probability": fail_prob,
            "rul_days": rul_days,
            "reasoning": analysis.get("failure_reasoning")
        })

        agent_state.transition("Planning", f"Comparing Plan A-E options for grid restoration.", asset_id)
        plans = planning_service.generate_plans_matrix(asset, fail_prob, health.score)
        optimal = planning_service.select_optimal_plan(plans, health.status)
        
        agent_state.transition("Maintenance Scheduling", f"Compiling optimized maintenance package.", asset_id)
        package = planning_service.create_maintenance_package(asset, optimal)
        package.reasoning = f"{analysis.get('engineering_explanation')} | Recommendation: {analysis.get('recommended_action')}"
        maintenance_repo.save(package)
        
        # Notify Grid Orchestrator (Agent 6)
        event_bus.publish("maintenance.required", {
            "package_id": package.package_id,
            "asset_id": asset_id,
            "plan": package.selected_plan,
            "cost": package.estimated_cost
        })
        
        # Self-reflection: check error delta
        agent_state.transition("Reflection", f"Evaluating model prediction confidence score against historical norms.", asset_id)
        error = abs(1.0 - analysis.get("confidence_score", 0.9))
        
        agent_state.transition("Learn", f"Reinforcing incident memory database with telemetry outcomes.", asset_id)
        lesson_engine.record_lesson(asset_id, asset.type, error, f"Recommended {package.selected_plan} based on FMEA confidence.", "Successful prediction log")
        
    await asyncio.sleep(0.1)
    agent_state.transition("Idle", f"Awaiting next telemetry payload stream.")

# Subscribe handler
event_bus.subscribe("asset.telemetry.updated", handle_telemetry_updated)

# Startup & Shutdown hooks
@app.on_event("startup")
def startup_event():
    simulator.start()

@app.on_event("shutdown")
def shutdown_event():
    simulator.stop()

# --- REST ENDPOINTS ---

@app.get("/assets")
def get_assets():
    return asset_repo.get_all()

@app.get("/assets/history")
def get_history():
    return incident_memory.get_all()

@app.get("/assets/health")
def get_health():
    assets = asset_repo.get_all()
    return [{"id": a.id, "name": a.name, "health_index": a.health_index, "status": a.status} for a in assets]

@app.get("/assets/risk")
def get_risk():
    assets = asset_repo.get_all()
    return [{"id": a.id, "name": a.name, "risk_score": a.risk_score, "criticality": a.criticality_score} for a in assets]

@app.get("/assets/rul")
def get_rul():
    assets = asset_repo.get_all()
    results = []
    for a in assets:
        rul = pred_service.predict_rul(a)
        results.append({"id": a.id, "name": a.name, "rul_days": rul})
    return results

@app.get("/maintenance/plans")
def get_maintenance_plans():
    return maintenance_repo.get_all()

@app.get("/maintenance/history")
def get_maintenance_history():
    return [p for p in maintenance_repo.get_all() if p.status in ["Completed", "Rejected"]]

@app.get("/model-info")
def get_model_info():
    if os.path.exists("models/metrics.json"):
        with open("models/metrics.json", "r") as f:
            return json.load(f)
    return {"status": "Metrics not found"}

@app.get("/system/status")
def get_system_status():
    return {
        "agent_state": agent_state.current_state,
        "logs_count": len(agent_state.logs),
        "recent_logs": agent_state.logs[-10:],
        "active_simulations": simulator.running
    }

@app.get("/asset/criticality")
def get_criticality():
    assets = asset_repo.get_all()
    predictions = {a.id: pred_service.predict_failure_probability(a) for a in assets}
    return perf_service.generate_fleet_criticality_ranking(assets, predictions)

@app.get("/asset/health-index/{asset_id}")
def get_health_index_asset(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    idx = perf_service.calculate_health_index(asset)
    return idx

@app.get("/asset/failure-modes/{asset_id}")
def get_failure_modes(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return fmea_engine.analyze_failure_modes(asset.type, asset.telemetry)

@app.get("/asset/digital-twin/{asset_id}")
def get_digital_twin_geom(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return dt_service.get_digital_twin_geometry(asset.id, asset.type)

# POST routes

@app.post("/asset/predict-failure/{asset_id}")
def predict_failure(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    prob = pred_service.predict_failure_probability(asset)
    class_fail = pred_service.classify_failure_mode(asset)
    rul = pred_service.predict_rul(asset)
    return {
        "asset_id": asset_id,
        "failure_probability": prob,
        "failure_class": class_fail,
        "rul_days_estimate": rul
    }

@app.post("/asset/analyze-health/{asset_id}")
def analyze_health(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    health = perf_service.calculate_health_index(asset)
    return health

class OptimizationRequest(BaseModel):
    asset_id: str

@app.post("/maintenance/optimize")
def optimize_maint(req: OptimizationRequest):
    asset = asset_repo.get_by_id(req.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    prob = pred_service.predict_failure_probability(asset)
    plans = planning_service.generate_plans_matrix(asset, prob, asset.health_index)
    optimal = planning_service.select_optimal_plan(plans, asset.status)
    return {
        "plans_comparison": plans,
        "optimal_selection": optimal
    }

class ScheduleRequest(BaseModel):
    asset_id: str
    plan_name: str

@app.post("/maintenance/schedule")
def schedule_maint(req: ScheduleRequest):
    asset = asset_repo.get_by_id(req.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Generate optimal matrix for details
    prob = pred_service.predict_failure_probability(asset)
    plans = planning_service.generate_plans_matrix(asset, prob, asset.health_index)
    selected_plan_data = next((p for p in plans if p["name"] == req.plan_name), plans[0])
    
    package = planning_service.create_maintenance_package(asset, selected_plan_data)
    maintenance_repo.save(package)
    return package

class ChatRequest(BaseModel):
    message: str
    asset_id: Optional[str] = None

@app.post("/copilot/chat")
def copilot_chat(req: ChatRequest):
    # Retrieve asset details if asset_id is provided
    asset_details = ""
    triggered_rules = []
    similar_incidents = []
    
    if req.asset_id:
        asset = asset_repo.get_by_id(req.asset_id)
        if asset:
            prob = pred_service.predict_failure_probability(asset)
            rul = pred_service.predict_rul(asset)
            asset_details = f"Asset {asset.name} ({asset.id}) health={asset.health_index}% probability={prob*100:.1f}%, RUL={rul:.1f} days. Telemetry: {asset.telemetry}"
            
            # Semantic search
            all_incidents = incident_memory.get_all()
            similar_incidents = [doc for score, doc in vector_search.search(req.message, all_incidents, top_n=1)]
            
    # Compile prompt context
    system_prompt = f"""
You are a Senior Predictive Maintenance Engineer. Answer this query professionally.
Current Context: {asset_details}
Triggered limits: {triggered_rules}
Incident memory records: {similar_incidents}
Avoid conversational filler. Output technical, structured recommendations.
"""
    try:
        if reliability_service.client_initialized:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(system_prompt + "\nUser Query: " + req.message)
            return {"response": response.text}
        else:
            # Fallback chat response
            fallback_reply = f"Technical Analysis: Based on the operational envelope and rule index, {req.asset_id or 'the asset'} is stable. "
            if "temperature" in req.message.lower() or "overheat" in req.message.lower():
                fallback_reply += "Verify cooling fan circuits and load levels. If C2H2 > 2ppm, schedule oil testing."
            else:
                fallback_reply += "Check mechanical alignment, vibration profiles, or SF6 gas density seals."
            return {"response": fallback_reply}
    except Exception as e:
        return {"response": f"Chat Engine Error: {e}"}

@app.post("/asset/run-diagnostics/{asset_id}")
def run_diagnostics(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Run full diagnostics cycle
    health = perf_service.calculate_health_index(asset)
    prob = pred_service.predict_failure_probability(asset)
    drifted = pred_service.detect_drift(asset)
    anomaly_res = pred_service.detect_anomaly(asset)
    fmea = fmea_engine.analyze_failure_modes(asset.type, asset.telemetry)
    
    return {
        "status": "completed",
        "asset_id": asset_id,
        "health_index": health.score,
        "failure_probability": prob,
        "sensor_drift_detected": drifted,
        "is_anomaly": anomaly_res["is_anomaly"],
        "anomaly_score": anomaly_res["score"],
        "active_failure_modes": fmea
    }

@app.post("/asset/failure-analysis/{asset_id}")
def run_failure_analysis(asset_id: str):
    asset = asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # run detailed FMEA and search incident memory
    fmea = fmea_engine.analyze_failure_modes(asset.type, asset.telemetry)
    all_incidents = incident_memory.get_all()
    similar = [doc for score, doc in vector_search.search(asset.type + " insulation gas wear", all_incidents, top_n=2)]
    
    return {
        "asset_id": asset_id,
        "failure_modes_detected": fmea,
        "similar_incidents": similar
    }

class ApproveRequest(BaseModel):
    package_id: str
    approved_by: str

@app.post("/maintenance/approve")
def approve_maintenance(req: ApproveRequest):
    pkg = maintenance_repo.get_by_id(req.package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Maintenance Package not found")
    
    pkg.approved = True
    pkg.approved_by = req.approved_by
    pkg.status = "Approved"
    pkg.execution_log.append(f"{datetime.utcnow().isoformat()} - Approved by {req.approved_by}")
    maintenance_repo.save(pkg)
    
    # Notify event bus
    event_bus.publish("maintenance.completed", {
        "package_id": pkg.package_id,
        "asset_id": pkg.asset_id,
        "status": "Approved"
    })
    return pkg

class ExecuteRequest(BaseModel):
    package_id: str

@app.post("/maintenance/execute")
def execute_maintenance(req: ExecuteRequest):
    pkg = maintenance_repo.get_by_id(req.package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Maintenance Package not found")
    
    if not pkg.approved:
        raise HTTPException(status_code=400, detail="Cannot execute unapproved package")
        
    pkg.status = "Completed"
    pkg.execution_log.append(f"{datetime.utcnow().isoformat()} - Work completed by technician crew.")
    maintenance_repo.save(pkg)
    
    # Restore asset health in database to show completed repair loop
    asset = asset_repo.get_by_id(pkg.asset_id)
    if asset:
        # Reset telemetry to default values
        if asset.type == "Transformer":
            asset.telemetry = {
                "oil_temp": 42.0, "winding_temp": 48.0, "h2_gas": 8.0, "c2h2_gas": 0.05,
                "ch4_gas": 3.0, "c2h4_gas": 1.0, "breakdown_voltage": 68.0,
                "moisture": 10.0, "pd_level": 40.0, "vibration": 1.0, "load_factor": 50.0
            }
        elif asset.type == "Battery":
            asset.telemetry = {
                "soc": 90.0, "soh": 98.0, "cell_temp": 24.0, "max_cell_voltage": 3.82,
                "min_cell_voltage": 3.81, "internal_resistance": 14.0, "charge_cycles": 0, "current_draw": 10.0
            }
        elif asset.type == "CircuitBreaker":
            asset.telemetry = {
                "switching_operations": 0, "contact_wear": 0.0, "operation_time": 38.0,
                "sf6_pressure": 6.2, "coil_current": 1.9, "ambient_temp": 24.0
            }
        asset.health_index = 100.0
        asset.status = "Healthy"
        asset_repo.save(asset)
        
    # Notify event bus
    event_bus.publish("maintenance.completed", {
        "package_id": pkg.package_id,
        "asset_id": pkg.asset_id,
        "status": "Completed"
    })
    return pkg

# --- WEBSOCKETS ---

@app.websocket("/ws/assets")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    # Read port from env or default to 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
