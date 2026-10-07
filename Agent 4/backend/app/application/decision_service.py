import uuid
from typing import Dict, Any, List
from app.domain.aggregates.grid_aggregates import GridTopology, RestorationPlan, RestorationStep

class GridDecisionService:
    def formulate_plans(self, fault_equipment_id: str, topology: GridTopology) -> List[RestorationPlan]:
        """
        Generates alternate recovery scenarios:
        Plan A: Isolate faulty equipment
        Plan B: Reroute power through alternate paths
        Plan C: Temporary Load Shedding
        Plan D: Request Battery storage dispatch (Agent 3 integration)
        Plan E: Request Renewable energy adjustment (Agent 2 integration)
        """
        plans = []
        is_transformer = fault_equipment_id.startswith("T")
        is_line = fault_equipment_id.startswith("L")

        # PLAN A: Isolate faulty equipment
        plan_a_steps = []
        if is_line:
            # Tripping terminal breakers to isolate line
            breakers = [b for b in topology.breakers.values() if b.associated_line_id == fault_equipment_id]
            for i, b in enumerate(breakers):
                plan_a_steps.append(RestorationStep(
                    step_number=i+1,
                    action="open_breaker",
                    target_equipment_id=b.id,
                    description=f"Trip breaker {b.name} to isolate line {fault_equipment_id} fault.",
                    rollback_command=f"close_breaker:{b.id}"
                ))
        elif is_transformer:
            # Tripping primary/secondary transformer breakers
            breakers = [b for b in topology.breakers.values() if b.associated_transformer_id == fault_equipment_id]
            for i, b in enumerate(breakers):
                plan_a_steps.append(RestorationStep(
                    step_number=i+1,
                    action="open_breaker",
                    target_equipment_id=b.id,
                    description=f"Trip breaker {b.name} to isolate transformer {fault_equipment_id} internal fault.",
                    rollback_command=f"close_breaker:{b.id}"
                ))

        plans.append(RestorationPlan(
            plan_id=str(uuid.uuid4())[:8],
            name="Plan A",
            description="Isolate faulted equipment and trip protection lockout breakers.",
            steps=plan_a_steps,
            safety_score=98.0,
            stability_impact_score=95.0,
            speed_score=99.0,
            customer_impact_score=30.0, # High customer outage impact if load is not rerouted
            cost_score=95.0,
            total_score=83.4
        ))

        # PLAN B: Reroute power through alternate corridors
        plan_b_steps = list(plan_a_steps) # Keep isolation steps
        # Rerouting strategy: close alternate line loop breakers
        if is_line and fault_equipment_id == "L1":
            # If line L1 is down, close tie-breaker B5A/B5B to route S1's load to S2
            plan_b_steps.append(RestorationStep(
                step_number=len(plan_b_steps)+1,
                action="close_breaker",
                target_equipment_id="B5A",
                description="Close S1 tie breaker B5A to route load via Line L5.",
                rollback_command="open_breaker:B5A"
            ))
            plan_b_steps.append(RestorationStep(
                step_number=len(plan_b_steps)+1,
                action="close_breaker",
                target_equipment_id="B5B",
                description="Close S2 tie breaker B5B to balance voltage profiles.",
                rollback_command="open_breaker:B5B"
            ))
        elif is_transformer and fault_equipment_id == "T1":
            # Route T1 load through autotransformer T4
            plan_b_steps.append(RestorationStep(
                step_number=len(plan_b_steps)+1,
                action="perform_load_transfer",
                target_equipment_id="T4",
                description="Transfer S1 substation feeder load to T4 Central autotransformer.",
                rollback_command="revert_load_transfer:T4"
            ))

        plans.append(RestorationPlan(
            plan_id=str(uuid.uuid4())[:8],
            name="Plan B",
            description="Isolate fault and reroute power through alternate transmission corridors.",
            steps=plan_b_steps,
            safety_score=90.0,
            stability_impact_score=85.0,
            speed_score=80.0,
            customer_impact_score=90.0, # Greatly preserves supply to customers
            cost_score=85.0,
            total_score=86.0
        ))

        # PLAN C: Temporary load shedding
        plan_c_steps = list(plan_a_steps)
        plan_c_steps.append(RestorationStep(
            step_number=len(plan_c_steps)+1,
            action="shed_noncritical_load",
            target_equipment_id=fault_equipment_id,
            description="Shed 25% of load on adjacent feeders to protect adjacent transformer units.",
            rollback_command="restore_customer_supply"
        ))

        plans.append(RestorationPlan(
            plan_id=str(uuid.uuid4())[:8],
            name="Plan C",
            description="Isolate fault and perform active load shedding to stabilize grid frequency.",
            steps=plan_c_steps,
            safety_score=95.0,
            stability_impact_score=90.0,
            speed_score=92.0,
            customer_impact_score=40.0,
            cost_score=88.0,
            total_score=81.0
        ))

        # PLAN D: Request Battery support (Agent 3)
        plan_d_steps = list(plan_b_steps)
        plan_d_steps.append(RestorationStep(
            step_number=len(plan_d_steps)+1,
            action="request_battery_support",
            target_equipment_id="Agent_3_Battery",
            description="Request 15MW battery active power injection to cover rerouting load spikes.",
            rollback_command="release_battery_support"
        ))

        plans.append(RestorationPlan(
            plan_id=str(uuid.uuid4())[:8],
            name="Plan D",
            description="Isolate fault, reroute power, and request auxiliary battery storage injection.",
            steps=plan_d_steps,
            safety_score=96.0,
            stability_impact_score=92.0,
            speed_score=78.0,
            customer_impact_score=95.0,
            cost_score=70.0,
            total_score=86.2
        ))

        # PLAN E: Renewable Dispatch adjust (Agent 2)
        plan_e_steps = list(plan_b_steps)
        plan_e_steps.append(RestorationStep(
            step_number=len(plan_e_steps)+1,
            action="request_renewable_support",
            target_equipment_id="Agent_2_Renewables",
            description="Command wind/solar generators in S3 zone to curtail generation by 10% to prevent overvoltage.",
            rollback_command="release_renewable_curtailment"
        ))

        plans.append(RestorationPlan(
            plan_id=str(uuid.uuid4())[:8],
            name="Plan E",
            description="Isolate, reroute, and adjust renewable generation profiles to mitigate overvoltage spikes.",
            steps=plan_e_steps,
            safety_score=94.0,
            stability_impact_score=90.0,
            speed_score=75.0,
            customer_impact_score=92.0,
            cost_score=82.0,
            total_score=86.6
        ))

        return plans

    def select_optimal_plan(self, plans: List[RestorationPlan]) -> RestorationPlan:
        # Sort by total score, descending
        scored_plans = sorted(plans, key=lambda x: x.total_score, reverse=True)
        return scored_plans[0]
