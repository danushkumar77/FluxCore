import numpy as np
import pandas as pd

def engineer_features(df_input: pd.DataFrame) -> pd.DataFrame:
    """
    Applies comprehensive feature engineering to weather and operational datasets.
    """
    df = df_input.copy()
    
    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort by timestamp to ensure correct lags/rolling calculations
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Extract basic time parameters
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_year'] = df['timestamp'].dt.dayofyear
    df['month'] = df['timestamp'].dt.month
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # 1. Cyclic Time Encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365.0)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365.0)
    df['month_sin'] = np.sin(2 * np.pi * (df['month'] - 1) / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * (df['month'] - 1) / 12.0)
    
    # 2. Solar Zenith Angle, Sunrise, Sunset, Daylight Hours
    latitude = 40.0 # mid-latitude
    # Declination angle
    declination = 23.45 * np.sin(2 * np.pi * (284 + df['day_of_year']) / 365.0 * np.pi / 180.0)
    dec_rad = np.radians(declination)
    lat_rad = np.radians(latitude)
    
    # Hour angle
    hour_angle = 15 * (df['hour'] - 12)
    ha_rad = np.radians(hour_angle)
    
    # Sine of elevation angle
    sin_elev = np.sin(lat_rad) * np.sin(dec_rad) + np.cos(lat_rad) * np.cos(dec_rad) * np.cos(ha_rad)
    solar_elevation = np.degrees(np.arcsin(np.clip(sin_elev, -1.0, 1.0)))
    
    # Solar Zenith Angle
    df['solar_zenith_angle'] = 90.0 - solar_elevation
    df.loc[df['solar_zenith_angle'] > 90.0, 'solar_zenith_angle'] = 90.0 # cap at horizon
    
    # Sunrise & Sunset (hour angle at horizon elevation = 0)
    # cos(omega_s) = -tan(latitude) * tan(declination)
    cos_omega_s = -np.tan(lat_rad) * np.tan(dec_rad)
    # Clip cos_omega_s between -1 and 1 to handle polar day/night
    cos_omega_s = np.clip(cos_omega_s, -1.0, 1.0)
    omega_s = np.arccos(cos_omega_s)
    omega_s_deg = np.degrees(omega_s)
    
    df['daylight_hours'] = 2 * omega_s_deg / 15.0
    df['sunrise_time'] = 12.0 - (omega_s_deg / 15.0)
    df['sunset_time'] = 12.0 + (omega_s_deg / 15.0)
    
    # 3. Solar Efficiency Index & Cloud Attenuation Factor
    temp_loss = (df['temperature'] - 25.0).clip(lower=0.0) * 0.004 # -0.4% per deg above 25C
    df['solar_efficiency_index'] = (1.0 - temp_loss) * (1.0 - df['cloud_cover'])
    df['cloud_attenuation_factor'] = 1.0 - 0.75 * (df['cloud_cover'] ** 1.5)
    
    # 4. Air Density & Wind Power Density
    # Air Density = P / (R * T). P in hPa, T in Kelvin. R = 287.05
    df['air_density'] = (df['atmospheric_pressure'] * 100.0) / (287.05 * (df['temperature'] + 273.15))
    df['wind_power_density'] = 0.5 * df['air_density'] * (df['wind_speed'] ** 3)
    
    # 5. Hydro Flow Index & Reservoir Utilization
    df['hydro_flow_index'] = df['reservoir_level'] * (1.0 + df['rainfall'] * 0.5)
    df['reservoir_utilization'] = df['reservoir_level'] / 100.0
    
    # 6. Lags (fill NaNs using backfill/forwardfill)
    for col in ['solar_irradiance', 'wind_speed', 'reservoir_level']:
        df[f'{col}_lag_1h'] = df[col].shift(1)
        df[f'{col}_lag_2h'] = df[col].shift(2)
        df[f'{col}_lag_24h'] = df[col].shift(24)
        
    # 7. Rolling Statistics
    for col in ['solar_irradiance', 'wind_speed', 'cloud_cover']:
        df[f'{col}_roll_mean_3h'] = df[col].rolling(window=3, min_periods=1).mean()
        df[f'{col}_roll_std_3h'] = df[col].rolling(window=3, min_periods=1).std().fillna(0)
        df[f'{col}_roll_mean_6h'] = df[col].rolling(window=6, min_periods=1).mean()
        df[f'{col}_roll_mean_24h'] = df[col].rolling(window=24, min_periods=1).mean()
        
    # 8. Weather Severity Index
    temp_dev = (df['temperature'] - 20.0).abs() / 15.0
    wind_severity = (df['wind_speed'] / 12.0) ** 2
    rain_severity = (df['rainfall'] / 5.0) ** 1.5
    df['weather_severity_index'] = temp_dev + wind_severity + rain_severity
    
    # 9. Renewable Stability Index
    wind_variability = df['wind_speed_roll_std_3h'] / (df['wind_speed_roll_mean_3h'] + 0.1)
    df['renewable_stability_index'] = 1.0 - (df['cloud_cover'] * 0.4 + wind_variability.clip(upper=1.0) * 0.4)
    df['renewable_stability_index'] = df['renewable_stability_index'].clip(0.0, 1.0)
    
    # Fill remaining NaNs from shift operations
    df = df.bfill()
    
    return df
