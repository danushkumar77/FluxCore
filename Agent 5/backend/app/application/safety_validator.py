from typing import Dict, List, Any
from app.domain.aggregates.MaintenancePackage import MaintenancePackage
from app.domain.entities.Asset import Asset

class SafetyValidator:
    def __init__(self):
        pass

    def validate_safety(self, package: MaintenancePackage, asset: Asset) -> Dict[str, Any]:
        is_safe = True
        warnings = []
        safety_checks = {
            "isolation_procedure_active": True,
            "grounding_lines_verified": True,
            "backup_asset_available": True,
            "technician_certifications_cleared": True
        }

        asset_type = asset.type
        plan = package.selected_plan

        # Rule 1: High voltage isolation required for transformers and breakers if doing invasive repairs (Plan A, Plan D, Plan E)
        if asset_type in ["Transformer", "CircuitBreaker"] and plan in ["Plan A", "Plan D", "Plan E"]:
            # Needs manual isolation clearance check
            if "Verify electrical isolation of the target unit." not in package.safety_checklist:
                is_safe = False
                warnings.append("Electrical isolation protocol missing from safety checklist.")
                safety_checks["isolation_procedure_active"] = False

        # Rule 2: SF6 handling certification check
        if asset_type == "CircuitBreaker" and "SF6 recovery cart" in package.required_tools:
            # Need specialist technician
            has_specialist = False
            for tech in package.required_technicians:
                if "SF6 Specialist" in tech or "Senior Substation Tech" in tech:
                    has_specialist = True
            if not has_specialist:
                is_safe = False
                warnings.append("SF6 Gas handling requires a certified SF6 Specialist technician.")
                safety_checks["technician_certifications_cleared"] = False

        # Rule 3: Battery Thermal runaway isolation check
        if asset_type == "Battery" and plan == "Plan A":
            if "Isolate battery string" not in package.safety_checklist and "Confirm command dispatch received by battery controller" not in package.safety_checklist:
                is_safe = False
                warnings.append("Active battery string must be isolated at the controller before opening the container rack.")
                safety_checks["isolation_procedure_active"] = False

        # Rule 4: Transmission Line outage coordination
        if asset_type == "TransmissionLine" and plan in ["Plan A", "Plan D"]:
            # Requires grid segments backup verification
            # If current load is too high (e.g. > 500A), shutting it down is dangerous without backup routing
            load = float(asset.telemetry.get("current_load", 0.0))
            if load > 500.0:
                # We need to make sure we reduce load or switch to a backup asset
                has_backup_override = any("reduce load" in log.lower() or "backup" in log.lower() for log in package.execution_log)
                if not has_backup_override:
                    warnings.append(f"Transmission Line load is high ({load} A). Outage requires grid rerouting verification.")
                    safety_checks["backup_asset_available"] = False
                    is_safe = False

        return {
            "is_safe": is_safe,
            "warnings": warnings,
            "safety_checks": safety_checks
        }
