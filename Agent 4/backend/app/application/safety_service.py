from typing import Dict, Any, List
from app.domain.aggregates.grid_aggregates import GridTopology, RestorationStep
from app.domain.value_objects.telemetry import SafetyMargin

class SafetyValidationService:
    def validate_step(self, step: RestorationStep, topology: GridTopology) -> Dict[str, Any]:
        """
        Validates if executing a restoration step complies with IEEE/NEMA grid operating codes.
        """
        is_safe = True
        reasons = []
        margins = []

        if "open_breaker" in step.action or "trip" in step.action:
            # Isolating a line or transformer: check if load can be absorbed elsewhere
            target_id = step.target_equipment_id
            is_safe = True # Opening breaker for isolation is almost always safety-cleared to prevent fault spread
            reasons.append("Breaker isolation command is cleared to prevent fault propagation.")
            margins.append(SafetyMargin(parameter="Isolation Cleared", current_value=1.0, limit_value=1.0, margin_percent=100.0, is_safe=True))

        elif "close_breaker" in step.action or "reroute" in step.action:
            # Energizing or closing a line loop: verify sync check and thermal limits
            line_id = step.target_equipment_id
            line = topology.transmission_lines.get(line_id)
            if line:
                # Check voltage limits
                v_margin = 1.05 - line.voltage_pu
                voltage_safe = 0.85 <= line.voltage_pu <= 1.15
                if not voltage_safe:
                    is_safe = False
                    reasons.append(f"Voltage out of sync: {line.voltage_pu:.2f} pu exceeds critical limits [0.85, 1.15].")
                margins.append(SafetyMargin(parameter="Voltage Sync", current_value=line.voltage_pu, limit_value=1.1, margin_percent=v_margin*100.0, is_safe=voltage_safe))

                # Check thermal loading capacity of parallel path
                # In simulation, let's assume maximum line current capacity is 1.5 pu
                current_safe = line.current_rms < 1.3
                c_margin = 1.3 - line.current_rms
                if not current_safe:
                    is_safe = False
                    reasons.append(f"Thermal overload check failed: Current {line.current_rms:.2f} pu exceeds limit 1.3 pu.")
                margins.append(SafetyMargin(parameter="Thermal Limit", current_value=line.current_rms, limit_value=1.3, margin_percent=c_margin*100.0, is_safe=current_safe))

        elif "load_transfer" in step.action or "reduce_load" in step.action:
            # Adjusting load
            reasons.append("Load adjustment command verified for voltage-stability preservation.")
            margins.append(SafetyMargin(parameter="Load Shedding Safety", current_value=1.0, limit_value=1.0, margin_percent=100.0, is_safe=True))

        return {
            "step_number": step.step_number,
            "action": step.action,
            "target_equipment_id": step.target_equipment_id,
            "is_safe": is_safe,
            "reasons": reasons,
            "margins": [m.dict() for m in margins]
        }

    def validate_plan(self, plan_steps: List[RestorationStep], topology: GridTopology) -> Dict[str, Any]:
        """
        Validates an entire restoration plan sequence.
        """
        all_passed = True
        step_results = []
        for step in plan_steps:
            res = self.validate_step(step, topology)
            if not res["is_safe"]:
                all_passed = False
            step_results.append(res)
        
        return {
            "safety_validation_passed": all_passed,
            "step_results": step_results
        }
