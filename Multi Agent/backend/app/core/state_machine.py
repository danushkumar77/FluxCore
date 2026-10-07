import time
import logging
from datetime import datetime
from typing import Dict, Any, List, Callable, Optional
from app.domain.contracts.agent import AgentStateModel, StateTransitionModel

logger = logging.getLogger("FluxCore.StateMachine")

class AgentStateMachine:
    VALID_STATES = {
        "Idle", "Monitoring", "Analysis", "Prediction", "Reasoning",
        "Planning", "Optimization", "Execution", "Reflection",
        "Learning", "Recovery", "Error"
    }

    def __init__(self, agent_name: str, version: str = "1.0.0", capabilities: List[str] = None):
        self.agent_name = agent_name
        self.version = version
        self.capabilities = capabilities or []
        self._current_state = "Idle"
        self._health_status = "healthy"
        self._runtime_metadata: Dict[str, Any] = {}
        self._transition_history: List[StateTransitionModel] = []
        self._on_transition_callbacks: List[Callable[[StateTransitionModel], None]] = []
        self._last_state_change = time.time()

    def add_transition_callback(self, cb: Callable[[StateTransitionModel], None]):
        self._on_transition_callbacks.append(cb)

    @property
    def current_state(self) -> str:
        return self._current_state

    @property
    def health_status(self) -> str:
        return self._health_status

    def set_health(self, status: str):
        if status in {"healthy", "degraded", "error"}:
            self._health_status = status

    def transition_to(self, target_state: str, trigger: str = "internal", metadata: Dict[str, Any] = None) -> StateTransitionModel:
        """Transitions agent state, validates the state, updates latency, and fires callbacks."""
        if target_state not in self.VALID_STATES:
            raise ValueError(f"Invalid state transition target: {target_state}")

        from_state = self._current_state
        if from_state == target_state:
            # No-op, already in state
            return None

        now = time.time()
        elapsed_ms = (now - self._last_state_change) * 1000.0
        self._last_state_change = now
        self._current_state = target_state

        # Update metadata if provided
        if metadata:
            self._runtime_metadata.update(metadata)

        # Generate transition record
        transition = StateTransitionModel(
            agent_name=self.agent_name,
            from_state=from_state,
            to_state=target_state,
            timestamp=datetime.utcnow(),
            trigger=trigger,
            execution_time_ms=elapsed_ms,
            metadata=self._runtime_metadata.copy()
        )

        self._transition_history.append(transition)
        logger.info(f"Agent '{self.agent_name}' transitioned {from_state} -> {target_state} (Trigger: {trigger}, Duration: {elapsed_ms:.1f}ms)")

        # Fire callbacks (e.g., event publishers or metrics trackers)
        for cb in self._on_transition_callbacks:
            try:
                cb(transition)
            except Exception as e:
                logger.error(f"Error in transition callback for agent {self.agent_name}: {e}")

        return transition

    def get_state_model(self) -> AgentStateModel:
        return AgentStateModel(
            agent_name=self.agent_name,
            version=self.version,
            capabilities=self.capabilities,
            current_state=self._current_state,
            health_status=self._health_status,
            last_active=datetime.utcnow(),
            runtime_metadata=self._runtime_metadata
        )

    def get_history(self) -> List[StateTransitionModel]:
        return self._transition_history
