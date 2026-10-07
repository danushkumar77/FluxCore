export interface TelemetryMeasurement {
  measurement_id: string;
  asset_id: string;
  timestamp: string;
  voltage_kv?: number;
  current_a?: number;
  frequency_hz?: number;
  active_power_mw?: number;
  reactive_power_mvar?: number;
  energy_kwh?: number;
  temperature_c?: number;
  wind_speed_m_s?: number;
  solar_irradiance_w_m2?: number;
  battery_soc_pct?: number;
  battery_soh_pct?: number;
  battery_temp_c?: number;
  market_price_mwh?: number;
  carbon_intensity_g_kwh?: number;
}

export interface AgentState {
  agent_name: string;
  version: string;
  capabilities: string[];
  current_state: string; // Idle, Monitoring, Analysis, Prediction, Reasoning, Planning, Optimization, Execution, Reflection, Learning, Recovery, Error
  health_status: string; // healthy, degraded, error
  last_active: string;
  runtime_metadata: Record<string, any>;
}

export interface Alert {
  alert_id: string;
  asset_id: string;
  source_agent: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "informational";
  status: "active" | "acknowledged" | "cleared";
  timestamp: string;
  suggested_action?: string;
}

export interface ExplainableDecision {
  decision_id: string;
  agent_name: string;
  timestamp: string;
  confidence_score: number;
  engineering_explanation: string;
  influencing_factors: Record<string, number>;
  risk_assessment: {
    hazard: string;
    probability: string;
    impact: string;
    description: string;
  };
  recommended_corrective_actions: string[];
  decision_trace: string[];
  justification: string;
}
