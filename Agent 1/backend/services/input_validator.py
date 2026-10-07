from copy import deepcopy

class InputValidator:
    def validate(self, data: dict) -> tuple[dict, list[str]]:
        warnings = []
        cleaned_data = deepcopy(data)
        
        defaults = {
            'temperature': 25, 'humidity': 50, 'wind_speed': 10,
            'current_load': 20000, 'grid_frequency': 50, 'voltage': 230,
            'power_factor': 0.95, 'previous_hour_load': 20000, 'previous_day_load': 20000,
            'solar_generation': 0, 'wind_generation': 0, 'hydro_generation': 0,
            'renewable_percentage': 0, 'battery_soc': 50, 'available_storage': 500,
            'electricity_price': 50, 'atmospheric_pressure': 1013.25,
            'rainfall': 0, 'solar_irradiance': 0
        }
        
        for k, v in defaults.items():
            if k not in cleaned_data or cleaned_data[k] is None:
                cleaned_data[k] = v
                warnings.append(f"Missing {k}, defaulting to {v}")
                
        # Calculate derived
        if 'weekday' in cleaned_data:
            cleaned_data['is_weekend'] = cleaned_data['weekday'] >= 5
        if 'month' in cleaned_data:
            month = cleaned_data['month']
            if month in [3, 4, 5]: cleaned_data['season'] = 'spring'
            elif month in [6, 7, 8]: cleaned_data['season'] = 'summer'
            elif month in [9, 10, 11]: cleaned_data['season'] = 'autumn'
            else: cleaned_data['season'] = 'winter'
            
        return cleaned_data, warnings
