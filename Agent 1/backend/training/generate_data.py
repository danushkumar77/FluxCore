import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_data():
    np.random.seed(42)
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31, 23, 59, 59)
    date_rng = pd.date_range(start=start_date, end=end_date, freq='h')
    
    n_samples = len(date_rng)
    
    df = pd.DataFrame(index=date_rng)
    df['hour'] = df.index.hour
    df['minute'] = df.index.minute
    df['day'] = df.index.day
    df['month'] = df.index.month
    df['year'] = df.index.year
    df['weekday'] = df.index.weekday
    df['is_weekend'] = df['weekday'].isin([5, 6]).astype(int)
    
    def get_season(month):
        if month in [3, 4, 5]: return 0
        if month in [6, 7, 8]: return 1
        if month in [9, 10, 11]: return 2
        return 3
    df['season'] = df['month'].apply(get_season)
    
    holidays_2025 = [
        '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26', '2025-06-19',
        '2025-07-04', '2025-09-01', '2025-10-13', '2025-11-11', '2025-11-27',
        '2025-12-25'
    ]
    df['is_holiday'] = df.index.strftime('%Y-%m-%d').isin(holidays_2025).astype(int)
    
    df['temperature'] = np.where(df['season'] == 1, np.random.uniform(28, 42, n_samples),
                        np.where(df['season'] == 3, np.random.uniform(-5, 15, n_samples),
                                 np.random.uniform(10, 28, n_samples)))
    df['temperature'] += np.sin(2 * np.pi * df['hour'] / 24) * 5
    
    df['humidity'] = np.random.uniform(30, 90, n_samples)
    
    solar_base = np.where((df['hour'] >= 6) & (df['hour'] <= 18), 
                          np.sin(np.pi * (df['hour'] - 6) / 12) * 1000, 0)
    df['solar_irradiance'] = np.clip(solar_base + np.random.normal(0, 50, n_samples), 0, 1000)
    
    df['wind_speed'] = np.random.uniform(0, 40, n_samples)
    df['rainfall'] = np.where(df['season'] == 0, np.random.exponential(1, n_samples), np.random.exponential(0.5, n_samples))
    df['atmospheric_pressure'] = np.random.normal(1013, 10, n_samples)
    
    base_load = np.where(df['season'] == 1, 35000,
                np.where(df['season'] == 3, 32000, 25000))
    
    time_factor = np.ones(n_samples)
    time_factor = np.where((df['hour'] >= 0) & (df['hour'] <= 5), np.random.uniform(0.6, 0.7, n_samples), time_factor)
    time_factor = np.where((df['hour'] >= 6) & (df['hour'] <= 8), np.random.uniform(0.7, 0.9, n_samples), time_factor)
    time_factor = np.where((df['hour'] >= 9) & (df['hour'] <= 12), np.random.uniform(0.9, 1.0, n_samples), time_factor)
    time_factor = np.where((df['hour'] >= 13) & (df['hour'] <= 16), np.random.uniform(0.85, 0.95, n_samples), time_factor)
    time_factor = np.where((df['hour'] >= 17) & (df['hour'] <= 21), np.random.uniform(1.0, 1.15, n_samples), time_factor)
    time_factor = np.where((df['hour'] >= 22) & (df['hour'] <= 23), np.random.uniform(0.8, 0.9, n_samples), time_factor)
    
    demand = base_load * time_factor
    
    demand = np.where(df['is_weekend'] == 1, demand * np.random.uniform(0.8, 0.85, n_samples), demand)
    demand = np.where(df['is_holiday'] == 1, demand * np.random.uniform(0.75, 0.8, n_samples), demand)
    
    temp_inc = np.where((df['temperature'] > 35) | (df['temperature'] < 5), np.random.uniform(1.05, 1.15, n_samples), 1.0)
    demand = demand * temp_inc
    
    demand = demand + np.random.normal(0, 500, n_samples)
    df['demand_mw'] = demand
    
    df['current_load'] = df['demand_mw'] + np.random.normal(0, 100, n_samples)
    df['previous_hour_load'] = df['current_load'].shift(1).bfill()
    df['previous_day_load'] = df['current_load'].shift(24).bfill()
    
    df['grid_frequency'] = np.random.normal(50, 0.05, n_samples)
    df['grid_frequency'] = np.clip(df['grid_frequency'], 49.8, 50.2)
    df['voltage'] = np.random.uniform(228, 232, n_samples)
    df['power_factor'] = np.random.uniform(0.90, 0.99, n_samples)
    
    capacity_factor = 8
    df['solar_generation'] = df['solar_irradiance'] * capacity_factor + np.random.normal(0, 100, n_samples)
    df['solar_generation'] = np.clip(df['solar_generation'], 0, None)
    
    df['wind_generation'] = np.random.uniform(500, 5000, n_samples) + np.where((df['hour'] < 6) | (df['hour'] > 18), 500, 0)
    df['hydro_generation'] = np.random.uniform(1000, 3000, n_samples) + np.where(df['season'] == 0, 500, 0)
    
    df['renewable_percentage'] = (df['solar_generation'] + df['wind_generation'] + df['hydro_generation']) / df['demand_mw'] * 100
    
    df['battery_soc'] = 20 + np.sin(np.pi * (df['hour'] - 6) / 12) * 35 + 35
    df['battery_soc'] = np.clip(df['battery_soc'] + np.random.normal(0, 2, n_samples), 20, 90)
    df['available_storage'] = np.random.uniform(500, 2000, n_samples)
    
    df['electricity_price'] = df['demand_mw'] / 35000 * 100 + np.random.normal(0, 10, n_samples)
    df['electricity_price'] = np.clip(df['electricity_price'], 20, 200)
    df['demand_response_event'] = (np.random.uniform(0, 1, n_samples) > 0.97).astype(int)
    
    os.makedirs(os.path.join(os.path.dirname(__file__), '../datasets'), exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__), '../datasets/demand_data.csv')
    df.to_csv(out_path, index=False)
    
    print(f"Data generated shape: {df.shape}")
    print(df.describe())

if __name__ == "__main__":
    generate_data()
