import asyncio
from typing import Dict, Any, Callable, List
from event_bus.event_schema import GridEvent

class EventBus:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EventBus, cls).__new__(cls, *args, **kwargs)
            cls._instance.subscribers = {}
        return cls._instance

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)
        print(f"EventBus: Registered subscriber for '{event_type}'")

    def publish(self, event_type: str, payload: Dict[str, Any], correlation_id: str = None):
        event = GridEvent(
            event_type=event_type,
            payload=payload
        )
        if correlation_id:
            event.correlation_id = correlation_id
            
        event_dict = event.model_dump()
        
        # Dispatch to callbacks
        if event_type in self.subscribers:
            for callback in self.subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        asyncio.create_task(callback(event_dict))
                    else:
                        callback(event_dict)
                except Exception as e:
                    print(f"EventBus: Error calling subscriber for '{event_type}': {e}")
                    
        # Also dispatch to wildcard '*' subscribers
        if "*" in self.subscribers:
            for callback in self.subscribers["*"]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        asyncio.create_task(callback(event_dict))
                    else:
                        callback(event_dict)
                except Exception as e:
                    print(f"EventBus: Error calling wildcard subscriber: {e}")
                    
        return event_dict
