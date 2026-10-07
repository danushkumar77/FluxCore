import logging
import asyncio
from typing import Dict, Any, List, Optional
from app.core.state_machine import AgentStateMachine
from app.domain.contracts.agent import AgentStateModel, StateTransitionModel
from app.domain.contracts.events import BaseEvent, OrchestratorCommandEvent
from app.core.event_bus import event_bus

logger = logging.getLogger("FluxCore.Orchestrator")

class AgentMetadata:
    def __init__(self, agent_instance: Any):
        self.agent_instance = agent_instance
        self.name = agent_instance.name
        self.version = agent_instance.version
        self.capabilities = agent_instance.capabilities
        self.dependencies = agent_instance.dependencies
        self.state_machine = agent_instance.state_machine
        self.is_active = False

class FluxCoreOrchestrator:
    def __init__(self):
        self._registry: Dict[str, AgentMetadata] = {}
        self._running = False

    def register_agent(self, agent_instance: Any):
        """Auto-discovers and registers a new agent capacity to the registry."""
        name = agent_instance.name
        if name in self._registry:
            logger.warning(f"Agent '{name}' is already registered. Overwriting registration.")
        
        metadata = AgentMetadata(agent_instance)
        # Register a callback to report state transitions onto the Event Bus
        metadata.state_machine.add_transition_callback(
            lambda t: asyncio.create_task(self._publish_transition_event(t))
        )
        self._registry[name] = metadata
        logger.info(f"Registered Agent: {name} (Version: {metadata.version}, Capabilities: {metadata.capabilities})")

    def get_agent_state(self, name: str) -> Optional[AgentStateModel]:
        if name in self._registry:
            return self._registry[name].state_machine.get_state_model()
        return None

    def get_all_agents(self) -> List[AgentStateModel]:
        return [meta.state_machine.get_state_model() for meta in self._registry.values()]

    async def start_agent(self, name: str):
        if name in self._registry:
            meta = self._registry[name]
            meta.is_active = True
            await meta.agent_instance.start()
            logger.info(f"Agent '{name}' started.")
        else:
            raise ValueError(f"Agent '{name}' not found in registry.")

    async def stop_agent(self, name: str):
        if name in self._registry:
            meta = self._registry[name]
            meta.is_active = False
            await meta.agent_instance.stop()
            logger.info(f"Agent '{name}' stopped.")
        else:
            raise ValueError(f"Agent '{name}' not found in registry.")


    async def restart_agent(self, name: str):
        logger.info(f"Restarting agent: {name}")
        await self.stop_agent(name)
        await asyncio.sleep(0.5)
        await self.start_agent(name)

    async def bootstrap(self):
        """Discovers and starts all core agents."""
        self._running = True
        logger.info("Orchestrator Bootstrapping...")
        # Auto-subscribe Orchestrator to Event Bus for operational coordination and conflicts
        event_bus.subscribe("grid.fault.detected", self.handle_grid_fault)
        event_bus.subscribe("economic.plan.updated", self.handle_economic_plan)
        event_bus.subscribe("battery.strategy.selected", self.handle_battery_strategy)
        
        # Start registered agents
        for agent_name in self._registry.keys():
            await self.start_agent(agent_name)

    async def shutdown(self):
        self._running = False
        logger.info("Orchestrator shutting down...")
        for agent_name in self._registry.keys():
            await self.stop_agent(agent_name)

    async def _publish_transition_event(self, transition: StateTransitionModel):
        """Publishes state transitions onto the event bus to notify dashboard and observers."""
        cmd_event = OrchestratorCommandEvent(
            producer="Orchestrator",
            payload={
                "type": "state_transition",
                "agent_name": transition.agent_name,
                "from_state": transition.from_state,
                "to_state": transition.to_state,
                "duration_ms": transition.execution_time_ms
            }
        )
        await event_bus.publish(cmd_event)

    # --- Conflict Resolution & Scheduling ---
    
    async def handle_grid_fault(self, event: BaseEvent):
        """
        Handler for grid fault event. Evaluates grid reliability status.
        High Priority: Interrupts active economic loading or battery discharge optimization if grid health is at risk.
        """
        payload = event.payload
        severity = payload.get("severity", "medium")
        asset_id = payload.get("asset_id")
        logger.warning(f"Orchestrator analyzing Grid Fault event. Severity: {severity}. Asset: {asset_id}")

        if severity in ["high", "critical"]:
            logger.critical("CRITICAL GRID FAULT DETECTED: Enforcing Reliability Override.")
            # Trigger state change or commands to Economic and Battery agents
            # High priority command overrides economic plan
            override_event = OrchestratorCommandEvent(
                producer="Orchestrator",
                priority=1, # Top priority
                payload={
                    "command": "FORCE_RELIABILITY_MODE",
                    "reason": f"Grid fault detected on asset {asset_id}",
                    "suspend_economic_trading": True,
                    "target_battery_mode": "DISCHARGE_RESERVE"
                }
            )
            await event_bus.publish(override_event)

    async def handle_economic_plan(self, event: BaseEvent):
        """Reviews economic plan against current safety rules & forecasts."""
        logger.info("Orchestrator auditing incoming Economic Plan for conflicts...")
        # Placeholder for validation against active reliability safety triggers
        # If there is a forecast outage risk, reject the economic plan to discharge below reserve
        pass

    async def handle_battery_strategy(self, event: BaseEvent):
        """Reviews battery strategy."""
        logger.info("Orchestrator auditing Battery Charge/Discharge strategy...")
        pass

# Global instance for DI
orchestrator = FluxCoreOrchestrator()
