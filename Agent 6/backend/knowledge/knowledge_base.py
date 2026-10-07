import os
import json
from typing import Dict, Any

class KnowledgeBase:
    def __init__(self):
        self.base_dir = os.path.dirname(__file__)
        self.market_rules = self._load_json("electricity_market_rules.json")
        self.tariff_rules = self._load_json("tariff_rules.json")
        self.trading_rules = self._load_json("energy_trading_rules.json")
        self.carbon_rules = self._load_json("carbon_rules.json")
        self.optimization_constraints = self._load_json("optimization_constraints.json")
        self.grid_operation_rules = self._load_json("grid_operation_rules.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        path = os.path.join(self.base_dir, filename)
        if not os.path.exists(path):
            return {}
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading rule file {filename}: {e}")
            return {}

    def get_tariff_for_hour(self, hour: int, month: int) -> Dict[str, float]:
        """
        Determines the active buying and selling rate based on TOU schedules in tariff_rules.json.
        """
        if not self.tariff_rules:
            return {"buy": 0.15, "sell": 0.05}
        
        # Decide season
        is_summer = month in self.tariff_rules.get("seasons", {}).get("summer", {}).get("months", [6,7,8,9])
        season_key = "summer" if is_summer else "winter"
        season_data = self.tariff_rules.get("seasons", {}).get(season_key, {})
        
        # Check Peak
        if hour in season_data.get("peak", {}).get("hours", []):
            return {
                "buy": season_data["peak"]["buy_rate"],
                "sell": season_data["peak"]["sell_rate"],
                "tier": "PEAK"
            }
        # Check Off-Peak
        elif hour in season_data.get("off_peak", {}).get("hours", []):
            return {
                "buy": season_data["off_peak"]["buy_rate"],
                "sell": season_data["off_peak"]["sell_rate"],
                "tier": "OFF_PEAK"
            }
        # Default Shoulder
        else:
            return {
                "buy": season_data.get("shoulder", {}).get("buy_rate", 0.20),
                "sell": season_data.get("shoulder", {}).get("sell_rate", 0.06),
                "tier": "SHOULDER"
            }

    def get_carbon_avoided(self, renewable_kwh: float, grid_import_avoided_kwh: float) -> float:
        """
        Calculates CO2 avoided in kg.
        """
        intensity_grid = self.carbon_rules.get("grid_carbon_intensity_kg_co2_per_kwh", 0.385)
        # Avoided CO2 is the difference between grid production and clean solar/wind
        return max(0.0, grid_import_avoided_kwh * intensity_grid)

# Global singleton
knowledge_base = KnowledgeBase()
