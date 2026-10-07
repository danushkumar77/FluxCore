from sqlalchemy.orm import Session
from backend.memory.memory_engine import memory_engine
from backend.knowledge.knowledge_base import knowledge_base

class LearningService:
    def __init__(self):
        pass

    def adapt_heuristic_weights(self, db: Session, current_situation: dict) -> dict:
        """
        Retrieves similar previous decisions. If they were highly successful,
        it shifts optimization weights to replicate that strategy pattern.
        """
        similar = memory_engine.retrieve_similar_decisions(db, current_situation, limit=3)
        
        # Load baseline weights
        weights = dict(knowledge_base.optimization_constraints.get("optimization_weights", {
            "operational_cost": 1.0,
            "battery_degradation": 0.6,
            "carbon_emissions": 0.4,
            "grid_stability_penalty": 0.8
        }))
        
        if not similar:
            return weights
        
        # Check if the best similar outcome yielded high savings
        best_match = similar[0]
        action = best_match["decision_action"]
        savings = best_match["savings"]
        
        if savings > 50.0: # Highly successful previous action
            print(f"[Learning Engine] Found highly successful historic pattern: {action} (Saved ${savings:.2f}). Adapting weights...")
            
            if "CHARGE" in action:
                # Make operational cost and battery degradation lower, making charge easier
                weights["operational_cost"] = max(0.5, weights["operational_cost"] * 0.9)
                weights["battery_degradation"] = max(0.3, weights["battery_degradation"] * 0.9)
            elif "DISCHARGE" in action:
                # Boost operational cost weight to encourage saving
                weights["operational_cost"] = min(2.0, weights["operational_cost"] * 1.1)
                
        return weights

# Global singleton
learning_service = LearningService()
