import uuid
import random
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import OptimizationHistory

class ExecutionService:
    def __init__(self):
        pass

    def _log_execution(
        self,
        db: Session,
        action: str,
        demand: float,
        solar: float,
        soc: float,
        price: float,
        savings: float,
        confidence: float
    ) -> Dict[str, Any]:
        """
        Helper to log operations directly into the database.
        """
        action_id = f"act_{uuid.uuid4().hex[:8]}"
        try:
            history = OptimizationHistory(
                timestamp=datetime.utcnow(),
                action_taken=action,
                demand_kw=demand,
                solar_gen_kw=solar,
                battery_soc=soc,
                grid_price=price,
                total_cost=round(max(0.0, demand - solar) * price, 2),
                savings=round(savings, 2),
                status="SUCCESS",
                confidence=confidence
            )
            db.add(history)
            db.commit()
            db.refresh(history)
            return {
                "action_id": action_id,
                "timestamp": history.timestamp.isoformat() if history.timestamp else "",
                "action": action,
                "expected_savings": round(savings, 2),
                "actual_result": "SUCCESS",
                "confidence": confidence
            }
        except Exception as e:
            db.rollback()
            print(f"Error in execution logging: {e}")
            return {
                "action_id": action_id,
                "timestamp": datetime.utcnow().isoformat(),
                "action": action,
                "expected_savings": round(savings, 2),
                "actual_result": "FAILED",
                "confidence": confidence
            }

    # Autonomous execution controls
    def buy_energy(self, db: Session, kwh: float, price: float, confidence: float) -> Dict[str, Any]:
        return self._log_execution(db, f"BUY_GRID_ENERGY ({kwh:.1f} kWh)", kwh, 0.0, 0.0, price, 0.0, confidence)

    def sell_energy(self, db: Session, kwh: float, price: float, confidence: float) -> Dict[str, Any]:
        savings = kwh * price
        return self._log_execution(db, f"SELL_GRID_ENERGY ({kwh:.1f} kWh)", 0.0, kwh, 0.0, price, savings, confidence)

    def charge_battery(self, db: Session, rate_kw: float, price: float, confidence: float) -> Dict[str, Any]:
        # Charging incurs grid cost now, but saves money later (represented as expected future savings)
        expected_future_savings = rate_kw * 0.15 # Estimate differential arbitrage
        return self._log_execution(db, f"CHARGE_BATTERY ({rate_kw:.1f} kW)", rate_kw, 0.0, 0.5, price, -rate_kw * price + expected_future_savings, confidence)

    def discharge_battery(self, db: Session, rate_kw: float, price: float, confidence: float) -> Dict[str, Any]:
        # Discharging avoids importing expensive grid energy
        savings = rate_kw * price
        return self._log_execution(db, f"DISCHARGE_BATTERY ({rate_kw:.1f} kW)", 0.0, 0.0, 0.5, price, savings, confidence)

    def shift_load(self, db: Session, load_kw: float, duration_hours: float, price: float, confidence: float) -> Dict[str, Any]:
        # Shifting load from peak to off-peak
        savings = load_kw * duration_hours * 0.22 # spread rate savings
        return self._log_execution(db, f"SHIFT_LOAD ({load_kw:.1f} kW for {duration_hours}h)", load_kw, 0.0, 0.0, price, savings, confidence)

    def reduce_peak_demand(self, db: Session, reduced_kw: float, confidence: float) -> Dict[str, Any]:
        # Reduces demand charges
        savings = reduced_kw * 18.50 # Demand rate
        return self._log_execution(db, f"REDUCE_PEAK_DEMAND ({reduced_kw:.1f} kW)", reduced_kw, 0.0, 0.0, 0.0, savings, confidence)

    def increase_renewable_usage(self, db: Session, kwh: float, confidence: float) -> Dict[str, Any]:
        # Captures environmental savings
        savings = kwh * 0.025 # green incentive
        return self._log_execution(db, f"INCREASE_RENEWABLE_USAGE ({kwh:.1f} kWh)", 0.0, kwh, 0.0, 0.0, savings, confidence)

    def activate_energy_trade(self, db: Session, trade_id: int, profit: float, confidence: float) -> Dict[str, Any]:
        return self._log_execution(db, f"ACTIVATE_ENERGY_TRADE (ID: {trade_id})", 0.0, 0.0, 0.0, 0.0, profit, confidence)

    def generate_cost_report(self, db: Session) -> Dict[str, Any]:
        # Query total savings in optimization history
        try:
            records = db.query(OptimizationHistory).all()
            total_savings = sum(r.savings for r in records if r.savings)
            total_cost = sum(r.total_cost for r in records if r.total_cost)
            return {
                "report_timestamp": datetime.utcnow().isoformat(),
                "cycles_recorded": len(records),
                "total_operating_cost": round(total_cost, 2),
                "accumulated_savings": round(total_savings, 2),
                "efficiency_gain_pct": round((total_savings / (total_cost + total_savings + 1e-5)) * 100, 2)
            }
        except Exception as e:
            return {"error": str(e)}

    def notify_operator(self, subject: str, message: str) -> Dict[str, Any]:
        print(f"[Operator Notification] ALERT: {subject} | Details: {message}")
        return {
            "notification_sent": True,
            "timestamp": datetime.utcnow().isoformat(),
            "subject": subject
        }

# Global singleton
execution_service = ExecutionService()
