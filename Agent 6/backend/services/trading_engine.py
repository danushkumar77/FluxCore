import random
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.database.models import TradingTransaction

class TradingEngine:
    def __init__(self):
        pass

    def calculate_opportunity_score(self, buy_price: float, sell_price: float, battery_soc: float) -> float:
        """
        Computes trading opportunity score from 0 to 100 based on price spread and battery readiness.
        """
        spread = sell_price - buy_price
        if spread <= 0:
            return 0.0
        
        # High spread and medium battery SoC is perfect for arbitrage
        spread_factor = min(40.0, (spread / 0.10) * 20.0) # Cap at 40 points
        battery_readiness = (1.0 - abs(battery_soc - 0.5)) * 40.0 # Cap at 40 points
        volatility_bonus = random.uniform(5.0, 20.0)
        
        return round(min(100.0, spread_factor + battery_readiness + volatility_bonus), 1)

    def execute_market_trade(
        self,
        db: Session,
        trade_type: str,  # "BUY", "SELL"
        energy_kwh: float,
        price_per_kwh: float
    ) -> Dict[str, Any]:
        """
        Logs a simulated trade transaction in the database and returns execution receipt.
        """
        try:
            total_value = energy_kwh * price_per_kwh
            fee = total_value * 0.005 # 0.5% fee
            
            # Simple profit formula
            profit = 0.0
            if trade_type == "SELL":
                # Assuming solar/battery energy cost is less than trade price
                profit = total_value - fee - (energy_kwh * 0.08) # cost of generation
            else:
                profit = -total_value - fee
                
            transaction = TradingTransaction(
                timestamp=datetime.utcnow(),
                trade_type=trade_type,
                energy_kwh=energy_kwh,
                price_per_kwh=price_per_kwh,
                total_value=round(total_value, 2),
                profit=round(profit, 2),
                status="EXECUTED",
                risk_score=round(random.uniform(0.1, 0.4), 2),
                opportunity_score=round(random.uniform(60, 95), 1)
            )
            
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            
            return {
                "transaction_id": transaction.id,
                "timestamp": transaction.timestamp.isoformat() if transaction.timestamp else "",
                "type": transaction.trade_type,
                "energy_kwh": transaction.energy_kwh,
                "price": transaction.price_per_kwh,
                "value": transaction.total_value,
                "profit": transaction.profit,
                "status": transaction.status
            }
        except Exception as e:
            db.rollback()
            print(f"Error executing market trade: {e}")
            return {"status": "FAILED", "error": str(e)}

# Global singleton
trading_engine = TradingEngine()
