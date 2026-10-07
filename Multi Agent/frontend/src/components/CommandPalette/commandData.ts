export interface CommandData {
  id: string;
  name: string;
  category: "Navigation" | "AI Agents" | "Grid Operations" | "Simulations" | "Reports" | "Analytics" | "Assets" | "Knowledge Base" | "Platform";
  type: "page" | "agent" | "simulation" | "report" | "twin" | "settings" | "knowledge" | "maintenance";
  description: string;
  action: string;
  severity?: string;
}

export const ALL_COMMANDS: CommandData[] = [
  // Navigation
  { id: "nav-dash", name: "Go to Dashboard", category: "Navigation", type: "page", description: "Open executive mission control main panel", action: "page:dashboard" },
  { id: "nav-twin", name: "Go to Digital Twin", category: "Navigation", type: "twin", description: "Explore 3D substation layout twin visualizer", action: "page:grid_ops" },
  { id: "nav-map", name: "Go to Global Grid Map", category: "Navigation", type: "page", description: "View GIS map substation coordinates", action: "page:grid_ops" },
  { id: "nav-ai", name: "Go to AI Operations Center", category: "Navigation", type: "agent", description: "Manage active agent networks and states", action: "page:ai_ops" },
  { id: "nav-analytics", name: "Go to Analytics & Forecasts", category: "Navigation", type: "page", description: "Open Recharts actual vs predicted load profiles", action: "page:analytics" },
  { id: "nav-sustainability", name: "Go to Sustainability Dashboard", category: "Navigation", type: "page", description: "Check Net Zero goals and carbon offsets", action: "page:sustainability" },
  { id: "nav-settings", name: "Go to Platform Settings", category: "Navigation", type: "settings", description: "Configure system variables and WebSocket limits", action: "page:platform" },

  // AI Agents
  { id: "agt-demand", name: "Inspect Demand Forecast Agent", category: "AI Agents", type: "agent", description: "Audit XGBoost load forecasting predictions", action: "page:ai_ops" },
  { id: "agt-renew", name: "Inspect Renewable Intelligence Agent", category: "AI Agents", type: "agent", description: "Check weather-correlated generation levels", action: "page:ai_ops" },
  { id: "agt-battery", name: "Inspect Battery Energy Agent", category: "AI Agents", type: "agent", description: "Optimize cell charge and discharge dispatch plans", action: "page:ai_ops" },
  { id: "agt-reliability", name: "Inspect Grid Reliability Agent", category: "AI Agents", type: "agent", description: "Monitor Feeder 4 voltage sag limits", action: "page:ai_ops" },
  { id: "agt-maintenance", name: "Inspect Predictive Maintenance Agent", category: "AI Agents", type: "agent", description: "Calculate Remaining Useful Life (RUL)", action: "page:ai_ops" },
  { id: "agt-cyber", name: "Inspect Cybersecurity Agent", category: "AI Agents", type: "agent", description: "Verify SCADA protocol threat indicators", action: "page:ai_ops" },

  // Simulations
  { id: "sim-sag", name: "Run Voltage Sag Simulation", category: "Simulations", type: "simulation", description: "Trigger transient under-voltage event on Feeder 4", action: "sim:voltage_sag", severity: "medium" },
  { id: "sim-bess", name: "Run Battery (BESS) Offline Fault", category: "Simulations", type: "simulation", description: "Trigger battery cell thermal shutdown warning", action: "sim:bess_offline", severity: "high" },
  { id: "sim-overload", name: "Run Substation Overload Simulation", category: "Simulations", type: "simulation", description: "Inject peak load demand exceedances limit", action: "sim:grid_fault", severity: "critical" },

  // Reports
  { id: "rep-daily", name: "Generate Daily Operations Summary", category: "Reports", type: "report", description: "Compile SCADA voltage logs and dispatcher notes", action: "page:reports" },
  { id: "rep-carbon", name: "Generate Carbon Offsets & REC Audit", category: "Reports", type: "report", description: "Audit sustainability metrics report", action: "page:reports" },
  { id: "rep-maint", name: "Generate Maintenance Forecast Report", category: "Reports", type: "report", description: "Compile RUL degradation calendars", action: "page:reports" }
];
