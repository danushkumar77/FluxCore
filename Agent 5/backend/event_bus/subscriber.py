# Event bus subscriber utilities for Agent 5
from event_bus.publisher import EventBus

def subscribe_to_event(event_type: str):
    """
    Decorator to register an event handler on the singleton EventBus.
    """
    def decorator(func):
        bus = EventBus()
        bus.subscribe(event_type, func)
        return func
    return decorator
