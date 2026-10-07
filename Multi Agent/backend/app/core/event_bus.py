import asyncio
import logging
import traceback
from typing import Dict, List, Callable, Awaitable, Any
from datetime import datetime
from uuid import UUID, uuid4
from app.domain.contracts.events import BaseEvent
from app.core.schema_registry import schema_registry
from app.core.config import get_settings

logger = logging.getLogger("FluxCore.EventBus")

class DeadLetterQueueRecord(BaseModel if 'BaseModel' in globals() else object):
    def __init__(self, event: dict, reason: str, failed_at: datetime = None):
        self.event = event
        self.reason = reason
        self.failed_at = failed_at or datetime.utcnow()

class EventBus:
    def __init__(self):
        # Maps event_name to a list of handler callbacks
        self._subscribers: Dict[str, List[Callable[[BaseEvent], Awaitable[None]]]] = {}
        # Priority Queue for events. Holds tuples of (priority, BaseEvent)
        self._queue = asyncio.PriorityQueue()
        # Dead Letter Queue (DLQ) for analysis/troubleshooting
        self.dlq: List[Dict[str, Any]] = []
        self._running = False
        self._worker_task: Optional[asyncio.Task] = None

    def start(self):
        """Start the background event processing loop."""
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self._process_queue_loop())
            logger.info("Event Bus loop started.")

    async def stop(self):
        """Stop the background event processing loop."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            logger.info("Event Bus loop stopped.")

    def subscribe(self, event_name: str, handler: Callable[[BaseEvent], Awaitable[None]]):
        """Subscribe to an event topic."""
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        self._subscribers[event_name].append(handler)
        logger.info(f"Handler subscribed to topic: {event_name}")

    async def publish(self, event: BaseEvent):
        """Publish an event to the queue. Validates event structure before publishing."""
        try:
            # Enforce Schema Validation at runtime
            schema_registry.validate(event.event_name, event.model_dump())
            
            # Priority queues in python pop lowest value first, so 1 = highest, 5 = lowest
            # Tuple: (priority, timestamp, event)
            await self._queue.put((event.priority, event.timestamp, event))
            logger.debug(f"Event {event.event_name} ({event.event_id}) published successfully. Priority: {event.priority}")
        except Exception as e:
            logger.error(f"Failed to publish event {event.event_name}: {e}")
            self._send_to_dlq(event.model_dump() if hasattr(event, "model_dump") else str(event), f"Publish Validation Error: {e}")

    async def _process_queue_loop(self):
        while self._running:
            try:
                priority, timestamp, event = await self._queue.get()
                await self._dispatch_event(event)
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in Event Bus queue loop: {e}")
                await asyncio.sleep(0.1)

    async def _dispatch_event(self, event: BaseEvent):
        handlers = self._subscribers.get(event.event_name, [])
        if not handlers:
            logger.warning(f"No subscribers for event: {event.event_name}")
            return

        settings = get_settings()
        max_retries = settings.EVENT_BUS_MAX_RETRIES
        backoff = settings.EVENT_BUS_RETRY_BACKOFF_SEC

        for handler in handlers:
            retries = 0
            success = False
            while retries <= max_retries and not success:
                try:
                    await handler(event)
                    success = True
                except Exception as e:
                    retries += 1
                    logger.error(
                        f"Handler execution error for event {event.event_name} (Attempt {retries}/{max_retries}): {e}\n"
                        f"{traceback.format_exc()}"
                    )
                    if retries <= max_retries:
                        await asyncio.sleep(backoff * (2 ** (retries - 1)))  # Exponential backoff
            
            if not success:
                logger.critical(f"Event {event.event_id} failed after {max_retries} retries. Routing to DLQ.")
                self._send_to_dlq(event.model_dump(), f"Handler failed repeatedly after retries. Error trace in logs.")

    def _send_to_dlq(self, event_data: Any, reason: str):
        record = {
            "event": event_data,
            "reason": reason,
            "failed_at": datetime.utcnow().isoformat(),
            "dlq_id": str(uuid4())
        }
        self.dlq.append(record)
        logger.warning(f"DLQ entry created: {record['dlq_id']} | Reason: {reason}")

# Global instance for DI
event_bus = EventBus()
