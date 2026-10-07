import json
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database.models import AgentMemory

class MemoryEngine:
    def __init__(self):
        pass

    def _state_to_vector(self, situation: Dict[str, Any]) -> np.ndarray:
        """
        Normalize and convert a situation dictionary into a 4-dimensional feature vector:
        [normalized_price, normalized_renewable, normalized_demand, normalized_soc]
        """
        # Default scaling factors
        price = situation.get("buying_price", 0.15) / 1.0       # Price scale up to $1.00/kWh
        renew = situation.get("renewable_gen_kw", 0.0) / 1000.0  # Renewables scale up to 1000 kW
        demand = situation.get("demand_kw", 0.0) / 1000.0       # Demand scale up to 1000 kW
        soc = situation.get("battery_soc", 0.5)                 # SoC is already 0.0 to 1.0
        
        return np.array([price, renew, demand, soc], dtype=float)

    def store_memory(
        self,
        db: Session,
        state: str,
        situation: Dict[str, Any],
        decision_action: str,
        savings: float,
        outcome: str = "SUCCESSFUL",
        tags: str = ""
    ):
        """
        Persists a decision and its outcome in the database.
        """
        try:
            memory_record = AgentMemory(
                timestamp=datetime.utcnow(),
                state=state,
                situation_json=json.dumps(situation),
                decision_action=decision_action,
                savings=savings,
                outcome=outcome,
                tags=tags
            )
            db.add(memory_record)
            db.commit()
            db.refresh(memory_record)
            return memory_record
        except Exception as e:
            db.rollback()
            print(f"Error storing agent memory: {e}")
            return None

    def retrieve_similar_decisions(
        self,
        db: Session,
        current_situation: Dict[str, Any],
        limit: int = 3,
        min_similarity: float = 0.8
    ) -> List[Dict[str, Any]]:
        """
        Computes cosine similarity between the current grid state and all archived states.
        Returns the top matching historic decisions.
        """
        try:
            records = db.query(AgentMemory).all()
            if not records:
                return []
            
            curr_vec = self._state_to_vector(current_situation)
            curr_norm = np.linalg.norm(curr_vec)
            if curr_norm == 0:
                curr_norm = 1.0
                
            matches = []
            for record in records:
                try:
                    situation_dict = json.loads(record.situation_json)
                    rec_vec = self._state_to_vector(situation_dict)
                    rec_norm = np.linalg.norm(rec_vec)
                    if rec_norm == 0:
                        rec_norm = 1.0
                        
                    # Calculate Cosine Similarity
                    similarity = float(np.dot(curr_vec, rec_vec) / (curr_norm * rec_norm))
                    
                    if similarity >= min_similarity:
                        matches.append({
                            "id": record.id,
                            "timestamp": record.timestamp.isoformat() if record.timestamp else "",
                            "state": record.state,
                            "situation": situation_dict,
                            "decision_action": record.decision_action,
                            "savings": record.savings,
                            "outcome": record.outcome,
                            "similarity": similarity
                        })
                except Exception as ex:
                    print(f"Skipping corrupt memory record {record.id}: {ex}")
                    continue
            
            # Sort by similarity desc, then savings desc
            matches.sort(key=lambda x: (x["similarity"], x["savings"]), reverse=True)
            return matches[:limit]
        except Exception as e:
            print(f"Error retrieving similar memory: {e}")
            return []

# Global singleton
memory_engine = MemoryEngine()
