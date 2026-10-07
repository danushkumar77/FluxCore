import { Alert } from "../types";

export interface MockWorker {
  name: string;
  status: "running" | "idle" | "error";
  cpu: number;
  memory: number;
  executionTimeMs: number;
  tasksCompleted: number;
}

export interface MockModel {
  name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  latencyMs: number;
  driftPct: number;
  status: string;
}

export interface MockAsset {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  location: string;
  installedDate: string;
  warrantyUntil: string;
  healthScore: number;
  rulYears: number;
  status: "active" | "maintenance" | "offline";
  lastMaintenance: string;
}

export interface MockIncident {
  id: string;
  title: string;
  assetId: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "fault" | "incident_created" | "investigating" | "root_cause_identified" | "recommended_action_issued" | "operator_review" | "resolved";
  assignedEngineer: string;
  rootCause: string;
  recoveryPlan: string;
  notes: string;
  timestamp: string;
  timeline: { step: string; timestamp: string }[];
}

export const MOCK_WORKERS: MockWorker[] = [
  { name: "Telemetry Ingestion Worker", status: "running", cpu: 1.2, memory: 45, executionTimeMs: 12, tasksCompleted: 24500 },
  { name: "Demand Prediction Worker", status: "running", cpu: 8.5, memory: 120, executionTimeMs: 145, tasksCompleted: 1200 },
  { name: "Gemini Reasoning Worker", status: "idle", cpu: 0.0, memory: 250, executionTimeMs: 1120, tasksCompleted: 450 },
  { name: "BESS Optimization Worker", status: "running", cpu: 4.3, memory: 85, executionTimeMs: 85, tasksCompleted: 1540 },
  { name: "Memory Indexer Worker", status: "running", cpu: 0.8, memory: 110, executionTimeMs: 4, tasksCompleted: 18900 },
  { name: "Distributed Scheduler Worker", status: "running", cpu: 0.2, memory: 35, executionTimeMs: 1, tasksCompleted: 35000 },
  { name: "System Health Monitor Worker", status: "running", cpu: 0.1, memory: 25, executionTimeMs: 3, tasksCompleted: 8200 },
  { name: "Slack/Email Notification Worker", status: "idle", cpu: 0.0, memory: 40, executionTimeMs: 50, tasksCompleted: 320 }
];

export const MOCK_MODELS: MockModel[] = [
  { name: "XGBoost Load Forecaster", version: "v2.1.0", accuracy: 0.954, precision: 0.948, recall: 0.951, f1: 0.949, latencyMs: 24, driftPct: 1.2, status: "active" },
  { name: "Random Forest Renewable Estimator", version: "v1.8.4", accuracy: 0.912, precision: 0.908, recall: 0.915, f1: 0.911, latencyMs: 12, driftPct: 3.4, status: "active" },
  { name: "BESS Remaining Useful Life", version: "v1.0.2", accuracy: 0.968, precision: 0.971, recall: 0.965, f1: 0.968, latencyMs: 45, driftPct: 0.4, status: "active" },
  { name: "Relay Overcurrent Classifier", version: "v3.0.0", accuracy: 0.994, precision: 0.992, recall: 0.995, f1: 0.993, latencyMs: 4, driftPct: 0.1, status: "active" }
];

export const MOCK_KNOWLEDGE = [
  { code: "IEEE-1547", category: "interconnection", title: "Distributed Resources Interconnection", description: "Mandates voltage trip bounds and automatic ride-through limits for solar and wind generators during grid fault sags.", parameters: { overvoltage_limit_pu: 1.1, undervoltage_limit_pu: 0.88 } },
  { code: "IEC-62619", category: "battery", title: "Safety of Lithium Batteries", description: "Establishes industrial standards for large grid battery installations. Restricts cell temp to 60C limit to avoid thermal breakdown.", parameters: { max_cell_temp_c: 60 } },
  { code: "GRID-RULE-TAP", category: "grid", title: "Substation Voltage Control", description: "Dictates that tap changers should trigger adjustments if voltage deviates past 3.5% nominal.", parameters: { max_deviation_pct: 3.5 } },
  { code: "SAFETY-LOTO", category: "safety", title: "Lockout Tagout (LOTO) Procedures", description: "Requires circuit isolating breaker handles to be physically locked and tagged before engineers perform relay maintenance.", parameters: { verification_required: "True" } },
  { code: "EMERG-LOAD-SHED", category: "emergency", title: "Under-Frequency Load Shedding", description: "Commands shedding of non-critical industrial distribution lines if frequency dips below 49.2 Hz.", parameters: { trip_frequency_hz: 49.2 } }
];

export const MOCK_MEMORY = [
  { record_id: "m-001", type: "incident_history", tags: ["grid", "voltage"], content: "Line sag on Feeder 4 resolved by charging BESS system at 14:20 during solar surge.", timestamp: "2026-07-28T14:20:00Z" },
  { record_id: "m-002", type: "lesson_learned", tags: ["battery", "temperature"], content: "Do not exceed charge power of 8.0 MW when ambient air temperature exceeds 40C, cell degradation spikes by 12%.", timestamp: "2026-07-27T11:05:00Z" },
  { record_id: "m-003", type: "previous_decision", tags: ["market", "economic"], content: "Bypassed battery charging command at 08:00 due to temporary high market price ($120/MWh) avoiding unnecessary charging expense.", timestamp: "2026-07-29T08:00:00Z" },
  { record_id: "m-004", type: "optimization_history", tags: ["carbon", "renewable"], content: "Optimized PV Solar integration during Peak Demand, curtailing carbon emissions by 4.2 metric tons.", timestamp: "2026-07-29T16:45:00Z" }
];

export const MOCK_LOGS = [
  { timestamp: "21:24:00", level: "INFO", source: "Orchestrator", msg: "State audit completed. Grid stable.", traceId: "t-98e-42" },
  { timestamp: "21:24:03", level: "INFO", source: "TelemetryWorker", msg: "Telemetry measurement generated: voltage=114.8 kV", traceId: "t-45a-12" },
  { timestamp: "21:24:06", level: "WARNING", source: "RuleEngine", msg: "Minor voltage deviation detected on Substation A.", traceId: "t-45a-12" },
  { timestamp: "21:24:07", level: "INFO", source: "DemandAgent", msg: "Triggering peak load forecasting regression...", traceId: "t-b9d-88" },
  { timestamp: "21:24:10", level: "INFO", source: "BatteryAgent", msg: "Recommending battery holding strategy: Idle.", traceId: "t-ff4-54" },
  { timestamp: "21:24:12", level: "INFO", source: "Cache", msg: "Cached telemetry for asset Substation A.", traceId: "t-c8a-92" }
];

export const MOCK_ALERTS: Alert[] = [
  { alert_id: "a-101", asset_id: "3fa85f64-5717", source_agent: "GridReliabilityAgent", description: "Feeder breaker 4 reporting high current overload (112% rating).", severity: "high", status: "active", timestamp: new Date(Date.now() - 300000).toISOString(), suggested_action: "Shed non-critical load or discharge battery." },
  { alert_id: "a-102", asset_id: "3fa85f64-9281", source_agent: "PredictiveMaintenanceAgent", description: "Transformer core oil temperature reaching warning threshold of 82 C.", severity: "medium", status: "active", timestamp: new Date(Date.now() - 600000).toISOString(), suggested_action: "Activate auxiliary cooling fan unit." },
  { alert_id: "a-103", asset_id: "3fa85f64-1029", source_agent: "BatteryEnergyAgent", description: "BESS unit 1 internal cell temperature abnormal at 54 C.", severity: "high", status: "active", timestamp: new Date(Date.now() - 1200000).toISOString(), suggested_action: "Throttling discharge output rate." }
];

export const MOCK_NOTIFICATIONS = [
  { channel: "slack", msg: "Critical Grid Overload Alert sent to channel #grid-ops.", sentAt: "21:23:45", unread: false },
  { channel: "push", msg: "Voltage sag alert pushed to operator mobile app.", sentAt: "21:23:55", unread: true },
  { channel: "teams", msg: "Maintenance Work Order created in MS Teams channel.", sentAt: "21:24:02", unread: true },
  { channel: "email", msg: "Daily Market report sent to energy-analysts@fluxcore.com.", sentAt: "21:00:00", unread: false }
];

export const MOCK_ASSETS: MockAsset[] = [
  { id: "ast-tr-001", name: "Main Step-Up Transformer A", type: "Transformer", manufacturer: "Siemens Energy", location: "Central Substation A", installedDate: "2021-04-12", warrantyUntil: "2031-04-12", healthScore: 94.2, rulYears: 18.5, status: "active", lastMaintenance: "2026-02-10" },
  { id: "ast-bess-001", name: "BESS Battery Storage Unit 1", type: "Battery System", manufacturer: "Tesla Energy", location: "Battery Storage Site 1", installedDate: "2023-08-20", warrantyUntil: "2033-08-20", healthScore: 98.4, rulYears: 9.2, status: "active", lastMaintenance: "2026-05-15" },
  { id: "ast-pv-001", name: "PV Solar Array Block 1", type: "Solar Farm", manufacturer: "First Solar", location: "PV Solar Farm", installedDate: "2022-10-05", warrantyUntil: "2037-10-05", healthScore: 91.5, rulYears: 14.8, status: "active", lastMaintenance: "2025-11-20" },
  { id: "ast-wf-001", name: "Wind Turbine Generator Group C", type: "Wind Farm", manufacturer: "Vestas", location: "Wind Farm North", installedDate: "2020-06-15", warrantyUntil: "2030-06-15", healthScore: 88.6, rulYears: 11.2, status: "maintenance", lastMaintenance: "2026-07-10" }
];

export const MOCK_WEATHER = {
  temperature_c: 24.5,
  humidity_pct: 65,
  cloud_cover_pct: 25,
  wind_speed_m_s: 8.5,
  rainfall_mm: 0.0,
  storm_risk_pct: 12,
  solar_irradiance_w_m2: 650,
  timeline: [
    { time: "08:00", temp: 21, cloud: 10, wind: 6.2, irradiance: 300 },
    { time: "12:00", temp: 26, cloud: 25, wind: 8.5, irradiance: 800 },
    { time: "16:00", temp: 25, cloud: 30, wind: 9.0, irradiance: 550 },
    { time: "20:00", temp: 22, cloud: 15, wind: 7.1, irradiance: 0 }
  ],
  impact_analysis: "High solar irradiance (650 W/m²) yields optimal PV generation (+18.4 MW). Mild winds (8.5 m/s) support normal wind turbine output, holding the Grid Health index at 98.2% stable."
};

export const MOCK_FORECAST_COMPARE = [
  { time: "08:00", actual_load: 72.4, predicted_load: 71.0, actual_gen: 25.1, predicted_gen: 24.5 },
  { time: "10:00", actual_load: 76.5, predicted_load: 75.8, actual_gen: 28.4, predicted_gen: 29.0 },
  { time: "12:00", actual_load: 80.4, predicted_load: 80.0, actual_gen: 38.5, predicted_gen: 38.0 },
  { time: "14:00", actual_load: 82.1, predicted_load: 81.5, actual_gen: 35.2, predicted_gen: 36.1 },
  { time: "16:00", actual_load: 79.8, predicted_load: 80.2, actual_gen: 30.1, predicted_gen: 30.5 },
  { time: "18:00", actual_load: 85.0, predicted_load: 84.1, actual_gen: 20.4, predicted_gen: 21.0 }
];

export const MOCK_INCIDENTS: MockIncident[] = [
  {
    id: "inc-104",
    title: "Feeder 4 Overcurrent Trip",
    assetId: "ast-tr-001",
    severity: "high",
    status: "recommended_action_issued",
    assignedEngineer: "Sarah Jenkins (Senior Grid Engineer)",
    rootCause: "Transient vegetation contact during wind gust sag on high-voltage transmission path.",
    recoveryPlan: "Dispatch crew for line inspection. Route grid loads around Feeder 4 breaker using BESS discharge.",
    notes: "Voltage fluctuations transiently corrected. SCADA diagnostics active.",
    timestamp: new Date().toISOString(),
    timeline: [
      { step: "Fault", timestamp: "21:30:12" },
      { step: "Incident Created", timestamp: "21:30:14" },
      { step: "AI Investigation", timestamp: "21:30:18" },
      { step: "Severity Classification", timestamp: "21:30:20" },
      { step: "Root Cause", timestamp: "21:30:24" },
      { step: "Recommended Action", timestamp: "21:30:30" }
    ]
  }
];
