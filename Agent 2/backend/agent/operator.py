import json
from datetime import datetime

class OperatorApprovalWorkflow:
    def __init__(self, memory_manager, tools_executor):
        self.memory = memory_manager
        self.tools = tools_executor
        self._init_db()

    def _init_db(self):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pending_approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER,
                action TEXT,
                parameters TEXT,
                risk_analysis TEXT,
                status TEXT, -- PENDING, APPROVED, REJECTED
                timestamp TEXT
            )
        """)
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
        conn.close()

    def queue_action(self, run_id: int, action: str, params: dict, risk_analysis: str) -> bool:
        """
        Registers a grid action into the operator queue.
        Returns True if it requires operator approval (blocks execution), False otherwise.
        """
        # Define which tools require explicit approval
        critical_actions = ["sell_excess_power", "increase_hydro_dispatch", "reduce_curtailment"]
        
        if action not in critical_actions:
            # Safe to auto-execute
            return False

        conn = self.memory._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO pending_approvals (run_id, action, parameters, risk_analysis, status, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (run_id, action, json.dumps(params), risk_analysis, "PENDING", datetime.utcnow().isoformat()))
            conn.commit()
            print(f"[OPERATOR WORKFLOW] Intercepted and queued critical action: {action} (Run #{run_id})")
        except Exception as e:
            print(f"Error queuing operator approval: {e}")
        finally:
            conn.close()
            
        return True

    def approve_action(self, approval_id: int, comment: str = "") -> dict:
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM pending_approvals WHERE id = ? AND status = 'PENDING'", (approval_id,))
            row = cursor.fetchone()
            if not row:
                return {"status": "error", "message": "Pending approval item not found or already processed."}
                
            row_dict = dict(row)
            action = row_dict["action"]
            params = json.loads(row_dict["parameters"])
            run_id = row_dict["run_id"]
            
            # 1. Execute the tool
            output = self.tools.execute_tool(action, params)
            
            # 2. Update status in pending approvals table
            cursor.execute("UPDATE pending_approvals SET status = 'APPROVED' WHERE id = ?", (approval_id,))
            conn.commit()
            
            # 3. Update status in decision traces table
            cursor.execute("""
                UPDATE decision_traces 
                SET status = 'APPROVED', operator_comments = ? 
                WHERE run_id = ?
            """, (f"Approved by Operator: {comment}", run_id))
            conn.commit()
            
            return {
                "status": "success",
                "message": f"Action '{action}' approved and executed.",
                "output": output
            }
        except Exception as e:
            print(f"Error approving action: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()

    def reject_action(self, approval_id: int, comment: str = "") -> dict:
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM pending_approvals WHERE id = ? AND status = 'PENDING'", (approval_id,))
            row = cursor.fetchone()
            if not row:
                return {"status": "error", "message": "Pending approval item not found."}
                
            row_dict = dict(row)
            run_id = row_dict["run_id"]
            action = row_dict["action"]
            
            # 1. Update status to rejected
            cursor.execute("UPDATE pending_approvals SET status = 'REJECTED' WHERE id = ?", (approval_id,))
            conn.commit()
            
            # 2. Update status in decision traces
            cursor.execute("""
                UPDATE decision_traces 
                SET status = 'REJECTED', operator_comments = ? 
                WHERE run_id = ?
            """, (f"Rejected by Operator: {comment}", run_id))
            conn.commit()
            
            # Log tool rejection to tool logs
            self.memory.store_tool_log(action, json.loads(row_dict["parameters"]), "REJECTED", f"Action aborted by operator. Reason: {comment}")
            
            return {
                "status": "success",
                "message": f"Action '{action}' rejected by operator."
            }
        except Exception as e:
            print(f"Error rejecting action: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            conn.close()

    def get_pending(self):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pending_approvals WHERE status = 'PENDING' ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_approval_history(self, limit=30):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pending_approvals ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
