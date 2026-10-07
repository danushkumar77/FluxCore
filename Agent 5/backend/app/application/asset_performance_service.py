import json
import os
from typing import List, Dict, Any, Tuple
from app.domain.entities.Asset import Asset
from app.domain.value_objects.HealthIndex import HealthIndex
from app.domain.value_objects.RiskScore import RiskScore

class AssetPerformanceService:
    def __init__(self, knowledge_dir="backend/knowledge"):
        self.knowledge_dir = knowledge_dir
        self.rules_cache = {}
        self._load_rules()

    def _load_rules(self):
        # Cache rule structures
        for filename in ["transformer_rules.json", "breaker_rules.json"]:
            path = os.path.join(self.knowledge_dir, filename)
            if os.path.exists(path):
                try:
                    with open(path, 'r') as f:
                        data = json.load(f)
                        self.rules_cache[data["asset_type"]] = data
                except Exception as e:
                    print(f"Error loading {filename}: {e}")

    def calculate_health_index(self, asset: Asset) -> HealthIndex:
        asset_type = asset.type
        telemetry = asset.telemetry or {}
        
        # Default start score
        score = 100.0
        primary_cause = "No issues detected"
        worst_severity = "Healthy"
        
        # 1. Check specific rule databases if available
        if asset_type in self.rules_cache:
            rules_data = self.rules_cache[asset_type]
            limits = rules_data.get("limits", {})
            
            for key, val in telemetry.items():
                if key in limits:
                    limit = limits[key]
                    warn_val = limit.get("warning")
                    crit_val = limit.get("critical")
                    comparator = limit.get("comparator", "greater_than")
                    
                    val_f = float(val)
                    if comparator == "less_than":
                        if val_f < crit_val:
                            score -= 25.0
                            primary_cause = f"Critical threshold breach on {key}: {val_f} {limit.get('unit')}"
                            worst_severity = "Critical"
                        elif val_f < warn_val:
                            score -= 10.0
                            if worst_severity != "Critical":
                                primary_cause = f"Warning threshold breach on {key}: {val_f} {limit.get('unit')}"
                                worst_severity = "Warning"
                    else:  # greater_than
                        if val_f > crit_val:
                            score -= 25.0
                            primary_cause = f"Critical threshold breach on {key}: {val_f} {limit.get('unit')}"
                            worst_severity = "Critical"
                        elif val_f > warn_val:
                            score -= 10.0
                            if worst_severity != "Critical":
                                primary_cause = f"Warning threshold breach on {key}: {val_f} {limit.get('unit')}"
                                worst_severity = "Warning"
                                
        # 2. General fallback limits (vibration, cell_temp, panel_temp)
        else:
            if asset_type == "Battery":
                cell_temp = float(telemetry.get("cell_temp", 28.0))
                soh = float(telemetry.get("soh", 100.0))
                if cell_temp > 55.0:
                    score -= 30.0
                    primary_cause = f"Battery critical cell temperature: {cell_temp}°C"
                    worst_severity = "Critical"
                elif cell_temp > 45.0:
                    score -= 15.0
                    primary_cause = f"Battery warning cell temperature: {cell_temp}°C"
                    worst_severity = "Warning"
                if soh < 80.0:
                    score -= 25.0
                    primary_cause = f"Battery SOH degradation: {soh}%"
                    worst_severity = "Critical"
            elif asset_type == "TransmissionLine":
                cond_temp = float(telemetry.get("conductor_temp", 40.0))
                sag = float(telemetry.get("sag", 1.5))
                if cond_temp > 90.0:
                    score -= 25.0
                    primary_cause = f"Conductor overheating: {cond_temp}°C"
                    worst_severity = "Critical"
                elif cond_temp > 75.0:
                    score -= 10.0
                    primary_cause = f"Conductor warm warning: {cond_temp}°C"
                    worst_severity = "Warning"
                if sag > 3.0:
                    score -= 20.0
                    primary_cause = f"Excessive sag detected: {sag}m"
                    worst_severity = "Warning"
            elif asset_type == "Renewable":
                subtype = getattr(asset, "subtype", "Wind")
                if subtype == "Wind":
                    vib = float(telemetry.get("turbine_vibration", 0.15))
                    gear_temp = float(telemetry.get("gearbox_oil_temp", 62.0))
                    if vib > 0.48:
                        score -= 25.0
                        primary_cause = f"Turbine critical vibration: {vib}g"
                        worst_severity = "Critical"
                    elif vib > 0.28:
                        score -= 10.0
                        primary_cause = f"Turbine warning vibration: {vib}g"
                        worst_severity = "Warning"
                    if gear_temp > 88.0:
                        score -= 20.0
                        primary_cause = f"Gearbox critical temp: {gear_temp}°C"
                        worst_severity = "Critical"
                else: # Solar
                    panel_temp = float(telemetry.get("panel_temp", 40.0))
                    efficiency = float(telemetry.get("inverter_efficiency", 97.0))
                    if panel_temp > 75.0:
                        score -= 15.0
                        primary_cause = f"Panel critical temp: {panel_temp}°C"
                        worst_severity = "Warning"
                    if efficiency < 90.0:
                        score -= 20.0
                        primary_cause = f"Inverter efficiency drop: {efficiency}%"
                        worst_severity = "Warning"
                        
        score = max(0.0, min(100.0, score))
        
        # Determine status
        if score >= 75.0:
            status = "Healthy"
        elif score >= 40.0:
            status = "Warning"
        else:
            status = "Critical"
            
        return HealthIndex(score=score, status=status, primary_cause=primary_cause)

    def calculate_criticality_score(self, asset: Asset) -> float:
        # Determine static base scores by asset importance
        # In a real grid, transformers at main hubs have high replacement cost & high grid importance.
        asset_id = asset.id
        
        grid_importance = 50.0  # Default
        replacement_cost = 50.0
        customer_impact = 50.0
        
        # Hub specific settings
        if "T-101" in asset_id or "Substation Alpha" in asset.station:
            grid_importance = 95.0
            replacement_cost = 90.0
            customer_impact = 85.0
        elif "L-301" in asset_id or "Grid Segment West" in asset.station:
            grid_importance = 90.0
            replacement_cost = 80.0
            customer_impact = 90.0
        elif "B-601" in asset_id:
            grid_importance = 85.0
            replacement_cost = 88.0
            customer_impact = 70.0
        elif "WT-401" in asset_id:
            grid_importance = 65.0
            replacement_cost = 70.0
            customer_impact = 50.0
        elif "PV-501" in asset_id:
            grid_importance = 55.0
            replacement_cost = 50.0
            customer_impact = 40.0
            
        # Formula: 40% grid impact, 40% replacement cost, 20% customer impact
        score = (grid_importance * 0.4) + (replacement_cost * 0.4) + (customer_impact * 0.2)
        return float(score)

    def calculate_risk_score(self, health_score: float, criticality_score: float, failure_probability: float) -> RiskScore:
        # Risk index is a combination of probability of failure and criticality impact
        # We combine ML probability of failure with the asset's criticality score.
        impact = criticality_score / 100.0
        
        # Calculate risk index out of 100
        risk_index = failure_probability * criticality_score
        
        # Determine priority
        if risk_index > 65.0 or failure_probability > 0.8:
            priority = "Critical"
        elif risk_index > 40.0 or failure_probability > 0.5:
            priority = "High"
        elif risk_index > 15.0 or failure_probability > 0.2:
            priority = "Medium"
        else:
            priority = "Low"
            
        return RiskScore(
            probability=failure_probability,
            impact=impact,
            criticality=impact,
            risk_index=float(risk_index),
            priority=priority
        )

    def generate_fleet_criticality_ranking(self, assets: List[Asset], predictions: Dict[str, float]) -> List[Dict[str, Any]]:
        rankings = []
        for asset in assets:
            health = self.calculate_health_index(asset)
            criticality = self.calculate_criticality_score(asset)
            fail_prob = predictions.get(asset.id, 0.05)
            
            risk = self.calculate_risk_score(health.score, criticality, fail_prob)
            
            rankings.append({
                "asset_id": asset.id,
                "name": asset.name,
                "type": asset.type,
                "station": asset.station,
                "health_index": health.score,
                "criticality_score": criticality,
                "risk_index": risk.risk_index,
                "priority": risk.priority
            })
            
        # Sort by risk_index descending
        rankings.sort(key=lambda x: x["risk_index"], reverse=True)
        return rankings
