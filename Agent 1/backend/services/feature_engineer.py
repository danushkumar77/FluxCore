"""Feature engineering service for the Demand Forecast Agent.

Generates both raw and engineered features from preprocessed input data,
matching the exact feature vector expected by the trained XGBoost model.
"""

import math
from config.settings import settings


class FeatureEngineer:
    """Generates the complete feature set for ML prediction."""

    def engineer_features(self, data: dict) -> dict:
        """
        Generate all features (raw + engineered) from preprocessed input data.

        Returns a dict containing all 45 features matching FEATURE_COLUMNS.
        """
        features = {}

        # --- Raw features (pass through from input) ---
        features['hour'] = data.get('hour', 12)
        features['minute'] = data.get('minute', 0)
        features['month'] = data.get('month', 6)
        features['year'] = data.get('year', 2025)
        features['weekday'] = data.get('weekday', 0)
        features['is_weekend'] = int(data.get('is_weekend', 0))
        features['is_holiday'] = int(data.get('is_holiday', 0))
        features['season'] = data.get('season', 1)
        features['temperature'] = data.get('temperature', 25)
        features['humidity'] = data.get('humidity', 50)
        features['wind_speed'] = data.get('wind_speed', 10)
        features['rainfall'] = data.get('rainfall', 0)
        features['solar_irradiance'] = data.get('solar_irradiance', 500)
        features['atmospheric_pressure'] = data.get('atmospheric_pressure', 1013.25)
        features['current_load'] = data.get('current_load', 20000)
        features['previous_hour_load'] = data.get('previous_hour_load', 20000)
        features['previous_day_load'] = data.get('previous_day_load', 20000)
        features['grid_frequency'] = data.get('grid_frequency', 50.0)
        features['voltage'] = data.get('voltage', 230)
        features['power_factor'] = data.get('power_factor', 0.95)
        features['solar_generation'] = data.get('solar_generation', 0)
        features['wind_generation'] = data.get('wind_generation', 0)
        features['hydro_generation'] = data.get('hydro_generation', 0)
        features['renewable_percentage'] = data.get('renewable_percentage', 30)
        features['battery_soc'] = data.get('battery_soc', 50)
        features['available_storage'] = data.get('available_storage', 500)
        features['electricity_price'] = data.get('electricity_price', 50)
        features['demand_response_event'] = int(data.get('demand_response_event', 0))

        # --- Engineered features ---
        cur_load = features['current_load']
        prev_1h = features['previous_hour_load']
        prev_24h = features['previous_day_load']
        temp = features['temperature']
        hour = features['hour']
        month = features['month']
        weekday = features['weekday']
        solar = features['solar_generation']
        wind_gen = features['wind_generation']
        hydro = features['hydro_generation']
        ren_total = solar + wind_gen + hydro

        features['load_change_1h'] = cur_load - prev_1h
        features['load_change_24h'] = cur_load - prev_24h
        features['demand_growth_rate'] = ((cur_load - prev_1h) / max(prev_1h, 1)) * 100
        features['temperature_index'] = abs(temp - 22)
        features['temp_squared'] = temp ** 2
        features['renewable_ratio'] = ren_total / max(cur_load, 1)
        features['net_load'] = cur_load - ren_total
        features['battery_utilization'] = (100 - features['battery_soc']) / 100
        features['peak_hour'] = 1 if (9 <= hour <= 12) or (17 <= hour <= 21) else 0
        features['off_peak'] = 1 if (0 <= hour <= 5) else 0
        features['hour_sin'] = math.sin(2 * math.pi * hour / 24)
        features['hour_cos'] = math.cos(2 * math.pi * hour / 24)
        features['month_sin'] = math.sin(2 * math.pi * month / 12)
        features['month_cos'] = math.cos(2 * math.pi * month / 12)
        features['day_of_week_sin'] = math.sin(2 * math.pi * weekday / 7)
        features['day_of_week_cos'] = math.cos(2 * math.pi * weekday / 7)
        features['price_load_ratio'] = features['electricity_price'] / max(cur_load, 1) * 1000

        return features

    def get_feature_vector(self, features: dict) -> list:
        """Return features in the exact order expected by the ML model."""
        return [features.get(col, 0) for col in settings.FEATURE_COLUMNS]
