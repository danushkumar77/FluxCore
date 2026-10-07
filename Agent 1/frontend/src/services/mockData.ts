import { DashboardSummary, PredictionResponse, HealthStatus, ModelMetrics, FeatureImportance, HourlyForecast, WeeklyTrend } from '../types';

export const mockHourlyForecast: HourlyForecast[] = Array.from({ length: 24 }).map((_, i) => ({
  hour: i,
  demand: 25000 + Math.sin(i / 24 * Math.PI) * 10000 + Math.random() * 2000,
  confidence: 85 + Math.random() * 15,
  risk: Math.random() > 0.8 ? 'Medium' : 'Low',
}));

export const mockWeeklyTrend: WeeklyTrend[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
  day,
  avg_demand: 28000 + Math.random() * 3000,
  peak_demand: 35000 + Math.random() * 3000,
  min_demand: 20000 + Math.random() * 2000,
}));

export const mockPredictionResponse: PredictionResponse = {
  agent: "FluxCore Agent",
  timestamp: new Date().toISOString(),
  prediction: 32450,
  next_6h_demand: 34500,
  next_24h_demand: 31000,
  peak_demand: 38200,
  confidence: 94.2,
  risk: 'Low',
  category: 'Normal Operations',
  trend: 'Increasing',
  grid_stress_index: 0.65,
  reserve_margin: 15.2,
  reasoning: "Demand is expected to rise due to incoming weather front and typical morning industrial ramp-up. Solar generation covers 12% of load.",
  recommendations: [
    "Schedule discretionary maintenance for off-peak hours.",
    "Monitor solar irradiance levels for potential drop-off.",
    "Prepare secondary reserve for potential demand spike."
  ],
  prediction_interval: { lower: 31500, upper: 33500 },
  feature_importance: {
    "temperature": 0.25,
    "time_of_day": 0.2,
    "previous_load": 0.15,
    "solar_generation": 0.1
  },
  validation_warnings: []
};

export const mockDashboardSummary: DashboardSummary = {
  current_load: 32450,
  average_load_24h: 28900,
  peak_load_24h: 38200,
  min_load_24h: 18500,
  total_predictions: 1247,
  avg_confidence: 94.2,
  risk_distribution: { Low: 45, Medium: 30, High: 20, Critical: 5 },
  recent_predictions: [
    mockPredictionResponse,
    { ...mockPredictionResponse, prediction: 31200, trend: 'Stable', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { ...mockPredictionResponse, prediction: 30500, trend: 'Decreasing', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { ...mockPredictionResponse, prediction: 34000, trend: 'Increasing', risk: 'Medium', timestamp: new Date(Date.now() - 10800000).toISOString() },
    { ...mockPredictionResponse, prediction: 36000, trend: 'Increasing', risk: 'High', timestamp: new Date(Date.now() - 14400000).toISOString() },
  ],
  hourly_forecast: mockHourlyForecast,
  weekly_trend: mockWeeklyTrend,
};

export const mockHealth: HealthStatus = {
  status: "Operational",
  model_loaded: true,
  database_connected: true,
  gemini_available: true,
  uptime_seconds: 360000,
  version: "1.0.0"
};

export const mockMetrics: ModelMetrics = {
  mae: 245,
  rmse: 310,
  mape: 1.5,
  r2_score: 0.96,
  cv_scores: [0.95, 0.96, 0.94, 0.97, 0.96],
  training_date: new Date(Date.now() - 86400000 * 5).toISOString(),
  samples_count: 150000
};

export const mockFeatureImportanceList: FeatureImportance[] = [
  { name: "Time of Day", importance: 0.25, category: "time" },
  { name: "Temperature", importance: 0.20, category: "weather" },
  { name: "Previous Load", importance: 0.15, category: "grid" },
  { name: "Solar Irradiance", importance: 0.12, category: "weather" },
  { name: "Day of Week", importance: 0.10, category: "time" },
  { name: "Wind Speed", importance: 0.08, category: "weather" },
  { name: "Electricity Price", importance: 0.05, category: "market" },
  { name: "Humidity", importance: 0.03, category: "weather" },
  { name: "Grid Frequency", importance: 0.02, category: "grid" },
];

export const mockAgentStateSummary = {
  state: "Idle",
  last_state_change: new Date().toISOString(),
  current_plan: [
    { step_id: "step_1", action: "Ingest Telemetry Scan", tool_name: "verify_telemetry", params: {}, status: "Success" as const },
    { step_id: "step_2", action: "Optimize Battery State of Charge", tool_name: "optimize_battery", params: { soc_target: 70 }, status: "Success" as const },
    { step_id: "step_3", action: "Schedule baseline thermal generation adjustments", tool_name: "schedule_generator", params: { delta_mw: -200 }, status: "Pending" as const }
  ],
  active_goals: [
    { goal_id: "stability", label: "Maintain Grid Voltage/Freq Stability", priority: 1, status: "Achieved", progress: 100.0, dependencies: [] },
    { goal_id: "shaving", label: "Perform Peak Load Shaving", priority: 2, status: "Active", progress: 68.2, dependencies: ["stability"] }
  ],
  tool_logs: [
    { timestamp: new Date().toISOString(), name: "optimize_battery", params: { soc_target: 70 }, success: true, duration_sec: 0.512, log: "Float mode target set." }
  ],
  reflections: [
    { timestamp: new Date().toISOString(), sample_size: 20, mean_deviation_mw: 142.12, lessons_learned: ["Acceptable boundary tracking (+/- 1.5%)."], recommend_retraining: false }
  ],
  decision_runs: {
    strategies: [
      { name: "Option A: Battery Storage Dispatch", cost: 85, reliability: 90, carbon: 95, health: 75, overall: 86.2, reason: "Discharge 500 MW from Megapack (SOC 68%)." }
    ],
    chosen_strategy: "Option A: Battery Storage Dispatch",
    confidence_score: 86.2,
    explanation: "Optimal decision selected: Option A."
  },
  consulted_policies: [
    "Never discharge battery backup below 30% SOC reserve.",
    "If grid frequency deviates +/-0.2Hz, prioritize battery stabilization immediately."
  ]
};
