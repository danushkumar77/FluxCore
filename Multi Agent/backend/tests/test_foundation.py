import pytest
import asyncio
from datetime import datetime
from uuid import uuid4
from app.core.event_bus import EventBus
from app.core.state_machine import AgentStateMachine
from app.engines.rule_engine import RuleEngine
from app.domain.contracts.events import BaseEvent, TelemetryUpdatedEvent
from app.domain.contracts.telemetry import TelemetryMeasurement
from app.api.security import create_access_token, verify_token

@pytest.fixture
def clean_event_bus():
    eb = EventBus()
    eb.start()
    yield eb
    # Run stops in loop
    asyncio.run(eb.stop())

def test_event_bus_publish_and_subscribe():
    async def run():
        eb = EventBus()
        eb.start()
        
        received_events = []
        
        async def mock_handler(event: BaseEvent):
            received_events.append(event)
            
        eb.subscribe("telemetry.updated", mock_handler)
        
        # Create valid telemetry payload
        telemetry = {
            "measurement_id": str(uuid4()),
            "asset_id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "voltage_kv": 115.0,
            "frequency_hz": 50.0
        }
        
        event = TelemetryUpdatedEvent(
            producer="test",
            payload=telemetry
        )
        
        await eb.publish(event)
        await asyncio.sleep(0.2) # Allow async processing loop
        
        assert len(received_events) == 1
        assert received_events[0].event_name == "telemetry.updated"
        assert received_events[0].payload["voltage_kv"] == 115.0
        
        await eb.stop()

    asyncio.run(run())


def test_agent_state_machine():
    sm = AgentStateMachine(agent_name="TestAgent", version="1.0.0", capabilities=["test"])
    
    assert sm.current_state == "Idle"
    
    transition = sm.transition_to("Monitoring", trigger="test_trigger")
    
    assert sm.current_state == "Monitoring"
    assert transition.from_state == "Idle"
    assert transition.to_state == "Monitoring"
    assert transition.trigger == "test_trigger"
    
    # Assert invalid transition raises ValueError
    with pytest.raises(ValueError):
        sm.transition_to("InvalidState")

def test_rule_engine_constraints():
    re = RuleEngine()
    
    # Normal telemetry
    normal_tm = TelemetryMeasurement(
        asset_id=uuid4(),
        voltage_kv=115.0,
        frequency_hz=50.0,
        battery_soc_pct=80.0
    )
    violations = re.evaluate_telemetry(normal_tm)
    assert len(violations) == 0
    
    # Critical frequency anomaly
    critical_tm = TelemetryMeasurement(
        asset_id=uuid4(),
        voltage_kv=115.0,
        frequency_hz=48.2, # Outside nominal limits
        battery_soc_pct=80.0
    )
    violations = re.evaluate_telemetry(critical_tm)
    assert len(violations) == 1
    assert violations[0]["rule"] == "GRID-CODE-FREQ-LIMIT"
    assert violations[0]["severity"] == "critical"

def test_security_jwt_sign_verify():
    payload = {"sub": "test_operator", "role": "Grid Operator"}
    token = create_access_token(payload)
    
    assert isinstance(token, str)
    
    verified = verify_token(token)
    assert verified is not None
    assert verified.sub == "test_operator"
    assert verified.role == "Grid Operator"
    assert "grid:write" in verified.permissions
