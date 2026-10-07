import json
import os
from typing import List, Dict, Any

class FailureModeEngine:
    def __init__(self, failure_modes_path="backend/knowledge/failure_modes.json"):
        self.filepath = failure_modes_path
        self.failure_modes = {}
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    self.failure_modes = json.load(f)
            except Exception as e:
                print(f"Error loading failure modes JSON: {e}")
                self._load_fallback()
        else:
            self._load_fallback()

    def _load_fallback(self):
        self.failure_modes = {
            "Insulation Breakdown": {
                "symptoms": ["oil_temp", "c2h2_gas", "breakdown_voltage"],
                "criticality": "Critical",
                "corrective_actions": ["Perform oil filtration", "Dehydrate paper insulation", "Visual inspection"]
            },
            "Oil Degradation": {
                "symptoms": ["moisture", "breakdown_voltage"],
                "criticality": "Warning",
                "corrective_actions": ["Schedule oil filtering", "Moisture extraction trailer"]
            },
            "Contact Erosion": {
                "symptoms": ["contact_wear", "operation_time"],
                "criticality": "Warning",
                "corrective_actions": ["Refurbish contacts", "Measure micro-ohms"]
            },
            "SF6 Leakage": {
                "symptoms": ["sf6_pressure"],
                "criticality": "Critical",
                "corrective_actions": ["Top up SF6 gas", "Leak test flange seals"]
            },
            "Blade Fatigue": {
                "symptoms": ["turbine_vibration", "blade_pitch_angle"],
                "criticality": "Critical",
                "corrective_actions": ["Pitch blades to feather", "Drone inspection of blades"]
            },
            "Thermal Runaway": {
                "symptoms": ["cell_temp", "internal_resistance"],
                "criticality": "Critical",
                "corrective_actions": ["Isolate battery pack", "Activate auxiliary cooling"]
            }
        }

    def analyze_failure_modes(self, asset_type: str, telemetry: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = []
        
        # Mapping assets to their probable failure modes
        asset_mapping = {
            "Transformer": ["Insulation Breakdown", "Oil Degradation"],
            "CircuitBreaker": ["Contact Erosion", "SF6 Leakage"],
            "TransmissionLine": [],
            "Renewable": ["Blade Fatigue"],
            "Battery": ["Thermal Runway" if "Thermal Runway" in self.failure_modes else "Thermal Runaway"]
        }
        
        modes = asset_mapping.get(asset_type, [])
        # If battery mode naming differs
        if asset_type == "Battery" and "Thermal Runaway" not in modes:
            modes = ["Thermal Runaway"]
            
        for mode_name in modes:
            if mode_name in self.failure_modes:
                mode_data = self.failure_modes[mode_name]
                symptoms = mode_data.get("symptoms", [])
                
                evidence = []
                matched = 0
                
                # Check sensor triggers
                for symptom in symptoms:
                    if symptom in telemetry:
                        val = float(telemetry[symptom])
                        is_triggered = False
                        
                        # Set trigger boundaries based on physics heuristics
                        if symptom == "oil_temp" and val > 75.0:
                            is_triggered = True
                        elif symptom == "c2h2_gas" and val > 1.5:
                            is_triggered = True
                        elif symptom == "breakdown_voltage" and val < 50.0:
                            is_triggered = True
                        elif symptom == "moisture" and val > 18.0:
                            is_triggered = True
                        elif symptom == "contact_wear" and val > 20.0:
                            is_triggered = True
                        elif symptom == "operation_time" and val > 48.0:
                            is_triggered = True
                        elif symptom == "sf6_pressure" and val < 5.8:
                            is_triggered = True
                        elif symptom == "turbine_vibration" and val > 0.25:
                            is_triggered = True
                        elif symptom == "cell_temp" and val > 42.0:
                            is_triggered = True
                        elif symptom == "internal_resistance" and val > 22.0:
                            is_triggered = True
                            
                        if is_triggered:
                            matched += 1
                            evidence.append(f"Abnormal reading on {symptom}: {val}")
                
                if matched > 0:
                    confidence = matched / len(symptoms)
                    results.append({
                        "failure_mode": mode_name,
                        "confidence": float(confidence),
                        "evidence": evidence,
                        "criticality": mode_data.get("criticality", "Warning"),
                        "recommended_action": mode_data.get("corrective_actions", ["Routine inspection"])[0]
                    })
        return results
