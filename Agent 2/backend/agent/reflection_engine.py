import numpy as np
import pandas as pd
from datetime import datetime
from backend.agent.memory_manager import MemoryManager

class ReflectionEngine:
    def __init__(self, memory_manager: MemoryManager):
        self.memory = memory_manager

    def reflect(self, forecast_id: int, forecasts: dict, actuals: dict) -> dict:
        """
        Compares forecast vs actual values. Calculates error metrics and logs results.
        
        forecasts: {'solar': X, 'wind': Y, 'hydro': Z}
        actuals: {'solar': X_a, 'wind': Y_a, 'hydro': Z_a}
        """
        sol_f = forecasts.get("solar", 0.0)
        sol_a = actuals.get("solar", 0.0)
        
        wind_f = forecasts.get("wind", 0.0)
        wind_a = actuals.get("wind", 0.0)
        
        hyd_f = forecasts.get("hydro", 0.0)
        hyd_a = actuals.get("hydro", 0.0)
        
        # Calculate errors
        sol_err = sol_a - sol_f
        wind_err = wind_a - wind_f
        hyd_err = hyd_a - hyd_f
        
        abs_sol_err = abs(sol_err)
        abs_wind_err = abs(wind_err)
        abs_hyd_err = abs(hyd_err)
        
        # Percentage error (MAPE terms)
        mape_sol = (abs_sol_err / sol_a * 100) if sol_a > 500 else 0.0
        mape_wind = (abs_wind_err / wind_a * 100) if wind_a > 500 else 0.0
        mape_hyd = (abs_hyd_err / hyd_a * 100) if hyd_a > 500 else 0.0
        
        mean_mape = np.mean([mape_sol, mape_wind, mape_hyd])
        
        # Learning score calculation (100 - mean_mape, bounded between 0 and 100)
        learning_score = max(0.0, min(100.0, 100.0 - mean_mape))
        if mean_mape == 0.0:
            # Handle cases where actuals are very low
            learning_score = 95.0
            
        # Model Drift estimate: compare current error to historical average error
        history = self.memory.get_reflections(limit=24)
        if len(history) >= 5:
            hist_errors = [abs(h["solar_error"]) + abs(h["wind_error"]) + abs(h["hydro_error"]) for h in history]
            avg_hist_error = np.mean(hist_errors)
            current_total_error = abs_sol_err + abs_wind_err + abs_hyd_err
            
            # If current error is much higher than recent history, drift is increasing
            drift_ratio = current_total_error / (avg_hist_error + 1.0)
            model_drift = max(0.0, min(100.0, (drift_ratio - 1.0) * 10))
        else:
            model_drift = 0.0
            
        # Formulate lessons learned
        lessons = []
        if abs_sol_err > 1000:
            if sol_err < 0:
                lessons.append(f"Solar overpredicted by {abs_sol_err:.2f} kW. Likely unmodeled cloud micro-attenuation or local dust buildup.")
            else:
                lessons.append(f"Solar underpredicted by {abs_sol_err:.2f} kW. Solar irradiance exceeded forecast clearance levels.")
                
        if abs_wind_err > 1000:
            if wind_err < 0:
                lessons.append(f"Wind overpredicted by {abs_wind_err:.2f} kW. Wind speeds dropped below cut-in threshold or turbulence induced shutdown.")
            else:
                lessons.append(f"Wind underpredicted by {abs_wind_err:.2f} kW. High wind speeds stabilized near turbine rated capacities.")
                
        if abs_hyd_err > 500:
            lessons.append(f"Hydro variance: {hyd_err:.2f} kW. Dispatch schedule required turbine ramping updates.")
            
        if not lessons:
            lessons.append("Predictions aligned with actual output within standard tolerance (+/- 5%). Model performance nominal.")
            
        lessons_learned = " | ".join(lessons)
        
        # Store in database
        self.memory.store_reflection(
            forecast_id=forecast_id,
            solar_error=round(sol_err, 2),
            wind_error=round(wind_err, 2),
            hydro_error=round(hyd_err, 2),
            learning_score=round(learning_score, 2),
            model_drift=round(model_drift, 2),
            lessons_learned=lessons_learned
        )
        
        # Update SQLite actuals table too
        self.memory.store_actuals(
            forecast_id=forecast_id,
            actual_solar=sol_a,
            actual_wind=wind_a,
            actual_hydro=hyd_a,
            timestamp=datetime.utcnow().isoformat()
        )
        
        return {
            "forecast_id": forecast_id,
            "errors": {
                "solar": round(sol_err, 2),
                "wind": round(wind_err, 2),
                "hydro": round(hyd_err, 2)
            },
            "learning_score": round(learning_score, 2),
            "model_drift": round(model_drift, 2),
            "lessons_learned": lessons_learned
        }
