from enum import Enum

class AgentState(str, Enum):
    IDLE = "Idle"
    MONITORING = "Monitoring"
    MARKET_ANALYSIS = "Market Analysis"
    ECONOMIC_FORECASTING = "Economic Forecasting"
    AI_REASONING = "AI Reasoning"
    STRATEGY_PLANNING = "Strategy Planning"
    OPTIMIZATION = "Optimization"
    EXECUTION = "Execution"
    REFLECTION = "Reflection"
    LEARNING = "Learning"
    RECOVERY = "Recovery"

class AgentStateMachine:
    def __init__(self):
        self._current_state = AgentState.IDLE

    def get_state(self) -> AgentState:
        return self._current_state

    def transition_to(self, new_state: AgentState):
        """
        Transitions the agent state machine to a new state and logs it.
        """
        print(f"[Agent State Machine] Transitioning: {self._current_state.value} -> {new_state.value}")
        self._current_state = new_state

# Global singleton
state_machine = AgentStateMachine()
