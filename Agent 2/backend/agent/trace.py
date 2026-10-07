import json
from datetime import datetime

class DecisionTraceSystem:
    def __init__(self, memory_manager):
        self.memory = memory_manager

    def create_trace(self, run_id: int, observation: dict, prediction: dict, memory_matches: list, 
                     rules_audited: dict, plan_analysis: dict, selected_plan: str, goal_evaluation: dict, 
                     confidence: float, reasoning: str, status: str = "AUTO_EXECUTED") -> dict:
        """
        Assembles a comprehensive audit trace log for the AI decision and writes it to SQLite.
        """
        # Strip large fields from memory matches to save space
        clean_memory = []
        for m in memory_matches[:2]:
            clean_memory.append({
                "timestamp": m.get("timestamp"),
                "distance": round(m.get("distance", 0), 4),
                "selected_plan": m.get("selected_plan"),
                "lessons_learned": m.get("lessons_learned")
            })
            
        trace_data = {
            "run_id": run_id,
            "timestamp": datetime.utcnow().isoformat(),
            "observation": observation,
            "prediction": prediction,
            "retrieved_memory": clean_memory,
            "knowledge_used": rules_audited,
            "generated_plans": plan_analysis.get("plans", {}),
            "selected_action": selected_plan,
            "goals_met": goal_evaluation,
            "confidence": confidence,
            "reasoning": reasoning,
            "status": status
        }
        
        # Save trace to database
        self.store_trace_in_db(run_id, trace_data, status)
        return trace_data

    def store_trace_in_db(self, run_id: int, trace_data: dict, status: str):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        try:
            # Ensure table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS decision_traces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id INTEGER UNIQUE,
                    timestamp TEXT,
                    trace_data TEXT,
                    status TEXT,
                    operator_comments TEXT
                )
            """)
            conn.commit()
            
            cursor.execute("""
                INSERT OR REPLACE INTO decision_traces (run_id, timestamp, trace_data, status, operator_comments)
                VALUES (?, ?, ?, ?, ?)
            """, (run_id, trace_data["timestamp"], json.dumps(trace_data), status, ""))
            conn.commit()
        except Exception as e:
            print(f"Error storing decision trace: {e}")
        finally:
            conn.close()

    def update_trace_status(self, run_id: int, status: str, comments: str = ""):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE decision_traces 
                SET status = ?, operator_comments = ?
                WHERE run_id = ?
            """, (status, comments, run_id))
            conn.commit()
        except Exception as e:
            print(f"Error updating decision trace status: {e}")
        finally:
            conn.close()

    def get_traces(self, limit=30):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        traces = []
        try:
            cursor.execute("SELECT * FROM decision_traces ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            for row in rows:
                t_dict = dict(row)
                t_dict["trace_data"] = json.loads(t_dict["trace_data"])
                traces.append(t_dict)
        except Exception as e:
            print(f"Error loading decision traces: {e}")
        finally:
            conn.close()
        return traces
