from datetime import datetime

class AgentState:
    IDLE = "Idle"
    MONITORING = "Monitoring"
    FORECASTING = "Forecasting"
    REASONING = "Reasoning"
    PLANNING = "Planning"
    OPTIMIZING = "Optimizing"
    EXECUTING = "Executing"
    MONITORING_RESULTS = "Monitoring Results"
    REFLECTING = "Reflecting"
    RECOVERY = "Recovery"

class AgentStateMachine:
    def __init__(self, initial_state=AgentState.IDLE):
        self._current_state = initial_state
        self._listeners = []
        self._state_history = []
        self.log_state_change(None, initial_state)

    @property
    def current_state(self) -> str:
        return self._current_state

    def register_listener(self, callback):
        """
        Registers a callback to be executed when state changes.
        Callback should accept (old_state, new_state, timestamp)
        """
        self._listeners.append(callback)

    def transition_to(self, new_state: str):
        if self._current_state == new_state:
            return
        
        old_state = self._current_state
        self._current_state = new_state
        self.log_state_change(old_state, new_state)
        
        # Notify listeners
        timestamp = datetime.utcnow().isoformat()
        for listener in self._listeners:
            try:
                listener(old_state, new_state, timestamp)
            except Exception as e:
                print(f"Error executing state listener callback: {e}")

    def log_state_change(self, old_state, new_state):
        entry = {
            "old_state": old_state,
            "new_state": new_state,
            "timestamp": datetime.utcnow().isoformat()
        }
        self._state_history.append(entry)
        # Keep last 50 state changes
        if len(self._state_history) > 50:
            self._state_history.pop(0)
        print(f"[STATE MACHINE] Transitioned from {old_state} to {new_state}")

    def get_history(self):
        return self._state_history
