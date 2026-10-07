import asyncio
import logging
import uuid
import fnmatch
from typing import Dict, Any, List, Callable, Awaitable
from datetime import datetime
from pydantic import BaseModel, Field

# Setup logging
logger = logging.getLogger("FluxCore.EventBus")

class EventContract(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: str
    source_agent: str = "fluxcore.agent_3"
    payload: Dict[str, Any]
    schema_version: str = "1.0.0"

class EventBus:
    def __init__(self):
        # Maps patterns (e.g. "battery.*") to lists of subscriber callbacks
        self._subscribers: Dict[str, List[Callable[[EventContract], Awaitable[None]]]] = {}
        self._history: List[EventContract] = []
        self._max_history = 500
        
    def subscribe(self, pattern: str, callback: Callable[[EventContract], Awaitable[None]]):
        if pattern not in self._subscribers:
            self._subscribers[pattern] = []
        self._subscribers[pattern].append(callback)
        logger.info(f"Subscribed callback to pattern: {pattern}")
        
    async def publish(self, event: EventContract):
        # Store in event history
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)
            
        logger.debug(f"Publishing event {event.event_type} [CID: {event.correlation_id}]")
        
        tasks = []
        for pattern, callbacks in self._subscribers.items():
            if fnmatch.fnmatch(event.event_type, pattern):
                for cb in callbacks:
                    tasks.append(self._safe_execute(cb, event))
                    
        if tasks:
            await asyncio.gather(*tasks)

    async def _safe_execute(self, callback: Callable[[EventContract], Awaitable[None]], event: EventContract):
        try:
            await callback(event)
        except Exception as e:
            logger.error(f"Error handling event {event.event_type} in callback {callback.__name__}: {str(e)}", exc_info=True)

    def get_event_history(self, limit: int = 100) -> List[EventContract]:
        return self._history[-limit:]

# Singleton event bus instance
event_bus_instance = EventBus()
