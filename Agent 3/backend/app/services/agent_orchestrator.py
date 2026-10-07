import asyncio
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.app.domain.entities import BatteryContainer, BatteryDecision
from backend.app.infrastructure.sqlite_repos import (
    SQLiteBatteryRepository, SQLiteTelemetryRepository, 
    SQLiteDecisionRepository, SQLiteMemoryRepository, 
    SQLiteAlertRepository, SQLiteStrategyRepository
)
from backend.app.services.fleet_service import FleetService
from backend.app.services.telemetry_service import TelemetryService
from backend.app.services.prediction_service import PredictionService
from backend.app.services.health_service import HealthService
from backend.app.services.planner_service import PlannerService
from backend.app.services.optimizer_service import OptimizerService
from backend.app.services.execution_service import ExecutionService
from backend.app.services.reflection_service import ReflectionService
from backend.app.services.memory_service import MemoryService
from backend.app.services.gemini_service import GeminiService
from backend.app.services.websocket_service import websocket_service_instance

logger = logging.getLogger("FluxCore.AgentOrchestrator")

class AgentOrchestrator:
    def __init__(self):
        # Repositories
        self.battery_repo = SQLiteBatteryRepository()
        self.telemetry_repo = SQLiteTelemetryRepository()
        self.decision_repo = SQLiteDecisionRepository()
        self.memory_repo = SQLiteMemoryRepository()
        self.alert_repo = SQLiteAlertRepository()
        self.strategy_repo = SQLiteStrategyRepository()

        # Services
        self.fleet_service = FleetService(self.battery_repo)
        self.telemetry_service = TelemetryService(self.telemetry_repo)
        self.prediction_service = PredictionService()
        self.health_service = HealthService(self.alert_repo)
        self.planner_service = PlannerService()
        self.optimizer_service = OptimizerService(self.strategy_repo)
        self.execution_service = ExecutionService(self.decision_repo)
        self.reflection_service = ReflectionService(self.memory_repo)
        self.memory_service = MemoryService(self.memory_repo)
        self.gemini_service = GeminiService()
        self.ws_service = websocket_service_instance

        # State Variables
        self.current_state = "Idle"  # Idle, Monitoring, Battery Analysis, Forecasting, Reasoning, Planning, Optimizing, Executing, Reflecting, Recovery
        self.active_policy = "MIN_COST"
        self.running = False
        self.loop_task: Optional[asyncio.Task] = None
        self.last_run_time = datetime.utcnow()
        self.latency_metrics: Dict[str, float] = {}

    def start(self):
        self.running = True
        self.loop_task = asyncio.create_task(self._orchestration_loop())
        logger.info("Agent Orchestrator background worker loops initiated.")

    def stop(self):
        self.running = False
        if self.loop_task:
            self.loop_task.cancel()
        logger.info("Agent Orchestrator background workers stopped.")

    async def set_policy(self, policy: str):
        if policy in self.optimizer_service.policies:
            self.active_policy = policy
            logger.info(f"Optimization policy updated to: {policy}")

    async def _orchestration_loop(self):
        # Sleep initially to let DB initialize
        await asyncio.sleep(2)
        
        while self.running:
            try:
                correlation_id = str(uuid.uuid4())
                containers = await self.fleet_service.get_all_containers()
                
                for container in containers:
                    await self._process_container_cycle(container, correlation_id)
                    # Yield control briefly between containers
                    await asyncio.sleep(1)
                
                # Idle state between full sweeps
                self.current_state = "Idle"
                await self._broadcast_status()
                await asyncio.sleep(10)  # Sweep every 10 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in orchestrator loop: {str(e)}", exc_info=True)
                self.current_state = "Recovery"
                await self._broadcast_status()
                await asyncio.sleep(5)  # Cooldown on recovery state

    async def _process_container_cycle(self, container: BatteryContainer, correlation_id: str):
        start_time = datetime.utcnow()
        
        # 1. Monitoring
        self.current_state = "Monitoring"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        telemetry = await self.telemetry_service.generate_simulated_telemetry(container)
        self.latency_metrics["monitoring"] = (datetime.utcnow() - t1).total_seconds() * 1000.0

        # 2. Battery Analysis
        self.current_state = "Battery Analysis"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        alerts = await self.health_service.evaluate_telemetry_health(telemetry, correlation_id)
        self.latency_metrics["analysis"] = (datetime.utcnow() - t1).total_seconds() * 1000.0

        # 3. Forecasting
        self.current_state = "Forecasting"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        health = await self.prediction_service.predict_degradation_and_rul(telemetry, correlation_id)
        # Update SOH and active variables
        await self.fleet_service.update_container_soh(container.container_id, health.soh_pct)
        self.latency_metrics["forecasting"] = (datetime.utcnow() - t1).total_seconds() * 1000.0

        # 4. Planning & Optimizing
        self.current_state = "Planning"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        strategies = await self.planner_service.generate_strategies(telemetry, correlation_id)
        self.latency_metrics["planning"] = (datetime.utcnow() - t1).total_seconds() * 1000.0
        
        self.current_state = "Optimizing"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        best_plan, opt_record = await self.optimizer_service.optimize(strategies, self.active_policy, correlation_id, correlation_id)
        self.latency_metrics["optimizing"] = (datetime.utcnow() - t1).total_seconds() * 1000.0

        # 5. Reasoning
        self.current_state = "Reasoning"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        reasoning = await self.gemini_service.analyze_and_reason(telemetry.dict(), strategies, self.active_policy)
        self.latency_metrics["reasoning"] = (datetime.utcnow() - t1).total_seconds() * 1000.0
        
        # Override plan if Gemini makes a safety suggestion
        selected_plan_id = reasoning.get("selected_plan_id", best_plan["plan_id"])
        selected_plan = next((p for p in strategies if p["plan_id"] == selected_plan_id), best_plan)
        
        # Save Decision
        decision = BatteryDecision(
            decision_id=f"{correlation_id}-{container.container_id}",
            container_id=container.container_id,
            timestamp=datetime.utcnow(),
            selected_plan=selected_plan_id,
            expected_cost=selected_plan.get("expected_cost", 0.0),
            expected_revenue=selected_plan.get("expected_revenue", 0.0),
            degradation_estimate=selected_plan.get("battery_degradation", 0.0),
            renewable_utilization=selected_plan.get("renewable_utilization", 0.0),
            carbon_reduction=selected_plan.get("carbon_reduction", 0.0),
            grid_impact=selected_plan.get("expected_grid_impact", 0.0),
            explanation=reasoning.get("explanation", selected_plan.get("engineering_explanation")),
            confidence=reasoning.get("confidence_score", selected_plan.get("confidence_score")),
            rollback_conditions=selected_plan.get("rollback_conditions", "None"),
            status="EXECUTING",
            correlation_id=correlation_id
        )
        await self.decision_repo.save_decision(decision)

        # 6. Executing
        self.current_state = "Executing"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        # Execute tools and log BESS output
        execution = await self.execution_service.execute_plan(decision, container.container_id, selected_plan["power_kw"], correlation_id)
        
        # Update Container local variables
        new_soc = container.soc
        if selected_plan["action"] == "CHARGE":
            new_soc = min(100.0, container.soc + (selected_plan["power_kw"] / 400.0) * 5.0)  # charge power relative capacity
        elif selected_plan["action"] == "DISCHARGE":
            new_soc = max(0.0, container.soc - (selected_plan["power_kw"] / 400.0) * 5.0)
            
        await self.fleet_service.update_container_telemetry(
            container.container_id, 
            active_power_kw=selected_plan["power_kw"] if selected_plan["action"] != "IDLE" else 0.0, 
            soc=new_soc, 
            status="CHARGING" if selected_plan["action"] == "CHARGE" else ("DISCHARGING" if selected_plan["action"] == "DISCHARGE" else "IDLE")
        )
        self.latency_metrics["executing"] = (datetime.utcnow() - t1).total_seconds() * 1000.0

        # 7. Reflecting
        self.current_state = "Reflecting"
        await self._broadcast_status()
        t1 = datetime.utcnow()
        lesson = await self.reflection_service.reflect(decision, telemetry, correlation_id)
        
        # Set decision status to SUCCESS
        decision.status = "SUCCESS"
        await self.decision_repo.save_decision(decision)
        
        self.latency_metrics["reflecting"] = (datetime.utcnow() - t1).total_seconds() * 1000.0
        self.last_run_time = datetime.utcnow()
        
        # Stream cycle completed message over websocket
        await self.ws_service.broadcast({
            "event": "cycle_completed",
            "correlation_id": correlation_id,
            "container_id": container.container_id,
            "selected_plan": selected_plan["name"],
            "explanation": decision.explanation,
            "confidence": decision.confidence,
            "latency_ms": self.latency_metrics
        })

    async def _broadcast_status(self):
        await self.ws_service.broadcast({
            "event": "agent_state_changed",
            "state": self.current_state,
            "policy": self.active_policy,
            "timestamp": datetime.utcnow().isoformat()
        })

# Global singleton orchestrator
agent_orchestrator = AgentOrchestrator()
