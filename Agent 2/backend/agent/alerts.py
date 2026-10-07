import json
from datetime import datetime

class AlertManagementSystem:
    def __init__(self, memory_manager):
        self.memory = memory_manager
        self._init_db()

    def _init_db(self):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS active_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT,
                message TEXT,
                severity TEXT, -- LOW, MEDIUM, HIGH, CRITICAL
                timestamp TEXT,
                is_acknowledged INTEGER DEFAULT 0
            )
        """)
        conn.commit()
        conn.close()

    def generate_alerts(self, weather: dict, forecasts: dict, simulation: dict, confidence: float) -> list:
        """
        Scans all operational telemetry and triggers active alerts.
        """
        alerts = []
        now_str = datetime.utcnow().isoformat()
        
        # 1. Weather alerts
        wind_speed = weather.get("wind_speed", 0.0)
        temp = weather.get("temperature", 20.0)
        if wind_speed >= 25.0:
            alerts.append({
                "source": "METEOROLOGICAL_STATION",
                "message": f"Critical storm winds detected ({wind_speed:.1f} m/s). System automatic shutdown active.",
                "severity": "CRITICAL"
            })
        elif wind_speed >= 18.0:
            alerts.append({
                "source": "METEOROLOGICAL_STATION",
                "message": f"High winds detected ({wind_speed:.1f} m/s). Wind farm pitch control limits reached.",
                "severity": "HIGH"
            })
            
        if temp >= 42.0:
            alerts.append({
                "source": "METEOROLOGICAL_STATION",
                "message": f"Excessive ambient temperature ({temp:.1f} °C). Solar array efficiency degradation alert.",
                "severity": "MEDIUM"
            })

        # 2. Asset SOH alerts
        for asset, sim_data in simulation.items():
            soh = sim_data.get("soh", 100.0)
            if soh < 85.0:
                alerts.append({
                    "source": f"ASSET_INTELLIGENCE_{asset.upper()}",
                    "message": f"{asset.capitalize()} health score is critical ({soh:.2f}% SOH). Maintenance required.",
                    "severity": "HIGH"
                })
            elif soh < 95.0:
                alerts.append({
                    "source": f"ASSET_INTELLIGENCE_{asset.upper()}",
                    "message": f"{asset.capitalize()} efficiency degradation warning ({soh:.2f}% SOH).",
                    "severity": "LOW"
                })

        # 3. Battery SOC alerts
        soc = weather.get("battery_soc", 50.0)
        if soc <= 15.0:
            alerts.append({
                "source": "BATTERY_MANAGEMENT",
                "message": f"Battery state of charge at critical low level ({soc:.1f}%). Discharging restricted.",
                "severity": "CRITICAL"
            })
        elif soc <= 25.0:
            alerts.append({
                "source": "BATTERY_MANAGEMENT",
                "message": f"Battery charge is low ({soc:.1f}%). Charge cycle prioritization recommended.",
                "severity": "MEDIUM"
            })
        elif soc >= 95.0:
            alerts.append({
                "source": "BATTERY_MANAGEMENT",
                "message": f"Battery storage bank is full ({soc:.1f}%). Directing surplus power to export lines.",
                "severity": "LOW"
            })

        # 4. Forecast confidence alerts
        if confidence < 80.0:
            alerts.append({
                "source": "FORECAST_ACCURACY",
                "message": f"Forecast confidence score has dropped to {confidence:.1f}%. High forecasting uncertainty.",
                "severity": "MEDIUM"
            })
            
        # 5. Grid Stability alerts
        demand = weather.get("grid_demand", 15000)
        total_renewable = forecasts.get("total_renewable", 0)
        net_diff = total_renewable - demand
        if net_diff < -8000:
            alerts.append({
                "source": "POWER_GRID_STABILITY",
                "message": f"Generation deficit exceeds intertie backup margins by {-net_diff:.0f} kW. Grid black-start risk.",
                "severity": "HIGH"
            })
            
        # Save to database
        self.store_alerts(alerts)
        return alerts

    def store_alerts(self, alerts: list):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        now_str = datetime.utcnow().isoformat()
        try:
            # We clear unacknowledged alerts from previous runs to avoid duplication
            # in the active view, but they are stored in history
            cursor.execute("DELETE FROM active_alerts WHERE is_acknowledged = 0")
            
            for a in alerts:
                cursor.execute("""
                    INSERT INTO active_alerts (source, message, severity, timestamp, is_acknowledged)
                    VALUES (?, ?, ?, ?, 0)
                """, (a["source"], a["message"], a["severity"], now_str))
            conn.commit()
        except Exception as e:
            print(f"Error storing alerts: {e}")
        finally:
            conn.close()

    def acknowledge_alert(self, alert_id: int):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE active_alerts SET is_acknowledged = 1 WHERE id = ?", (alert_id,))
            conn.commit()
        except Exception as e:
            print(f"Error acknowledging alert: {e}")
        finally:
            conn.close()

    def get_active(self):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM active_alerts WHERE is_acknowledged = 0 ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_history(self, limit=50):
        conn = self.memory._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM active_alerts ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
