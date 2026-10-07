import requests
import random
from datetime import datetime

class WeatherClient:
    def __init__(self, lat=39.7392, lon=-104.9903):
        # Coordinates default to NREL region near Golden/Denver, Colorado
        self.lat = lat
        self.lon = lon
        self.api_url = "https://api.open-meteo.com/v1/forecast"

    def fetch_live_weather(self) -> dict:
        """
        Fetches live weather from Open-Meteo API.
        Falls back to a realistic weather generator if the API is offline.
        """
        try:
            params = {
                "latitude": self.lat,
                "longitude": self.lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,rain,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,shortwave_radiation",
                "timezone": "auto"
            }
            
            response = requests.get(self.api_url, params=params, timeout=5)
            if response.status_code == 200:
                res_data = response.json()
                curr = res_data.get("current", {})
                
                # Open-Meteo returns cloud cover in %, shortwave radiation in W/m2, wind speed in km/h
                # We need cloud cover in 0.0 - 1.0, and wind speed in m/s (1 km/h = 0.2778 m/s)
                cloud_cover_percent = curr.get("cloud_cover", 0.0)
                wind_speed_kmh = curr.get("wind_speed_10m", 0.0)
                
                return {
                    "source": "Open-Meteo API",
                    "timestamp": curr.get("time", datetime.utcnow().isoformat()),
                    "solar_irradiance": float(curr.get("shortwave_radiation", 0.0)),
                    "cloud_cover": float(cloud_cover_percent) / 100.0,
                    "wind_speed": float(wind_speed_kmh) * 0.27778, # convert to m/s
                    "wind_direction": float(curr.get("wind_direction_10m", 0.0)),
                    "temperature": float(curr.get("temperature_2m", 15.0)),
                    "humidity": float(curr.get("relative_humidity_2m", 50.0)),
                    "rainfall": float(curr.get("precipitation", 0.0)),
                    "atmospheric_pressure": float(curr.get("pressure_msl", 1013.25)),
                    "reservoir_level": 80.0 + random.uniform(-1, 1), # Reservoirs change slowly
                    "grid_demand": 14000.0 + random.uniform(-2000, 2000),
                    "battery_soc": 55.0 + random.uniform(-5, 5),
                    "electricity_price": 42.0 + random.uniform(-10, 15)
                }
        except Exception as e:
            print(f"Weather API unavailable, launching fallback simulator. Error: {e}")
            
        return self._generate_fallback_weather()

    def _generate_fallback_weather(self) -> dict:
        """
        Generates realistic Colorado-climate weather metrics as a fallback.
        """
        now = datetime.now()
        hour = now.hour
        month = now.month
        
        # Approximate seasonal profiles
        is_summer = month in [6, 7, 8]
        temp_base = 25 if is_summer else 5
        solar_max = 950 if is_summer else 450
        
        # Diurnal temp cycle
        temp = temp_base + 8.0 * np.sin(2 * np.pi * (hour - 9) / 24.0) + random.uniform(-2, 2)
        
        # Solar irradiance (bell curve during day, 0 at night)
        if 6 <= hour <= 18:
            # hour scale 0 to 1
            h_scale = (hour - 6) / 12.0
            solar_irradiance = solar_max * np.sin(h_scale * np.pi) * random.uniform(0.8, 1.0)
            cloud_cover = random.uniform(0.1, 0.4)
        else:
            solar_irradiance = 0.0
            cloud_cover = random.uniform(0.0, 0.2)
            
        wind_speed = random.weibullvariate(7.5, 2.0) # Weibull distribution of wind
        wind_direction = random.uniform(0, 360)
        humidity = max(10.0, min(100.0, 80.0 - (temp - temp_base) * 2.5 + random.uniform(-5, 5)))
        rainfall = random.choice([0.0] * 10 + [random.uniform(0.1, 2.0)]) if cloud_cover > 0.6 else 0.0
        
        return {
            "source": "Colorado Fallback Simulator",
            "timestamp": now.isoformat(),
            "solar_irradiance": round(solar_irradiance, 2),
            "cloud_cover": round(cloud_cover, 4),
            "wind_speed": round(wind_speed, 2),
            "wind_direction": round(wind_direction, 1),
            "temperature": round(temp, 2),
            "humidity": round(humidity, 1),
            "rainfall": round(rainfall, 3),
            "atmospheric_pressure": round(1013.25 + random.uniform(-5, 5), 2),
            "reservoir_level": round(75.0 + random.uniform(-2, 2), 2),
            "grid_demand": round(15000.0 + 3000 * np.sin(2 * np.pi * hour / 24.0) + random.uniform(-500, 500), 2),
            "battery_soc": round(50.0 + random.uniform(-10, 10), 2),
            "electricity_price": round(45.0 + 15.0 * np.sin(2 * np.pi * (hour - 18) / 24.0) + random.uniform(-5, 5), 2)
        }

# Dummy import helper to avoid import error in fallback script
import numpy as np
