from typing import Dict, Any, List, Callable
from backend.domain.models import EventContract
from backend.event_bus.contracts.schemas import EventSchemas

# Registry of callbacks by event type
_subscribers: Dict[str, List[Callable[[EventContract], None]]] = {}
# Global log of events for observability
event_log: List[Dict[str, Any]] = []

def subscribe(event_type: str, callback: Callable[[EventContract], None]):
    if event_type not in _subscribers:
        _subscribers[event_type] = []
    _subscribers[event_type].append(callback)

def publish(event: EventContract):
    """
    Validates and publishes an event to all registered subscriber callbacks.
    """
    # Validate payload schema
    if not EventSchemas.validate_payload(event.event_type, event.payload):
        print(f"[EventBus] Rejecting event {event.event_type} due to schema mismatch.")
        return
        
    print(f"[EventBus] PUBLISH: {event.event_type} from {event.source_agent} [ID: {event.event_id}]")
    
    # Log event
    event_log.append({
        "event_id": event.event_id,
        "event_type": event.event_type,
        "timestamp": event.timestamp.isoformat() if event.timestamp else "",
        "source_agent": event.source_agent,
        "correlation_id": event.correlation_id,
        "payload": event.payload,
        "schema_version": event.schema_version
    })
    
    # Cap event log
    if len(event_log) > 200:
        event_log.pop(0)
        
    # Trigger callbacks
    if event.event_type in _subscribers:
        for cb in _subscribers[event.event_type]:
            try:
                cb(event)
            except Exception as e:
                print(f"[EventBus Error] Callback exception for {event.event_type}: {e}")
