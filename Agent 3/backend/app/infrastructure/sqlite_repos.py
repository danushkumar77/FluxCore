import json
import sqlite3
import aiosqlite
from typing import List, Optional, Dict, Any
from datetime import datetime
import os

from backend.app.domain.entities import (
    Fleet, Site, BatteryContainer, BatteryTelemetry, 
    BatteryHealth, BatteryDecision, BatteryAlert, 
    BatteryExecution, BatteryForecast, BatteryOptimization,
    BatteryRack, BatteryModule, BatteryCell
)
from backend.app.domain.interfaces import (
    BatteryRepository, TelemetryRepository, DecisionRepository, 
    MemoryRepository, AlertRepository, StrategyRepository
)

DB_PATH = "fluxcore_bess.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS containers (
                container_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                capacity_mwh REAL NOT NULL,
                active_power_kw REAL NOT NULL,
                soc REAL NOT NULL,
                soh REAL NOT NULL,
                inverter_efficiency REAL NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                telemetry_id TEXT PRIMARY KEY,
                container_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                soc REAL NOT NULL,
                soh REAL NOT NULL,
                avg_cell_voltage REAL NOT NULL,
                avg_cell_temp REAL NOT NULL,
                charge_cycles INTEGER NOT NULL,
                current_draw_a REAL NOT NULL,
                frequency_hz REAL NOT NULL,
                grid_voltage_v REAL NOT NULL,
                ambient_temp REAL NOT NULL,
                solar_forecast_kw REAL NOT NULL,
                demand_forecast_kw REAL NOT NULL,
                market_price_usd REAL NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                decision_id TEXT PRIMARY KEY,
                container_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                selected_plan TEXT NOT NULL,
                expected_cost REAL NOT NULL,
                expected_revenue REAL NOT NULL,
                degradation_estimate REAL NOT NULL,
                renewable_utilization REAL NOT NULL,
                carbon_reduction REAL NOT NULL,
                grid_impact REAL NOT NULL,
                explanation TEXT NOT NULL,
                confidence REAL NOT NULL,
                rollback_conditions TEXT NOT NULL,
                status TEXT NOT NULL,
                correlation_id TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS executions (
                execution_id TEXT PRIMARY KEY,
                decision_id TEXT NOT NULL,
                container_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                action_type TEXT NOT NULL,
                duration_min REAL NOT NULL,
                power_kw REAL NOT NULL,
                response_code INTEGER NOT NULL,
                log_message TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS memory (
                lesson_id TEXT PRIMARY KEY,
                container_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                condition_type TEXT NOT NULL,
                decision_made TEXT NOT NULL,
                outcome TEXT NOT NULL,
                expected_vs_actual_error REAL NOT NULL,
                lesson_learned TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                container_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                severity TEXT NOT NULL,
                source TEXT NOT NULL,
                message TEXT NOT NULL,
                active INTEGER NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS optimizations (
                optimization_id TEXT PRIMARY KEY,
                decision_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                policy TEXT NOT NULL,
                weights_json TEXT NOT NULL,
                calculated_scores_json TEXT NOT NULL
            )
        """)
        await db.commit()

class SQLiteBatteryRepository(BatteryRepository):
    async def get_fleet(self) -> Fleet:
        containers = await self.get_all_containers()
        # Divide containers into mock sites for Fleet structure
        mohave_containers = [c for c in containers if "Mohave" in c.name or c.container_id == "BESS-001"]
        austin_containers = [c for c in containers if c not in mohave_containers]
        
        site1 = Site(site_id="SITE-MOHAVE", name="Mohave Solar BESS", location="Mojave Desert, CA", containers=mohave_containers)
        site2 = Site(site_id="SITE-AUSTIN", name="Austin Grid Reserve", location="Austin, TX", containers=austin_containers)
        
        return Fleet(fleet_id="FLEET-GLOBAL", name="FluxCore Global Storage Fleet", sites=[site1, site2])

    async def get_site(self, site_id: str) -> Optional[Site]:
        fleet = await self.get_fleet()
        for site in fleet.sites:
            if site.site_id == site_id:
                return site
        return None

    async def get_container(self, container_id: str) -> Optional[BatteryContainer]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM containers WHERE container_id = ?", (container_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return self._row_to_container(row)
        return None

    async def get_all_containers(self) -> List[BatteryContainer]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM containers") as cursor:
                rows = await cursor.fetchall()
                if not rows:
                    # Seed default BESS container data if empty
                    await self._seed_default_containers()
                    return await self.get_all_containers()
                return [self._row_to_container(r) for r in rows]

    async def update_container(self, container: BatteryContainer) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                UPDATE containers 
                SET name = ?, status = ?, capacity_mwh = ?, active_power_kw = ?, soc = ?, soh = ?, inverter_efficiency = ?
                WHERE container_id = ?
            """, (container.name, container.status, container.capacity_mwh, container.active_power_kw, 
                  container.soc, container.soh, container.inverter_efficiency, container.container_id))
            await db.commit()

    def _row_to_container(self, row) -> BatteryContainer:
        # Build modules & cells dynamically so Digital Twin displays nested cells
        modules = []
        for m_idx in range(4):
            cells = []
            for c_idx in range(6):
                cells.append(BatteryCell(
                    cell_id=f"CELL-{row[0]}-{m_idx}-{c_idx}",
                    voltage=3.2 + (row[5]/200.0) + (c_idx * 0.02) - (m_idx * 0.01),  # Voltages derived from SOC
                    temperature=25.0 + (10.0 * (row[5] - 50.0)/50.0) + (c_idx * 0.5) + (row[4]/250.0),  # Derived from active load
                    internal_resistance=1.8 + (c_idx * 0.1) + (100.0 - row[6])*0.05
                ))
            modules.append(BatteryModule(module_id=f"MOD-{row[0]}-{m_idx}", cells=cells))
            
        racks = [
            BatteryRack(rack_id=f"RACK-{row[0]}-0", modules=modules[:2]),
            BatteryRack(rack_id=f"RACK-{row[0]}-1", modules=modules[2:])
        ]
        
        return BatteryContainer(
            container_id=row[0],
            name=row[1],
            status=row[2],
            capacity_mwh=row[3],
            active_power_kw=row[4],
            soc=row[5],
            soh=row[6],
            inverter_efficiency=row[7],
            racks=racks
        )

    async def _seed_default_containers(self):
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO containers VALUES 
                ('BESS-001', 'Mohave Megapack Block A', 'IDLE', 2.0, 0.0, 68.0, 98.4, 0.965),
                ('BESS-002', 'Austin Powerwall Bank 1', 'IDLE', 1.5, 0.0, 42.0, 97.1, 0.960),
                ('BESS-003', 'Austin Powerwall Bank 2', 'IDLE', 1.5, 0.0, 85.0, 99.2, 0.960)
            """)
            await db.commit()

class SQLiteTelemetryRepository(TelemetryRepository):
    async def save_telemetry(self, t: BatteryTelemetry) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO telemetry VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                t.telemetry_id, t.container_id, t.timestamp.isoformat(), t.soc, t.soh,
                t.avg_cell_voltage, t.avg_cell_temp, t.charge_cycles, t.current_draw_a,
                t.frequency_hz, t.grid_voltage_v, t.ambient_temp, t.solar_forecast_kw,
                t.demand_forecast_kw, t.market_price_usd
            ))
            await db.commit()

    async def get_latest_telemetry(self, container_id: str) -> Optional[BatteryTelemetry]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT * FROM telemetry WHERE container_id = ? ORDER BY timestamp DESC LIMIT 1
            """, (container_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return self._row_to_telemetry(row)
        return None

    async def get_historical_telemetry(self, container_id: str, limit: int = 100) -> List[BatteryTelemetry]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT * FROM telemetry WHERE container_id = ? ORDER BY timestamp DESC LIMIT ?
            """, (container_id, limit)) as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_telemetry(r) for r in rows]

    def _row_to_telemetry(self, row) -> BatteryTelemetry:
        return BatteryTelemetry(
            telemetry_id=row[0],
            container_id=row[1],
            timestamp=datetime.fromisoformat(row[2]),
            soc=row[3],
            soh=row[4],
            avg_cell_voltage=row[5],
            avg_cell_temp=row[6],
            charge_cycles=row[7],
            current_draw_a=row[8],
            frequency_hz=row[9],
            grid_voltage_v=row[10],
            ambient_temp=row[11],
            solar_forecast_kw=row[12],
            demand_forecast_kw=row[13],
            market_price_usd=row[14]
        )

class SQLiteDecisionRepository(DecisionRepository):
    async def save_decision(self, d: BatteryDecision) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO decisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                d.decision_id, d.container_id, d.timestamp.isoformat(), d.selected_plan,
                d.expected_cost, d.expected_revenue, d.degradation_estimate, d.renewable_utilization,
                d.carbon_reduction, d.grid_impact, d.explanation, d.confidence, d.rollback_conditions,
                d.status, d.correlation_id
            ))
            await db.commit()

    async def get_decision(self, decision_id: str) -> Optional[BatteryDecision]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM decisions WHERE decision_id = ?", (decision_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return self._row_to_decision(row)
        return None

    async def get_historical_decisions(self, container_id: str, limit: int = 100) -> List[BatteryDecision]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT * FROM decisions WHERE container_id = ? ORDER BY timestamp DESC LIMIT ?
            """, (container_id, limit)) as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_decision(r) for r in rows]

    async def save_execution(self, e: BatteryExecution) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO executions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                e.execution_id, e.decision_id, e.container_id, e.timestamp.isoformat(),
                e.action_type, e.duration_min, e.power_kw, e.response_code, e.log_message
            ))
            await db.commit()

    async def get_historical_executions(self, container_id: str, limit: int = 100) -> List[BatteryExecution]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT * FROM executions WHERE container_id = ? ORDER BY timestamp DESC LIMIT ?
            """, (container_id, limit)) as cursor:
                rows = await cursor.fetchall()
                return [
                    BatteryExecution(
                        execution_id=r[0],
                        decision_id=r[1],
                        container_id=r[2],
                        timestamp=datetime.fromisoformat(r[3]),
                        action_type=r[4],
                        duration_min=r[5],
                        power_kw=r[6],
                        response_code=r[7],
                        log_message=r[8]
                    ) for r in rows
                ]

    def _row_to_decision(self, r) -> BatteryDecision:
        return BatteryDecision(
            decision_id=r[0],
            container_id=r[1],
            timestamp=datetime.fromisoformat(r[2]),
            selected_plan=r[3],
            expected_cost=r[4],
            expected_revenue=r[5],
            degradation_estimate=r[6],
            renewable_utilization=r[7],
            carbon_reduction=r[8],
            grid_impact=r[9],
            explanation=r[10],
            confidence=r[11],
            rollback_conditions=r[12],
            status=r[13],
            correlation_id=r[14]
        )

class SQLiteMemoryRepository(MemoryRepository):
    async def save_lesson(self, lesson: Dict[str, Any]) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO memory VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lesson.get("lesson_id"), lesson["container_id"], lesson["timestamp"],
                lesson["condition_type"], lesson["decision_made"], lesson["outcome"],
                lesson["expected_vs_actual_error"], lesson["lesson_learned"]
            ))
            await db.commit()

    async def search_lessons(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        # Simulated similarity search using SQL LIKE
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT * FROM memory 
                WHERE condition_type LIKE ? OR decision_made LIKE ? OR lesson_learned LIKE ?
                ORDER BY timestamp DESC LIMIT ?
            """, (f"%{query}%", f"%{query}%", f"%{query}%", limit)) as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_dict(r) for r in rows]

    async def get_all_lessons(self, limit: int = 100) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM memory ORDER BY timestamp DESC LIMIT ?", (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_dict(r) for r in rows]

    def _row_to_dict(self, r) -> Dict[str, Any]:
        return {
            "lesson_id": r[0],
            "container_id": r[1],
            "timestamp": r[2],
            "condition_type": r[3],
            "decision_made": r[4],
            "outcome": r[5],
            "expected_vs_actual_error": r[6],
            "lesson_learned": r[7]
        }

class SQLiteAlertRepository(AlertRepository):
    async def save_alert(self, alert: BatteryAlert) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT OR REPLACE INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                alert.alert_id, alert.container_id, alert.timestamp.isoformat(),
                alert.severity, alert.source, alert.message, 1 if alert.active else 0
            ))
            await db.commit()

    async def get_active_alerts(self) -> List[BatteryAlert]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM alerts WHERE active = 1 ORDER BY timestamp DESC") as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_alert(r) for r in rows]

    async def get_all_alerts(self, limit: int = 100) -> List[BatteryAlert]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?", (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_alert(r) for r in rows]

    async def resolve_alert(self, alert_id: str) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("UPDATE alerts SET active = 0 WHERE alert_id = ?", (alert_id,))
            await db.commit()

    def _row_to_alert(self, r) -> BatteryAlert:
        return BatteryAlert(
            alert_id=r[0],
            container_id=r[1],
            timestamp=datetime.fromisoformat(r[2]),
            severity=r[3],
            source=r[4],
            message=r[5],
            active=bool(r[6])
        )

class SQLiteStrategyRepository(StrategyRepository):
    async def save_optimization(self, opt: BatteryOptimization) -> None:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO optimizations VALUES (?, ?, ?, ?, ?, ?)
            """, (
                opt.optimization_id, opt.decision_id, opt.timestamp.isoformat(),
                opt.policy, json.dumps(opt.weights), json.dumps(opt.calculated_scores)
            ))
            await db.commit()

    async def get_historical_optimizations(self, limit: int = 100) -> List[BatteryOptimization]:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM optimizations ORDER BY timestamp DESC LIMIT ?", (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [
                    BatteryOptimization(
                        optimization_id=r[0],
                        decision_id=r[1],
                        timestamp=datetime.fromisoformat(r[2]),
                        policy=r[3],
                        weights=json.loads(r[4]),
                        calculated_scores=json.loads(r[5])
                    ) for r in rows
                ]
