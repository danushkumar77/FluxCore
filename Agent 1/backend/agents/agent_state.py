from enum import Enum
from datetime import datetime

class AgentState(str, Enum):
    IDLE = "Idle"
    MONITORING = "Monitoring"
    PREDICTING = "Predicting"
    PLANNING = "Planning"
    EXECUTING = "Executing"
    WAITING = "Waiting"
    ERROR = "Error"
    RECOVERY = "Recovery"

class AgentStateManager:
    """Manages the internal state, active plan, and status parameters of the Agent."""
    def __init__(self):
        self.state = AgentState.IDLE
        self.last_state_change = datetime.utcnow().isoformat()
        self.current_plan = []
        self.active_goals = []
        self.tool_logs = []
        self.reflections = []
        self.decision_runs = {}
        self.consulted_policies = []

    def set_state(self, new_state: AgentState):
        self.state = new_state
        self.last_state_change = datetime.utcnow().isoformat()

    def get_summary(self) -> dict:
        return {
            "state": self.state.value,
            "last_state_change": self.last_state_change,
            "current_plan": self.current_plan,
            "active_goals": self.active_goals,
            "tool_logs": self.tool_logs[-20:], # limit to last 20 executions
            "reflections": self.reflections[-10:], # limit to last 10 reflections
            "decision_runs": self.decision_runs,
            "consulted_policies": self.consulted_policies
        }

agent_state_manager = AgentStateManager()
