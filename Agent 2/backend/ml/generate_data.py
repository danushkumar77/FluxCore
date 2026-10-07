import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_data(output_path="backend/ml/historical_generation.csv"):
    print("Generating synthetic weather and renewable generation data...")
    np.random.seed(42)
    
    # 1 year of hourly data
    start_date = datetime(2025, 1, 1, 0, 0, 0)
    hours = 8760
    timestamps = [start_date + timedelta(hours=i) for i in range(hours)]
    
    data = []
    
    # Initial reservoir level (80% full)
    reservoir_level = 80.0
    battery_soc = 50.0
    
    for i, ts in enumerate(timestamps):
        hour = ts.hour
        day_of_year = ts.timetuple().tm_yday
        is_weekend = ts.weekday() >= 5
        month = ts.month
        
        # 1. Season representation (1: Winter, 2: Spring, 3: Summer, 4: Autumn)
        if month in [12, 1, 2]:
            season = 1
        elif month in [3, 4, 5]:
            season = 2
        elif month in [6, 7, 8]:
            season = 3
        else:
            season = 4
            
        # 2. Temperature (seasonal base + daily cycle + noise)
        # Seasonal cycle: peak in July (day 200)
        seasonal_temp = 15 + 12 * np.sin(2 * np.pi * (day_of_year - 100) / 365)
        # Daily cycle: peak around 15:00 (hour 15)
        daily_temp = 5 * np.sin(2 * np.pi * (hour - 9) / 24)
        temp = seasonal_temp + daily_temp + np.random.normal(0, 1.5)
        
        # 3. Cloud Cover (random walk with seasonal shifts)
        # Higher clouds in winter/spring
        base_cloud = 0.4 if season in [1, 2] else 0.25
        cloud_cover = np.clip(base_cloud + 0.3 * np.sin(2 * np.pi * day_of_year / 365) + np.random.normal(0, 0.2), 0.0, 1.0)
        
        # 4. Solar Irradiance (depends on solar elevation)
        # Zenith angle approximation: peak at noon, seasonal peak in summer
        # Solar elevation angle (declination + hour angle)
        declination = 23.45 * np.sin(2 * np.pi * (284 + day_of_year) / 365 * np.pi / 180) # degrees
        # Local hour angle
        hour_angle = 15 * (hour - 12) # degrees
        latitude = 40.0 # Standard mid-latitude
        
        # Convert to radians
        dec_rad = np.radians(declination)
        lat_rad = np.radians(latitude)
        ha_rad = np.radians(hour_angle)
        
        # Sine of elevation angle
        sin_elev = np.sin(lat_rad) * np.sin(dec_rad) + np.cos(lat_rad) * np.cos(dec_rad) * np.cos(ha_rad)
        solar_elevation = np.degrees(np.arcsin(np.clip(sin_elev, -1.0, 1.0)))
        
        if solar_elevation > 0:
            # Clear sky solar irradiance (standard model)
            clear_sky = 1000 * sin_elev
            # Attenuation by clouds
            solar_irradiance = clear_sky * (1.0 - 0.75 * cloud_cover)
            solar_irradiance = max(0.0, solar_irradiance + np.random.normal(0, 30))
        else:
            solar_irradiance = 0.0
            
        # 5. Wind Speed (Weibull-like daily cycles + weather systems)
        # Wind is often stronger in afternoons/evenings
        wind_base = 6.0 + 2.0 * np.sin(2 * np.pi * (day_of_year - 50) / 365)
        wind_daily = 1.5 * np.sin(2 * np.pi * (hour - 16) / 24)
        wind_speed = max(0.0, wind_base + wind_daily + np.random.normal(0, 2.5))
        
        # Wind Direction (0-360)
        wind_direction = (180 + 90 * np.sin(2 * np.pi * day_of_year / 365) + np.random.normal(0, 45)) % 360
        
        # 6. Humidity (inversely proportional to temp, plus rain effect)
        humidity = np.clip(80 - 2 * daily_temp + 20 * cloud_cover + np.random.normal(0, 5), 10, 100)
        
        # 7. Rainfall (depends on cloud cover & humidity)
        if cloud_cover > 0.75 and humidity > 80:
            rainfall = max(0.0, (cloud_cover - 0.7) * 10 + np.random.exponential(1.5))
        else:
            rainfall = 0.0
            
        # 8. Atmospheric Pressure
        pressure = 1013.25 - 5 * (cloud_cover - 0.4) + np.random.normal(0, 3)
        
        # 9. Reservoir Level (drops when generating hydro, increases with rainfall)
        # Inflows from rainfall (delayed/buffered)
        inflow = 0.05 + 0.1 * rainfall + 0.05 * np.sin(2 * np.pi * day_of_year / 365) # spring melt
        # Hydro dispatch uses reservoir level
        hydro_base_demand = 0.5 + 0.3 * np.sin(2 * np.pi * hour / 24)
        hydro_dispatch = 0.15 if reservoir_level > 20 else 0.05
        reservoir_level = np.clip(reservoir_level + inflow - hydro_dispatch, 10.0, 100.0)
        
        # 10. Grid Demand (double peak: morning 8-10, evening 18-21. Weekend is lower)
        base_demand = 15000 if not is_weekend else 12000
        # Diurnal pattern
        hour_factor = 1.0
        if 7 <= hour <= 10:
            hour_factor = 1.3
        elif 17 <= hour <= 21:
            hour_factor = 1.45
        elif 0 <= hour <= 5:
            hour_factor = 0.75
            
        grid_demand = base_demand * hour_factor + np.random.normal(0, 500)
        
        # 11. Electricity Price (follows demand, drops with excess renewables)
        # Base price around $50/MWh
        electricity_price = 30 + 30 * (grid_demand / 15000) + np.random.normal(0, 5)
        
        # Targets calculation (Actual outputs)
        # Capacity limits: Solar: 10MW (10,000 kW), Wind: 8MW (8,000 kW), Hydro: 5MW (5,000 kW)
        
        # Solar Generation: proportional to irradiance and temperature efficiency drop
        temp_loss = max(0, (temp - 25) * 0.004) # -0.4% per degree above 25C
        solar_efficiency = 0.20 * (1 - temp_loss)
        solar_gen = solar_irradiance * 10.0 * solar_efficiency * 5.0 # scaling to max ~10,000
        solar_gen = np.clip(solar_gen, 0.0, 10000.0)
        if solar_irradiance == 0:
            solar_gen = 0.0
            
        # Wind Generation: standard power curve
        # Cut-in: 3 m/s, Rated: 12 m/s, Cut-out: 25 m/s
        if wind_speed < 3.0 or wind_speed > 25.0:
            wind_gen = 0.0
        elif wind_speed < 12.0:
            # Cubic increase
            wind_gen = 8000 * ((wind_speed - 3.0) / 9.0) ** 3
        else:
            # Rated output
            wind_gen = 8000.0
        wind_gen = np.clip(wind_gen + np.random.normal(0, 200), 0.0, 8000.0)
        if wind_speed < 3.0:
            wind_gen = 0.0
            
        # Hydro Generation: dependent on reservoir level & grid demand
        # Hydro acts as a peaker plant
        hydro_factor = 1.0 if grid_demand > 16000 else 0.5
        hydro_gen = 5000 * (reservoir_level / 100.0) * hydro_factor
        hydro_gen = np.clip(hydro_gen + np.random.normal(0, 100), 0.0, 5000.0)
        
        # Battery state of charge update
        # If solar + wind + hydro > demand, charge. If lower, discharge.
        total_gen = solar_gen + wind_gen + hydro_gen
        net_power = total_gen - grid_demand
        if net_power > 0:
            # Charge battery (efficiency 90%)
            battery_soc = np.clip(battery_soc + (net_power / 10000.0) * 0.9, 0.0, 100.0)
        else:
            # Discharge battery
            battery_soc = np.clip(battery_soc + (net_power / 10000.0), 0.0, 100.0)
            
        data.append({
            "timestamp": ts.isoformat(),
            "solar_irradiance": round(solar_irradiance, 2),
            "cloud_cover": round(cloud_cover, 4),
            "wind_speed": round(wind_speed, 2),
            "wind_direction": round(wind_direction, 1),
            "temperature": round(temp, 2),
            "humidity": round(humidity, 1),
            "rainfall": round(rainfall, 3),
            "atmospheric_pressure": round(pressure, 2),
            "reservoir_level": round(reservoir_level, 2),
            "grid_demand": round(grid_demand, 2),
            "battery_soc": round(battery_soc, 2),
            "electricity_price": round(electricity_price, 2),
            "season": season,
            "solar_generation": round(solar_gen, 2),
            "wind_generation": round(wind_gen, 2),
            "hydro_generation": round(hydro_gen, 2)
        })
        
    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Synthetic data generation complete. Saved to {output_path} (Shape: {df.shape})")

if __name__ == "__main__":
    generate_synthetic_data()
