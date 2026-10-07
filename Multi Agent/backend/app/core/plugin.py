import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.core.state_machine import AgentStateMachine
from app.core.event_bus import event_bus
from app.domain.contracts.events import BaseEvent

logger = logging.getLogger("FluxCore.BaseAgent")

class BaseAgent(ABC):
    def __init__(self, name: str, version: str, capabilities: List[str], dependencies: List[str] = None):
        self.name = name
        self.version = version
        self.capabilities = capabilities
        self.dependencies = dependencies or []
        self.state_machine = AgentStateMachine(name, version, capabilities)
        self._is_running = False

    @abstractmethod
    async def on_start(self):
        """Lifecycle hook called when the agent initializes."""
        pass

    @abstractmethod
    async def on_event(self, event: BaseEvent):
        """Callback triggered when the agent receives an Event Bus subscription matching its capabilities."""
        pass

    @abstractmethod
    async def on_stop(self):
        """Lifecycle hook called when the agent shuts down."""
        pass

    async def start(self):
        if not self._is_running:
            self.state_machine.transition_to("Idle", trigger="boot")
            await self.on_start()
            self._is_running = True
            logger.info(f"Agent '{self.name}' successfully activated.")

    async def stop(self):
        if self._is_running:
            self.state_machine.transition_to("Idle", trigger="shutdown")
            await self.on_stop()
            self._is_running = False
            logger.info(f"Agent '{self.name}' deactivated.")

    async def publish_event(self, event: BaseEvent):
        """Convenience wrapper to publish events onto the Event Bus."""
        await event_bus.publish(event)
