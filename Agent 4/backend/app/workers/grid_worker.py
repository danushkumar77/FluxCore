import asyncio
import time
import uuid
import datetime
import json
from typing import Dict, Any, List, Set, Optional
from fastapi import WebSocket
from app.infrastructure.scada.scada_adapter import SCADASimulator
from app.infrastructure.repositories.repositories import (
    FileBasedGridRepository, FileBasedIncidentRepository, FileBasedTelemetryRepository, FileBasedMemoryRepository
)
from app.application.fault_detection_service import FaultDetectionService
from app.application.fault_classification_service import FaultClassificationService
from app.application.relay_intelligence_service import RelayIntelligenceService
from app.application.risk_service import GridRiskService
from app.application.safety_service import SafetyValidationService
from app.application.decision_service import GridDecisionService
from app.application.restoration_service import GridRestorationService
from app.services.gemini_service import GeminiReasoningEngine
from app.memory.incident_memory import HistoricalIncidentMemory, LessonEngine
from app.event_bus.event_schema import local_event_bus
from app.domain.aggregates.grid_aggregates import IncidentReport, RestorationPlan
from app.digital_twin.digital_twin_service import DigitalTwinService

class GridWorker:
    def __init__(self):
        # 1. SCADA and Repositories
        self.scada = SCADASimulator()
        self.grid_repo = FileBasedGridRepository(self.scada)
        self.incident_repo = FileBasedIncidentRepository()
        self.telemetry_repo = FileBasedTelemetryRepository()
        self.memory_repo = FileBasedMemoryRepository()
        self.historical_memory = HistoricalIncidentMemory()
        self.lesson_engine = LessonEngine()

        # 2. Application Services
        self.fault_detector = FaultDetectionService()
        self.fault_classifier = FaultClassificationService()
        self.relay_intel = RelayIntelligenceService()
        self.risk_service = GridRiskService()
        self.safety_service = SafetyValidationService()
        self.decision_service = GridDecisionService()
        self.restoration_service = GridRestorationService(self.grid_repo, local_event_bus)
        self.gemini_engine = GeminiReasoningEngine()

        # 3. State & Mode Control
        self.current_state = "Idle" # Idle, Monitoring, Grid Analysis, Fault Detection, Risk Assessment, Reasoning, Planning, Executing, Recovery, Reflection, Learning
        self.operator_mode = "AUTONOMOUS" # AUTONOMOUS, ASSISTED, MANUAL, EMERGENCY
        
        # Connections
        self.connections: Set[WebSocket] = set()
        self.running = False
        
        # Current active incident
        self.active_incident: Optional[IncidentReport] = None

    async def register_connection(self, websocket: WebSocket):
        self.connections.add(websocket)
        # Push initial state
        await self.broadcast_state()

    def unregister_connection(self, websocket: WebSocket):
        self.connections.remove(websocket)

    async def broadcast_state(self):
        if not self.connections:
            return
        
        topology = self.grid_repo.get_topology()
        metrics = self.risk_service.calculate_grid_metrics(topology)
        twin_payload = DigitalTwinService().generate_twin_payload(topology, self.scada.active_faults)
        
        payload = {
            "current_state": self.current_state,
            "operator_mode": self.operator_mode,
            "weather": self.scada.weather,
            "grid_metrics": metrics,
            "digital_twin": twin_payload,
            "relays": {r_id: r.dict() for r_id, r in topology.relays.items()},
            "active_faults": self.scada.active_faults,
            "active_incident": self.active_incident.dict() if self.active_incident else None,
            "recent_incidents": [inc.dict() for inc in self.incident_repo.get_all_incidents()[-5:]],
            "timeline": self.restoration_service.logs[-15:],
            "published_events": [evt.dict() for evt in local_event_bus.published_events[-10:]]
        }
        
        message = json.dumps({
            "type": "grid_update",
            "data": payload
        })
        
        # Broadcast to all websockets safely
        dead_conns = []
        for conn in self.connections:
            try:
                await conn.send_text(message)
            except Exception:
                dead_conns.append(conn)
        for dead in dead_conns:
            self.connections.remove(dead)

    async def start(self):
        self.running = True
        self.current_state = "Monitoring"
        asyncio.create_task(self._loop())

    def stop(self):
        self.running = False

    async def _loop(self):
        while self.running:
            try:
                # 1. SCADA Simulation Tick
                self.scada.step()
                topology = self.grid_repo.get_topology()

                # Log historical telemetry
                for sub_id in topology.substations.keys():
                    from app.domain.value_objects.telemetry import TelemetryFrame
                    # Construct dummy metrics for logging
                    frame = TelemetryFrame(
                        substation_id=sub_id,
                        voltage_pu=1.0,
                        current_pu=0.4,
                        frequency_hz=60.0,
                        power_factor=0.98,
                        thd_percent=0.8,
                        active_power_mw=80.0,
                        reactive_power_mvar=12.0
                    )
                    self.telemetry_repo.log_telemetry(sub_id, frame)

                # 2. Run State Machine Step
                await self._process_state_machine(topology)

                # 3. Broadcast to UIs
                await self.broadcast_state()

            except Exception as e:
                print(f"Error in grid worker cycle: {e}")
            await asyncio.sleep(1.5)

    async def _process_state_machine(self, topology: GridTopology):
        # Idle/Monitoring Check
        if self.current_state == "Monitoring":
            # Scan all lines/transformers for faults via ML engine
            fault_found = False
            faulty_asset = None
            faulty_telemetry = {}

            # Scan lines
            for line_id, line in topology.transmission_lines.items():
                detect_res = self.fault_detector.detect_fault(line.dict())
                if detect_res["status"] == "FAULTED":
                    fault_found = True
                    faulty_asset = line_id
                    faulty_telemetry = line.dict()
                    break
            
            # Scan transformers
            if not fault_found:
                for t_id, t in topology.transformers.items():
                    detect_res = self.fault_detector.detect_fault(t.dict())
                    if detect_res["status"] in ["WARNING", "FAULTED"] and t.winding_temperature > 95.0:
                        fault_found = True
                        faulty_asset = t_id
                        faulty_telemetry = t.dict()
                        break

            if fault_found:
                # Move state to Fault Detection
                self.current_state = "Fault Detection"
                await self.broadcast_state()
                await asyncio.sleep(0.5)

                # Move to Grid Analysis
                self.current_state = "Grid Analysis"
                await self.broadcast_state()
                await asyncio.sleep(0.5)

                # Run classification models
                classification = self.fault_classifier.classify_and_localize(faulty_telemetry)

                # Create Incident
                incident_id = str(uuid.uuid4())[:8]
                local_event_bus.publish("grid.fault.detected", {
                    "equipment_id": faulty_asset,
                    "telemetry": faulty_telemetry
                })

                self.active_incident = IncidentReport(
                    id=incident_id,
                    fault_detected=True,
                    fault_type=classification["fault_type"],
                    severity="CRITICAL",
                    fault_location=faulty_asset,
                    distance_km=classification["fault_location_distance_km"],
                    affected_equipment=[faulty_asset],
                    telemetry_snapshot=faulty_telemetry,
                    outage_probability=classification["outage_probability"],
                    remaining_operational_time=f"{classification['remaining_operational_hours']} Hours",
                    current_state=self.current_state
                )
                self.incident_repo.save_incident(self.active_incident)

                # Move to Risk Assessment
                self.current_state = "Risk Assessment"
                self.active_incident.current_state = self.current_state
                await self.broadcast_state()
                await asyncio.sleep(0.5)

                # Move to Reasoning
                self.current_state = "Reasoning"
                self.active_incident.current_state = self.current_state
                await self.broadcast_state()
                
                # Fetch matching memory
                similar_cases = self.historical_memory.search_similar(self.active_incident.dict())
                
                # Retrieve triggered knowledge base rules
                triggered_rules = []
                if faulty_asset.startswith("T"):
                    triggered_rules.append({
                        "rule_id": "IEEE-GRID-RULE-04",
                        "title": "Transformer Winding Overheat limit",
                        "detail": "IEEE C57.104 thermal limit exceeded"
                    })
                else:
                    triggered_rules.append({
                        "rule_id": "IEEE-50-INST-OVERCURRENT",
                        "title": "Instantaneous Overcurrent Limit",
                        "detail": "Relay pickup tripped due to current spike"
                    })

                # Call Gemini Reasoning Engine
                ai_analysis = self.gemini_engine.generate_expert_analysis(
                    telemetry=faulty_telemetry,
                    predictions=classification,
                    weather=self.scada.weather,
                    similar_memories=similar_cases,
                    rules_triggered=triggered_rules
                )

                self.active_incident.root_cause_explanation = ai_analysis["root_cause_explanation"]
                self.active_incident.ieee_rules_referenced = [r["rule_id"] for r in triggered_rules]
                
                # Move to Planning
                self.current_state = "Planning"
                self.active_incident.current_state = self.current_state
                await self.broadcast_state()
                await asyncio.sleep(0.5)

                # Generate plans A-E
                plans = self.decision_service.formulate_plans(faulty_asset, topology)
                
                # Run safety validation on all plans
                for plan in plans:
                    safety_res = self.safety_service.validate_plan(plan.steps, topology)
                    plan.safety_score = 95.0 if safety_res["safety_validation_passed"] else 30.0
                    for idx, step_res in enumerate(safety_res["step_results"]):
                        plan.steps[idx].safety_check_passed = step_res["is_safe"]

                self.active_incident.proposed_plans = plans
                optimal_plan = self.decision_service.select_optimal_plan(plans)
                self.active_incident.selected_plan_id = optimal_plan.plan_id
                self.incident_repo.save_incident(self.active_incident)

                # If AUTONOMOUS, proceed to execute automatically
                if self.operator_mode == "AUTONOMOUS":
                    await self.execute_restoration_plan(optimal_plan)

        elif self.current_state == "Executing":
            # Keep executing until finished (the execution is handled synchronously in execute_restoration_plan)
            pass

    async def execute_restoration_plan(self, plan: RestorationPlan):
        self.current_state = "Executing"
        if self.active_incident:
            self.active_incident.current_state = self.current_state
        await self.broadcast_state()

        topology = self.grid_repo.get_topology()
        local_event_bus.publish("grid.restoration.started", {"plan_id": plan.plan_id})
        
        start_time = time.time()
        
        # Execute each step of the plan
        for step in plan.steps:
            self.restoration_service.execute_step(step, topology)
            await self.broadcast_state()
            await asyncio.sleep(1.0) # Visual delay for switching animation

        # Recovery verification
        self.current_state = "Recovery"
        if self.active_incident:
            self.active_incident.current_state = self.current_state
        await self.broadcast_state()
        await asyncio.sleep(1.0)

        # Reflection
        self.current_state = "Reflection"
        if self.active_incident:
            self.active_incident.current_state = self.current_state
        await self.broadcast_state()
        await asyncio.sleep(1.0)

        # Learning
        self.current_state = "Learning"
        if self.active_incident:
            self.active_incident.current_state = self.current_state
        await self.broadcast_state()
        
        duration = (time.time() - start_time) * 1000.0
        self.lesson_engine.record_restoration_outcome(
            incident_id=self.active_incident.id if self.active_incident else "None",
            plan_name=plan.name,
            success=True,
            execution_duration_ms=duration
        )
        
        # Add current incident to memory for future search match
        if self.active_incident:
            self.historical_memory.add_incident({
                "incident_id": self.active_incident.id,
                "equipment_id": self.active_incident.affected_equipment[0] if self.active_incident.affected_equipment else "",
                "fault_type": self.active_incident.fault_type,
                "severity": self.active_incident.severity,
                "current_rms": self.active_incident.telemetry_snapshot.get("current_rms", 0.4),
                "voltage_pu": self.active_incident.telemetry_snapshot.get("voltage_pu", 1.0),
                "harmonics_thd": self.active_incident.telemetry_snapshot.get("harmonics_thd", 0.8),
                "root_cause": self.active_incident.root_cause_explanation,
                "restoration_strategy": plan.description
            })

        local_event_bus.publish("grid.restoration.completed", {"plan_id": plan.plan_id})
        
        # Reset incident and return to monitoring
        if self.active_incident:
            self.active_incident.status = "RESOLVED"
            self.incident_repo.save_incident(self.active_incident)
        
        self.active_incident = None
        self.current_state = "Monitoring"
        await self.broadcast_state()

# Global worker singleton
grid_worker = GridWorker()
