export interface PredictionRequest {
  hour: number;
  minute: number;
  day: number;
  month: number;
  year: number;
  weekday: number;
  is_weekend: boolean;
  is_holiday: boolean;
  season: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  solar_irradiance: number;
  atmospheric_pressure: number;
  current_load: number;
  previous_hour_load: number;
  previous_day_load: number;
  grid_frequency: number;
  voltage: number;
  power_factor: number;
  solar_generation: number;
  wind_generation: number;
  hydro_generation: number;
  renewable_percentage: number;
  battery_soc: number;
  available_storage: number;
  electricity_price: number;
  demand_response_event: boolean;
}

export interface PredictionResponse {
  agent: string;
  timestamp: string;
  prediction: number;
  next_6h_demand: number;
  next_24h_demand: number;
  peak_demand: number;
  confidence: number;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  grid_stress_index: number;
  reserve_margin: number;
  reasoning: string;
  recommendations: string[];
  prediction_interval: { lower: number; upper: number };
  feature_importance: Record<string, number>;
  validation_warnings: string[];
}

export interface DashboardSummary {
  current_load: number;
  average_load_24h: number;
  peak_load_24h: number;
  min_load_24h: number;
  total_predictions: number;
  avg_confidence: number;
  risk_distribution: Record<string, number>;
  recent_predictions: PredictionResponse[];
  hourly_forecast: HourlyForecast[];
  weekly_trend: WeeklyTrend[];
}

export interface HourlyForecast {
  hour: number;
  demand: number;
  confidence: number;
  risk: string;
}

export interface WeeklyTrend {
  day: string;
  avg_demand: number;
  peak_demand: number;
  min_demand: number;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  database_connected: boolean;
  gemini_available: boolean;
  uptime_seconds: number;
  version: string;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2_score: number;
  cv_scores: number[];
  training_date: string;
  samples_count: number;
}

export interface FeatureImportance {
  name: string;
  importance: number;
  category: string;
}

export interface PlanStep {
  step_id: string;
  action: string;
  tool_name: string;
  params: Record<string, any>;
  status: 'Pending' | 'Executing' | 'Success' | 'Failed';
}

export interface Goal {
  goal_id: string;
  label: string;
  priority: number;
  status: string;
  progress: number;
  dependencies: string[];
}

export interface ToolLog {
  timestamp: string;
  name: string;
  params: Record<string, any>;
  success: boolean;
  duration_sec: number;
  log: string;
}

export interface Reflection {
  timestamp: string;
  sample_size: number;
  mean_deviation_mw: number;
  lessons_learned: string[];
  recommend_retraining: boolean;
}

export interface AgentStateSummary {
  state: string;
  last_state_change: string;
  current_plan: PlanStep[];
  active_goals: Goal[];
  tool_logs: ToolLog[];
  reflections: Reflection[];
  decision_runs: any;
  consulted_policies: string[];
}
