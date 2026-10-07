import os
import time
import json
import random
import threading
import queue
import pandas as pd
import xgboost as xgb
from datetime import datetime

from backend.agent.agent_state import AgentStateMachine, AgentState
from backend.agent.weather_client import WeatherClient
from backend.agent.memory_manager import MemoryManager
from backend.agent.knowledge_engine import KnowledgeEngine
from backend.agent.decision_engine import DecisionEngine
from backend.agent.reflection_engine import ReflectionEngine
from backend.agent.tools import SimulatedTools
from backend.agent.gemini_client import GeminiClient
from backend.ml.feature_engineering import engineer_features

# Upgraded Enterprise Modules
from backend.agent.identity import AgentIdentity
from backend.agent.goals import GoalManagementEngine
from backend.agent.trace import DecisionTraceSystem
from backend.agent.simulation import AssetSimulator
from backend.agent.operator import OperatorApprovalWorkflow
from backend.agent.alerts import AlertManagementSystem

class AgentScheduler:
    def __init__(self):
        # Core engines
        self.state_machine = AgentStateMachine()
        self.memory = MemoryManager()
        self.knowledge = KnowledgeEngine()
        self.tools = SimulatedTools(self.memory)
        self.weather = WeatherClient()
        self.gemini = GeminiClient()
        self.decision = DecisionEngine(self.knowledge)
        self.reflection = ReflectionEngine(self.memory)
        
        # Enterprise modules
        self.identity = AgentIdentity()
        self.goal_engine = GoalManagementEngine()
        self.trace_system = DecisionTraceSystem(self.memory)
        self.simulator = AssetSimulator()
        self.operator_workflow = OperatorApprovalWorkflow(self.memory, self.tools)
        self.alert_system = AlertManagementSystem(self.memory)
        
        # Stream queues for SSE & WebSocket updates
        self.stream_listeners = []
        self.websocket_listeners = []
        self._lock = threading.Lock()
        
        # Load ML Models
        self.solar_model = None
        self.wind_model = None
        self.hydro_model = None
        self.solar_features = []
        self.wind_features = []
        self.hydro_features = []
        self._load_models()
        
        # Active status
        self.running = False
        self.worker_thread = None
        
        # Store last known iteration data
        self.last_run_data = {}

    def _load_models(self):
        model_dir = "backend/models"
        os.makedirs(model_dir, exist_ok=True)
        
        solar_path = os.path.join(model_dir, "solar_model.json")
        wind_path = os.path.join(model_dir, "wind_model.json")
        hydro_path = os.path.join(model_dir, "hydro_model.json")
        
        # Train automatically if models not found
        if not (os.path.exists(solar_path) and os.path.exists(wind_path) and os.path.exists(hydro_path)):
            print("[SCHEDULER] ML models not found. Triggering training pipeline...")
            try:
                from backend.ml.train_models import main as train_main
                train_main()
            except Exception as e:
                print(f"[SCHEDULER] Automatic training failed: {e}")
                
        # Load solar
        try:
            self.solar_model = xgb.XGBRegressor()
            self.solar_model.load_model(solar_path)
            with open(os.path.join(model_dir, "solar_features.json"), "r") as f:
                self.solar_features = json.load(f)
            
            self.wind_model = xgb.XGBRegressor()
            self.wind_model.load_model(wind_path)
            with open(os.path.join(model_dir, "wind_features.json"), "r") as f:
                self.wind_features = json.load(f)
                
            self.hydro_model = xgb.XGBRegressor()
            self.hydro_model.load_model(hydro_path)
            with open(os.path.join(model_dir, "hydro_features.json"), "r") as f:
                self.hydro_features = json.load(f)
            print("[SCHEDULER] All XGBoost forecasting models loaded successfully.")
        except Exception as e:
            print(f"[SCHEDULER] Critical: Error loading models: {e}")

    def add_stream_listener(self, q: queue.Queue):
        with self._lock:
            self.stream_listeners.append(q)

    def remove_stream_listener(self, q: queue.Queue):
        with self._lock:
            if q in self.stream_listeners:
                self.stream_listeners.remove(q)

    def broadcast_stream_event(self, event_type: str, data: dict):
        event = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        # Broadcast to SSE listeners
        with self._lock:
            for q in list(self.stream_listeners):
                try:
                    q.put_nowait(event)
                except Exception:
                    pass
                    
        # Broadcast to WebSocket listeners (handled asynchronously in main)
        for ws_callback in list(self.websocket_listeners):
            try:
                ws_callback(event)
            except Exception:
                pass

    def start(self):
        if self.running:
            return
        self.running = True
        self.worker_thread = threading.Thread(target=self._run_loop, daemon=True)
        self.worker_thread.start()
        print("[SCHEDULER] Autonomous agent scheduler started.")

    def stop(self):
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        print("[SCHEDULER] Autonomous agent scheduler stopped.")

    def _run_loop(self):
        while self.running:
            try:
                self.run_once()
            except Exception as e:
                print(f"[SCHEDULER] Error in main loop iteration: {e}")
                self.state_machine.transition_to(AgentState.RECOVERY)
                self.broadcast_stream_event("step_update", {
                    "step": "⚠️ Recovery State Activated: Handling loop failure...",
                    "progress": 100,
                    "status": "error"
                })
                time.sleep(10) # cool down
            # Run every 30 seconds for simulation demo purposes
            time.sleep(30)

    def run_once(self) -> dict:
        """
        Runs one complete step of the upgraded enterprise agent lifecycle:
        Observe -> Forecast -> Reason (Embeddings Similarity) -> Plan (Goal Auditing) 
        -> Optimize (Gemini) -> Execute (Approval Intercept) -> Reflect -> Idle
        """
        run_id = random.randint(1000, 9999)
        print(f"\n[SCHEDULER] Starting Upgraded Autonomous Loop Run #{run_id}")
        
        # 1. Observe (Collecting Live Telemetry)
        self.state_machine.transition_to(AgentState.MONITORING)
        self.broadcast_stream_event("state_update", {"state": AgentState.MONITORING})
        self.broadcast_stream_event("step_update", {
            "step": "🌤 Connecting to Open-Meteo Weather API...",
            "progress": 10,
            "status": "active"
        })
        time.sleep(1)
        
        weather_data = self.weather.fetch_live_weather()
        # Set active SOH variables into weather context for simulator downstream
        weather_data["battery_soh"] = self.simulator.battery_soh
        weather_data["surplus"] = 0.0 # Will calculate after predictions
        
        # Inject season value
        month = datetime.utcnow().month
        if month in [12, 1, 2]:
            weather_data["season"] = 0
        elif month in [3, 4, 5]:
            weather_data["season"] = 1
        elif month in [6, 7, 8]:
            weather_data["season"] = 2
        else:
            weather_data["season"] = 3
        
        self.broadcast_stream_event("step_update", {
            "step": f"☀ Weather Telemetry Received from {weather_data['source']}",
            "progress": 25,
            "status": "active",
            "telemetry": weather_data
        })
        time.sleep(1)

        # 2. Forecast (ML Prediction)
        self.state_machine.transition_to(AgentState.FORECASTING)
        self.broadcast_stream_event("state_update", {"state": AgentState.FORECASTING})
        self.broadcast_stream_event("step_update", {
            "step": "🌬 Running Advanced Renewable Feature Engineering...",
            "progress": 35,
            "status": "active"
        })
        
        # Feature Engineering Lags
        hist_records = self.memory.get_forecast_history(limit=24)
        df_weather = pd.DataFrame([weather_data])
        if hist_records:
            hist_df = pd.DataFrame(hist_records)
            cols = ["timestamp", "solar_irradiance", "cloud_cover", "wind_speed", "wind_direction", 
                    "temperature", "humidity", "rainfall", "atmospheric_pressure", "reservoir_level", 
                    "grid_demand", "battery_soc", "electricity_price", "season"]
            hist_df = hist_df[cols].sort_values("timestamp")
            combined_df = pd.concat([hist_df, df_weather[cols]], ignore_index=True)
        else:
            combined_df = df_weather
            
        df_engineered = engineer_features(combined_df)
        current_features = df_engineered.iloc[[-1]]
        
        self.broadcast_stream_event("step_update", {
            "step": "📈 Evaluating XGBoost Generation Forecast Models...",
            "progress": 45,
            "status": "active"
        })
        
        # Predict Solar
        if self.solar_model:
            solar_pred = float(self.solar_model.predict(current_features[self.solar_features])[0])
            solar_pred = max(0.0, solar_pred)
            if current_features["solar_zenith_angle"].values[0] >= 90.0:
                solar_pred = 0.0
        else:
            solar_pred = 0.0
            
        # Predict Wind
        if self.wind_model:
            wind_pred = float(self.wind_model.predict(current_features[self.wind_features])[0])
            wind_pred = max(0.0, wind_pred)
            if weather_data["wind_speed"] < 3.0 or weather_data["wind_speed"] > 25.0:
                wind_pred = 0.0
        else:
            wind_pred = 0.0
            
        # Predict Hydro
        if self.hydro_model:
            hydro_pred = float(self.hydro_model.predict(current_features[self.hydro_features])[0])
            hydro_pred = max(0.0, hydro_pred)
        else:
            hydro_pred = 0.0
            
        forecasts = {
            "solar_generation": round(solar_pred, 2),
            "wind_generation": round(wind_pred, 2),
            "hydro_generation": round(hydro_pred, 2),
            "total_renewable": round(solar_pred + wind_pred + hydro_pred, 2)
        }
        
        weather_data["surplus"] = forecasts["total_renewable"] - weather_data["grid_demand"]
        
        self.broadcast_stream_event("step_update", {
            "step": f"💧 Predictions Computed (Solar: {solar_pred:.0f}kW, Wind: {wind_pred:.0f}kW, Hydro: {hydro_pred:.0f}kW)",
            "progress": 55,
            "status": "active",
            "forecasts": forecasts
        })
        time.sleep(1)

        # 3. Memory & Knowledge Consult (Advanced Embeddings Search)
        self.state_machine.transition_to(AgentState.REASONING)
        self.broadcast_stream_event("state_update", {"state": AgentState.REASONING})
        self.broadcast_stream_event("step_update", {
            "step": "📚 Fetching Vector Embeddings from Gemini API...",
            "progress": 65,
            "status": "active"
        })
        
        # Generate weather summary text to search vector DB
        weather_summary_text = (
            f"Weather Irradiance: {weather_data['solar_irradiance']} W/m2, "
            f"Wind Speed: {weather_data['wind_speed']} m/s, "
            f"Temperature: {weather_data['temperature']} C, "
            f"Cloud Cover: {weather_data['cloud_cover']*100:.1f}%. "
            f"Electricity price is {weather_data['electricity_price']} USD/MWh."
        )
        embedding = self.gemini.generate_embedding(weather_summary_text)
        
        if embedding:
            self.broadcast_stream_event("step_update", {
                "step": "🔍 Executing Cosine Similarity match on SQLite Memory Store...",
                "progress": 70,
                "status": "active"
            })
            memory_matches = self.memory.search_similar_vector(embedding, limit=3)
        else:
            # Fallback to Euclidean
            self.broadcast_stream_event("step_update", {
                "step": "🔍 (Fallback) Running Euclidean distance weather search...",
                "progress": 70,
                "status": "active"
            })
            memory_matches = self.memory.search_similar_conditions(
                solar_irradiance=weather_data["solar_irradiance"],
                wind_speed=weather_data["wind_speed"],
                temperature=weather_data["temperature"],
                cloud_cover=weather_data["cloud_cover"],
                limit=3
            )
            
        rules = self.knowledge.get_rules()
        compliance_warnings = self.knowledge.check_compliance(
            solar_forecast=solar_pred,
            wind_forecast=wind_pred,
            hydro_forecast=hydro_pred,
            reservoir_level=weather_data["reservoir_level"],
            wind_speed=weather_data["wind_speed"]
        )
        time.sleep(1)

        # 4. Decision Engine & Goal Management scoring
        self.state_machine.transition_to(AgentState.PLANNING)
        self.broadcast_stream_event("state_update", {"state": AgentState.PLANNING})
        self.broadcast_stream_event("step_update", {
            "step": "⚡ Auditing operating plans against active operational goals...",
            "progress": 82,
            "status": "active"
        })
        plan_analysis = self.decision.evaluate_plans(weather_data, forecasts)
        
        # Evaluate goals compatibility for the optimal strategy
        optimal_plan_name = plan_analysis["optimal_strategy"]["name"]
        optimal_plan_scores = plan_analysis["plans"][optimal_plan_name]["scores"]
        goal_evaluation = self.goal_engine.evaluate_decision(optimal_plan_name, optimal_plan_scores, weather_data)
        time.sleep(1)

        # 5. Optimize (Gemini Core reasoning)
        self.state_machine.transition_to(AgentState.OPTIMIZING)
        self.broadcast_stream_event("state_update", {"state": AgentState.OPTIMIZING})
        self.broadcast_stream_event("step_update", {
            "step": "🤖 Submitting audited goals & context to Gemini AI Brain...",
            "progress": 90,
            "status": "active"
        })
        
        # Inject goals report into plan context
        plan_analysis["goal_evaluation"] = goal_evaluation
        gemini_result = self.gemini.generate_agent_reasoning(
            weather=weather_data,
            forecasts=forecasts,
            memory_matches=memory_matches,
            rules=rules,
            plan_analysis=plan_analysis
        )
        time.sleep(1)

        # 6. Execute (Human-in-the-loop Queue Check)
        self.state_machine.transition_to(AgentState.EXECUTING)
        self.broadcast_stream_event("state_update", {"state": AgentState.EXECUTING})
        self.broadcast_stream_event("step_update", {
            "step": "🔋 Checking action safety and operator approval requirements...",
            "progress": 95,
            "status": "active"
        })
        
        tool_outputs = []
        is_blocked_by_approval = False
        selected_plan = plan_analysis["optimal_strategy"]["name"]
        
        # Audit recommended actions for Operator Approval requirements
        for rec in gemini_result["recommendations"]:
            rec_lower = rec.lower()
            action_name = ""
            params = {}
            risk_desc = ""
            
            if "solar" in rec_lower and "dispatch" in rec_lower:
                action_name = "increase_solar_dispatch"
                params = {"amount_mw": solar_pred * 0.95 / 1000.0}
            elif "wind" in rec_lower and "dispatch" in rec_lower:
                action_name = "increase_wind_dispatch"
                params = {"amount_mw": wind_pred * 0.95 / 1000.0}
            elif "hydro" in rec_lower and "dispatch" in rec_lower:
                action_name = "increase_hydro_dispatch"
                params = {"amount_mw": hydro_pred * 0.95 / 1000.0}
                risk_desc = "Hydro penstock valves operation alters reservoir discharge ratios. Respect minimal catchment levels."
            elif "battery" in rec_lower or "charge" in rec_lower:
                action_name = "charge_battery"
                params = {"power_mw": max(1.0, (forecasts["total_renewable"] - weather_data["grid_demand"]) / 1000.0), "duration_hours": 1.0}
            elif "store" in rec_lower:
                action_name = "store_surplus_energy"
                params = {"power_mw": max(1.0, (forecasts["total_renewable"] - weather_data["grid_demand"]) / 1000.0)}
            elif "sell" in rec_lower:
                action_name = "sell_excess_power"
                params = {"power_mw": max(1.0, (forecasts["total_renewable"] - weather_data["grid_demand"]) / 1000.0), "price_per_mwh": weather_data["electricity_price"]}
                risk_desc = "Wholesale power exports subject to grid line loading limits and interconnect tariff contracts."
            
            if action_name:
                # Ask operator workflow if approval is required
                req_approval = self.operator_workflow.queue_action(run_id, action_name, params, risk_desc)
                if req_approval:
                    is_blocked_by_approval = True
                    tool_outputs.append(f"Action '{action_name}' queued: Awaiting Human Operator approval.")
                else:
                    out = self.tools.execute_tool(action_name, params)
                    tool_outputs.append(out)

        if not tool_outputs:
            out = self.tools.notify_grid_operator("Renewable dispatch schedules updated to optimal configuration.")
            tool_outputs.append(out)
            
        # 7. Run Operational Simulator & Alerts
        sim_results = self.simulator.run_simulation(weather_data, forecasts, selected_plan)
        alerts_list = self.alert_system.generate_alerts(weather_data, forecasts, sim_results, gemini_result["confidence"])
        
        # 8. Record trace audit log
        trace_status = "PENDING_APPROVAL" if is_blocked_by_approval else "AUTO_EXECUTED"
        trace_record = self.trace_system.create_trace(
            run_id=run_id,
            observation=weather_data,
            prediction=forecasts,
            memory_matches=memory_matches,
            rules_audited=compliance_warnings,
            plan_analysis=plan_analysis,
            selected_plan=selected_plan,
            goal_evaluation=goal_evaluation,
            confidence=gemini_result["confidence"],
            reasoning=gemini_result["reasoning"],
            status=trace_status
        )

        # 9. Store Forecast in SQLite (include embedding vector)
        db_data = {
            "timestamp": weather_data["timestamp"],
            "solar_irradiance": weather_data["solar_irradiance"],
            "cloud_cover": weather_data["cloud_cover"],
            "wind_speed": weather_data["wind_speed"],
            "wind_direction": weather_data["wind_direction"],
            "temperature": weather_data["temperature"],
            "humidity": weather_data["humidity"],
            "rainfall": weather_data["rainfall"],
            "atmospheric_pressure": weather_data["atmospheric_pressure"],
            "reservoir_level": weather_data["reservoir_level"],
            "grid_demand": weather_data["grid_demand"],
            "battery_soc": weather_data["battery_soc"],
            "electricity_price": weather_data["electricity_price"],
            "season": weather_data["season"],
            "solar_forecast": forecasts["solar_generation"],
            "wind_forecast": forecasts["wind_generation"],
            "hydro_forecast": forecasts["hydro_generation"],
            "renewable_score": round((forecasts["total_renewable"] / max(1.0, weather_data["grid_demand"])) * 100.0, 1),
            "confidence": gemini_result["confidence"],
            "carbon_reduction": gemini_result["carbon_reduction"],
            "risk": gemini_result["risk"],
            "reasoning": gemini_result["reasoning"],
            "embedding": json.dumps(embedding) if embedding else None
        }
        forecast_id = self.memory.store_forecast(db_data)
        
        # Store Selected Plan details
        self.memory.store_decision(
            forecast_id=forecast_id,
            selected_plan=selected_plan,
            plan_details=plan_analysis,
            reasoning=gemini_result["reasoning"]
        )

        # 10. Reflections & Learning
        self.state_machine.transition_to(AgentState.MONITORING_RESULTS)
        self.broadcast_stream_event("state_update", {"state": AgentState.MONITORING_RESULTS})
        time.sleep(1)
        
        actuals = {
            "solar": round(solar_pred * random.uniform(0.95, 1.03), 2) if solar_pred > 0 else 0.0,
            "wind": round(wind_pred * random.uniform(0.92, 1.05), 2) if wind_pred > 0 else 0.0,
            "hydro": round(hydro_pred * random.uniform(0.98, 1.02), 2) if hydro_pred > 0 else 0.0
        }
        
        self.state_machine.transition_to(AgentState.REFLECTING)
        self.broadcast_stream_event("state_update", {"state": AgentState.REFLECTING})
        self.broadcast_stream_event("step_update", {
            "step": "📊 Running Reflection Engine: Analyzing SOH and model drift indices...",
            "progress": 98,
            "status": "active"
        })
        
        reflection_results = self.reflection.reflect(
            forecast_id=forecast_id,
            forecasts={"solar": solar_pred, "wind": wind_pred, "hydro": hydro_pred},
            actuals=actuals
        )
        
        self.state_machine.transition_to(AgentState.IDLE)
        self.broadcast_stream_event("state_update", {"state": AgentState.IDLE})
        
        final_summary = {
            "run_id": run_id,
            "solar_generation": forecasts["solar_generation"],
            "wind_generation": forecasts["wind_generation"],
            "hydro_generation": forecasts["hydro_generation"],
            "renewable_generation": forecasts["total_renewable"],
            "renewable_score": db_data["renewable_score"],
            "confidence": gemini_result["confidence"],
            "carbon_reduction": gemini_result["carbon_reduction"],
            "risk": gemini_result["risk"],
            "reasoning": gemini_result["reasoning"],
            "recommendations": gemini_result["recommendations"],
            "timestamp": weather_data["timestamp"],
            "reflection": reflection_results,
            "decision": plan_analysis["optimal_strategy"],
            "decision_matrix": plan_analysis,
            "goal_evaluation": goal_evaluation,
            "warnings": compliance_warnings,
            "tool_outputs": tool_outputs,
            "weather": weather_data,
            "simulation": sim_results,
            "alerts": alerts_list,
            "trace": trace_record,
            "identity": self.identity.get_profile()
        }
        
        self.broadcast_stream_event("step_update", {
            "step": "✅ Renewable Strategy Ready",
            "progress": 100,
            "status": "done",
            "summary": final_summary
        })
        
        self.last_run_data = final_summary
        return final_summary
