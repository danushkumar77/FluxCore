import asyncio
from typing import Dict, List, Callable, Any
from utils.logger import get_logger

logger = get_logger("event_bus")

class EventBus:
    """Simple asynchronous Event Bus for agent-to-agent communication and state broadcast."""
    def __init__(self):
        self.subscribers: Dict[str, List[Callable[[Any], Any]]] = {}

    def subscribe(self, event_type: str, callback: Callable[[Any], Any]):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)
        logger.debug(f"Subscriber registered for event: {event_type}")

    async def publish(self, event_type: str, data: Any):
        logger.info(f"Publishing event '{event_type}'")
        if event_type not in self.subscribers:
            return

        # Execute all subscriber callbacks concurrently
        tasks = []
        for callback in self.subscribers[event_type]:
            if asyncio.iscoroutinefunction(callback):
                tasks.append(asyncio.create_task(callback(data)))
            else:
                try:
                    callback(data)
                except Exception as e:
                    logger.error(f"Error in sync subscriber for {event_type}: {e}")

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

event_bus = EventBus()
