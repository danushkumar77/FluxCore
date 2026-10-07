from datetime import datetime
from sqlalchemy.orm import Session
from backend.database.models import CarbonRecord
from backend.knowledge.knowledge_base import knowledge_base

class CarbonService:
    def __init__(self):
        pass

    def compute_sustainability_metrics(
        self,
        db: Session,
        grid_import_kwh: float,
        solar_gen_kwh: float,
        wind_gen_kwh: float = 0.0
    ) -> CarbonRecord:
        """
        Calculates carbon metrics, writes a database history record, and returns the entity.
        """
        total_kwh = grid_import_kwh + solar_gen_kwh + wind_gen_kwh
        if total_kwh == 0:
            renewable_pct = 100.0
        else:
            renewable_pct = ((solar_gen_kwh + wind_gen_kwh) / total_kwh) * 100.0
            
        rules = knowledge_base.carbon_rules
        intensity_grid = rules.get("grid_carbon_intensity_kg_co2_per_kwh", 0.385)
        intensity_solar = rules.get("solar_carbon_intensity_kg_co2_per_kwh", 0.045)
        
        # Grid carbon emissions if we had imported everything vs actual mix
        co2_if_all_grid = total_kwh * intensity_grid
        actual_co2 = (grid_import_kwh * intensity_grid) + (solar_gen_kwh * intensity_solar)
        
        co2_avoided = max(0.0, co2_if_all_grid - actual_co2)
        carbon_cost = actual_co2 * rules.get("carbon_credit_value_usd_per_kg", 0.025)
        
        # Green Score formula
        green_score = round(renewable_pct * 0.9 + (1.0 - (actual_co2 / (total_kwh * intensity_grid + 1e-5))) * 10.0, 1)
        green_score = max(0.0, min(100.0, green_score))
        
        try:
            record = CarbonRecord(
                timestamp=datetime.utcnow(),
                renewable_percentage=round(renewable_pct, 2),
                co2_avoided_kg=round(co2_avoided, 2),
                carbon_cost=round(carbon_cost, 2),
                green_score=round(green_score, 1)
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
        except Exception as e:
            db.rollback()
            print(f"Error logging carbon record: {e}")
            # Return transient record
            return CarbonRecord(
                timestamp=datetime.utcnow(),
                renewable_percentage=round(renewable_pct, 2),
                co2_avoided_kg=round(co2_avoided, 2),
                carbon_cost=round(carbon_cost, 2),
                green_score=round(green_score, 1)
            )

# Global singleton
carbon_service = CarbonService()
