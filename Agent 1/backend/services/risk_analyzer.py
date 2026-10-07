from config.settings import settings

class RiskAnalyzer:
    def analyze(self, prediction: float, current_load: float, inputs: dict) -> dict:
        GRID_CAPACITY = settings.GRID_CAPACITY
        
        grid_stress_index = (prediction / GRID_CAPACITY) * 100
        reserve_margin = ((GRID_CAPACITY - prediction) / GRID_CAPACITY) * 100
        
        if prediction > GRID_CAPACITY * 0.9: category = 'Critical'
        elif prediction > GRID_CAPACITY * 0.8: category = 'Peak'
        elif prediction > GRID_CAPACITY * 0.6: category = 'High'
        elif prediction > GRID_CAPACITY * 0.4: category = 'Normal'
        else: category = 'Low'
        
        if prediction > current_load * 1.05: trend = 'Increasing'
        elif prediction < current_load * 0.95: trend = 'Decreasing'
        else: trend = 'Stable'
        
        risk_score = 0
        if grid_stress_index > 80: risk_score += 3
        elif grid_stress_index > 60: risk_score += 2
        elif grid_stress_index > 40: risk_score += 1
        
        if inputs.get('temperature', 25) > 38 or inputs.get('temperature', 25) < 0: risk_score += 2
        if inputs.get('renewable_percentage', 30) < 15: risk_score += 1
        if inputs.get('battery_soc', 50) < 20: risk_score += 1
        if inputs.get('grid_frequency', 50) < 49.5 or inputs.get('grid_frequency', 50) > 50.5: risk_score += 2
        
        if risk_score >= 6: risk = 'Critical'
        elif risk_score >= 4: risk = 'High'
        elif risk_score >= 2: risk = 'Medium'
        else: risk = 'Low'
        
        return {
            'risk': risk,
            'category': category,
            'trend': trend,
            'grid_stress_index': grid_stress_index,
            'reserve_margin': reserve_margin
        }
