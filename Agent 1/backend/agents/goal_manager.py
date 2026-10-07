from typing import List, Dict, Any
from agents.agent_state import agent_state_manager

class Goal:
    def __init__(self, goal_id: str, label: str, priority: int, dependencies: List[str] = None):
        self.goal_id = goal_id
        self.label = label
        self.priority = priority
        self.status = "Pending"
        self.progress = 0.0
        self.dependencies = dependencies or []

    def to_dict(self) -> dict:
        return {
            "goal_id": self.goal_id,
            "label": self.label,
            "priority": self.priority,
            "status": self.status,
            "progress": self.progress,
            "dependencies": self.dependencies
        }

class GoalManager:
    """Manages active operational goals and dependencies for the Smart Grid."""
    def __init__(self):
        self.goals: Dict[str, Goal] = {}
        self.initialize_default_goals()

    def initialize_default_goals(self):
        # Default Grid Operator Objectives
        self.add_goal(Goal("stability", "Maintain Grid Voltage/Freq Stability", 1))
        self.add_goal(Goal("shaving", "Perform Peak Load Shaving", 2, ["stability"]))
        self.add_goal(Goal("battery", "Optimize Battery State of Charge", 3))
        self.add_goal(Goal("renewables", "Maximize Renewable Penetration Ratio", 4, ["stability"]))
        self.add_goal(Goal("carbon", "Reduce Operational Carbon Index", 5, ["renewables"]))

    def add_goal(self, goal: Goal):
        self.goals[goal.goal_id] = goal
        self.sync_state()

    def update_progress(self, goal_id: str, progress: float, status: str = None):
        if goal_id in self.goals:
            g = self.goals[goal_id]
            g.progress = min(100.0, max(0.0, progress))
            if status:
                g.status = status
            elif g.progress >= 100.0:
                g.status = "Achieved"
            elif g.progress > 0.0:
                g.status = "Active"
            self.sync_state()

    def sync_state(self):
        agent_state_manager.active_goals = [g.to_dict() for g in self.goals.values()]

goal_manager = GoalManager()
