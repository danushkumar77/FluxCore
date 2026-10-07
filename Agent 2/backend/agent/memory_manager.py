import os
import sqlite3
import json
import math
from datetime import datetime

class MemoryManager:
    def __init__(self, db_path="backend/renewable_agent.db"):
        self.db_path = db_path
        self._init_db()
        
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # 1. Forecast history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecast_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT UNIQUE,
                solar_irradiance REAL,
                cloud_cover REAL,
                wind_speed REAL,
                wind_direction REAL,
                temperature REAL,
                humidity REAL,
                rainfall REAL,
                atmospheric_pressure REAL,
                reservoir_level REAL,
                grid_demand REAL,
                battery_soc REAL,
                electricity_price REAL,
                season INTEGER,
                solar_forecast REAL,
                wind_forecast REAL,
                hydro_forecast REAL,
                renewable_score REAL,
                confidence REAL,
                carbon_reduction TEXT,
                risk TEXT,
                reasoning TEXT,
                embedding TEXT
            )
        """)
        
        # 2. Actual generation history (logged after the fact by reflection loop)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actual_history (
                forecast_id INTEGER PRIMARY KEY,
                actual_solar REAL,
                actual_wind REAL,
                actual_hydro REAL,
                timestamp TEXT,
                FOREIGN KEY (forecast_id) REFERENCES forecast_history (id)
            )
        """)
        
        # 3. Decisions & plans evaluation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                forecast_id INTEGER,
                selected_plan TEXT,
                plan_details TEXT, -- JSON string of plans evaluation
                reasoning TEXT,
                timestamp TEXT,
                FOREIGN KEY (forecast_id) REFERENCES forecast_history (id)
            )
        """)
        
        # 4. Tool executions log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tool_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tool_name TEXT,
                parameters TEXT,
                status TEXT,
                output TEXT,
                timestamp TEXT
            )
        """)
        
        # 5. Reflection logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reflections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                forecast_id INTEGER,
                solar_error REAL,
                wind_error REAL,
                hydro_error REAL,
                learning_score REAL,
                model_drift REAL,
                lessons_learned TEXT,
                timestamp TEXT,
                FOREIGN KEY (forecast_id) REFERENCES forecast_history (id)
            )
        """)
        
        conn.commit()
        conn.close()

    def store_forecast(self, data: dict) -> int:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO forecast_history (
                    timestamp, solar_irradiance, cloud_cover, wind_speed, wind_direction,
                    temperature, humidity, rainfall, atmospheric_pressure, reservoir_level,
                    grid_demand, battery_soc, electricity_price, season,
                    solar_forecast, wind_forecast, hydro_forecast, renewable_score,
                    confidence, carbon_reduction, risk, reasoning, embedding
                ) VALUES (
                    :timestamp, :solar_irradiance, :cloud_cover, :wind_speed, :wind_direction,
                    :temperature, :humidity, :rainfall, :atmospheric_pressure, :reservoir_level,
                    :grid_demand, :battery_soc, :electricity_price, :season,
                    :solar_forecast, :wind_forecast, :hydro_forecast, :renewable_score,
                    :confidence, :carbon_reduction, :risk, :reasoning, :embedding
                )
                ON CONFLICT(timestamp) DO UPDATE SET
                    solar_forecast = excluded.solar_forecast,
                    wind_forecast = excluded.wind_forecast,
                    hydro_forecast = excluded.hydro_forecast,
                    renewable_score = excluded.renewable_score,
                    confidence = excluded.confidence,
                    reasoning = excluded.reasoning,
                    embedding = excluded.embedding
            """, data)
            conn.commit()
            
            # Retrieve last insert row id or the updated id
            if cursor.lastrowid:
                return cursor.lastrowid
            else:
                cursor.execute("SELECT id FROM forecast_history WHERE timestamp = ?", (data["timestamp"],))
                row = cursor.fetchone()
                return row["id"] if row else -1
        except Exception as e:
            print(f"Error storing forecast: {e}")
            return -1
        finally:
            conn.close()

    def store_actuals(self, forecast_id: int, actual_solar: float, actual_wind: float, actual_hydro: float, timestamp: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO actual_history (forecast_id, actual_solar, actual_wind, actual_hydro, timestamp)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(forecast_id) DO UPDATE SET
                    actual_solar = excluded.actual_solar,
                    actual_wind = excluded.actual_wind,
                    actual_hydro = excluded.actual_hydro
            """, (forecast_id, actual_solar, actual_wind, actual_hydro, timestamp))
            conn.commit()
        except Exception as e:
            print(f"Error storing actuals: {e}")
        finally:
            conn.close()

    def store_decision(self, forecast_id: int, selected_plan: str, plan_details: dict, reasoning: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO decisions (forecast_id, selected_plan, plan_details, reasoning, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (forecast_id, selected_plan, json.dumps(plan_details), reasoning, datetime.utcnow().isoformat()))
            conn.commit()
        except Exception as e:
            print(f"Error storing decision: {e}")
        finally:
            conn.close()

    def store_tool_log(self, tool_name: str, parameters: dict, status: str, output: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO tool_logs (tool_name, parameters, status, output, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (tool_name, json.dumps(parameters), status, output, datetime.utcnow().isoformat()))
            conn.commit()
        except Exception as e:
            print(f"Error storing tool log: {e}")
        finally:
            conn.close()

    def store_reflection(self, forecast_id: int, solar_error: float, wind_error: float, hydro_error: float, 
                         learning_score: float, model_drift: float, lessons_learned: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO reflections (forecast_id, solar_error, wind_error, hydro_error, learning_score, model_drift, lessons_learned, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (forecast_id, solar_error, wind_error, hydro_error, learning_score, model_drift, lessons_learned, datetime.utcnow().isoformat()))
            conn.commit()
        except Exception as e:
            print(f"Error storing reflection: {e}")
        finally:
            conn.close()

    def get_tool_logs(self, limit=50):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tool_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_reflections(self, limit=20):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, f.timestamp as forecast_time, f.solar_forecast, f.wind_forecast, f.hydro_forecast,
                   a.actual_solar, a.actual_wind, a.actual_hydro
            FROM reflections r
            JOIN forecast_history f ON r.forecast_id = f.id
            JOIN actual_history a ON r.forecast_id = a.forecast_id
            ORDER BY r.timestamp DESC LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_forecast_history(self, limit=100):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT fh.*, ah.actual_solar, ah.actual_wind, ah.actual_hydro, dec.selected_plan
            FROM forecast_history fh
            LEFT JOIN actual_history ah ON fh.id = ah.forecast_id
            LEFT JOIN decisions dec ON fh.id = dec.forecast_id
            ORDER BY fh.timestamp DESC LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def search_similar_conditions(self, solar_irradiance: float, wind_speed: float, temperature: float, cloud_cover: float, limit=3):
        """
        Uses normalized Euclidean distance across core weather parameters to find historical conditions
        that match the current weather query.
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Get historical points that have both forecast and actual data (so we can learn outcomes)
        cursor.execute("""
            SELECT f.id, f.timestamp, f.solar_irradiance, f.wind_speed, f.temperature, f.cloud_cover,
                   f.solar_forecast, f.wind_forecast, f.hydro_forecast,
                   a.actual_solar, a.actual_wind, a.actual_hydro,
                   d.selected_plan, d.reasoning as decision_reasoning,
                   r.lessons_learned, r.learning_score
            FROM forecast_history f
            JOIN actual_history a ON f.id = a.forecast_id
            LEFT JOIN decisions d ON f.id = d.forecast_id
            LEFT JOIN reflections r ON f.id = r.forecast_id
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []
            
        matches = []
        for row in rows:
            # Simple Euclidean distance
            d_irrad = (solar_irradiance - row["solar_irradiance"]) / 1000.0 # scale roughly to [0, 1]
            d_wind = (wind_speed - row["wind_speed"]) / 25.0
            d_temp = (temperature - row["temperature"]) / 40.0
            d_cloud = (cloud_cover - row["cloud_cover"])
            
            # Weighted distance: Irradiance and Wind Speed are most critical
            dist = math.sqrt(0.4 * (d_irrad ** 2) + 0.4 * (d_wind ** 2) + 0.1 * (d_temp ** 2) + 0.1 * (d_cloud ** 2))
            
            row_dict = dict(row)
            row_dict["distance"] = dist
            matches.append(row_dict)
            
        # Sort by distance ascending (closer matches first)
        matches.sort(key=lambda x: x["distance"])
        return matches[:limit]

    def search_similar_vector(self, query_vector: list, limit=3) -> list:
        if not query_vector:
            return []
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT f.id, f.timestamp, f.solar_irradiance, f.wind_speed, f.temperature, f.cloud_cover,
                       f.solar_forecast, f.wind_forecast, f.hydro_forecast, f.embedding,
                       a.actual_solar, a.actual_wind, a.actual_hydro,
                       d.selected_plan, d.reasoning as decision_reasoning,
                       r.lessons_learned, r.learning_score
                FROM forecast_history f
                JOIN actual_history a ON f.id = a.forecast_id
                LEFT JOIN decisions d ON f.id = d.forecast_id
                LEFT JOIN reflections r ON f.id = r.forecast_id
                WHERE f.embedding IS NOT NULL
            """)
            rows = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching embeddings: {e}")
            rows = []
        finally:
            conn.close()

        if not rows:
            return []

        def cosine_similarity(v1, v2):
            if not v1 or not v2 or len(v1) != len(v2):
                return 0.0
            dot = sum(a*b for a,b in zip(v1, v2))
            norm_a = math.sqrt(sum(a*a for a in v1))
            norm_b = math.sqrt(sum(b*b for b in v2))
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot / (norm_a * norm_b)

        matches = []
        for row in rows:
            row_dict = dict(row)
            try:
                emb = json.loads(row_dict["embedding"])
                sim = cosine_similarity(query_vector, emb)
                row_dict["similarity"] = sim
                row_dict["distance"] = 1.0 - sim
                matches.append(row_dict)
            except Exception:
                pass

        # Sort by similarity descending (highest similarity first)
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        return matches[:limit]
