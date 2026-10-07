from typing import List, Dict

class KnowledgeEngine:
    """Stores grid policies, emergency rules, and historical dispatcher practices."""
    def __init__(self):
        self.policies = [
            {"id": "pol_1", "category": "Operating Policy", "rule": "Never discharge battery backup below 30% SOC reserve."},
            {"id": "pol_2", "category": "Emergency Procedures", "rule": "If grid frequency deviates +/-0.2Hz, prioritize battery stabilization immediately."},
            {"id": "pol_3", "category": "Renewable dispatch", "rule": "Curtail wind generation only when network line loading exceeds 95% capacity."},
            {"id": "pol_4", "category": "Best Practice", "rule": "Demand response triggers should precede peak industrial purchase options."}
        ]

    def get_applicable_policies(self, inputs: dict) -> List[str]:
        battery_soc = inputs.get('battery_soc', 50.0)
        freq = inputs.get('grid_frequency', 50.01)
        
        matches = []
        # Check rule matches
        if battery_soc < 35:
            matches.append(self.policies[0]["rule"])
        if abs(freq - 50.0) >= 0.1:
            matches.append(self.policies[1]["rule"])
            
        # Default policy guidance
        matches.append(self.policies[3]["rule"])
        return matches

knowledge_engine = KnowledgeEngine()
