import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, Any, Callable, List

class GridEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    source_agent: str = "agent_4"
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payload: Dict[str, Any] = Field(default_factory=dict)
    schema_version: str = "1.0"

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[GridEvent], None]]] = {}
        self.published_events: List[GridEvent] = []

    def subscribe(self, event_type: str, callback: Callable[[GridEvent], None]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def publish(self, event_type: str, payload: Dict[str, Any], correlation_id: str = None) -> GridEvent:
        event = GridEvent(
            event_type=event_type,
            payload=payload,
            correlation_id=correlation_id or str(uuid.uuid4())
        )
        self.published_events.append(event)
        
        # Trigger local subscribers
        if event_type in self._subscribers:
            for cb in self._subscribers[event_type]:
                try:
                    cb(event)
                except Exception as e:
                    print(f"Error in event subscriber callback: {e}")
                    
        # Trigger wildcard subscribers
        if "*" in self._subscribers:
            for cb in self._subscribers["*"]:
                try:
                    cb(event)
                except Exception as e:
                    print(f"Error in wildcard subscriber callback: {e}")
                    
        return event

# Singleton instance for simple app-wide usage
local_event_bus = EventBus()
