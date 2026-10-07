import uuid
from datetime import datetime
from typing import Dict, Any
from backend.domain.models import EventContract

def create_event(event_type: str, source_agent: str, payload: Dict[str, Any], correlation_id: str = None) -> EventContract:
    """
    Factory to construct standard EventContract objects.
    """
    return EventContract(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        event_type=event_type,
        timestamp=datetime.utcnow(),
        source_agent=source_agent,
        correlation_id=correlation_id or f"corr_{uuid.uuid4().hex[:12]}",
        payload=payload,
        schema_version="1.0.0"
    )
