import React from "react";
import { Sun, Wind, Droplet, Battery, ShieldAlert, Cpu } from "lucide-react";

export default function TopMetrics({ summary, state }) {
  // Safe defaults
  const solar = summary?.solar_generation || 0;
  const wind = summary?.wind_generation || 0;
  const hydro = summary?.hydro_generation || 0;
  const total = summary?.renewable_generation || 0;
  const score = summary?.renewable_score || 0;
  const confidence = summary?.confidence || 0;
  const batterySoc = summary?.weather?.battery_soc || 50;
  const gridDemand = summary?.weather?.grid_demand || 15000;
  
  // Calculate carbon offset (450g CO2 per kWh, converted to kg or metric tons)
  // Let's assume the generation is in kW, so total kW * 1 hour * 450g = grams offset.
  // Grams / 1000 = kg offset.
  const carbonOffsetKg = (total * 0.450).toFixed(1);

  return (
    <div className="top-bar glass-card">
      <div className="title-group">
        <div className="p-2 bg-emerald-950/50 rounded-lg border border-emerald-500/20" style={{ padding: "8px", background: "rgba(11, 45, 40, 0.4)", borderRadius: "8px", border: "1px solid rgba(0, 200, 255, 0.2)" }}>
          <Cpu size={24} style={{ color: "#7C4DFF" }} />
        </div>
        <div>
          <h1>🌿 Renewable Energy Intelligence Agent</h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>FluxCore Platform • Agent 2</span>
            <span style={{ 
              fontSize: "10px", 
              background: state === "Idle" ? "rgba(255,255,255,0.05)" : "rgba(0, 230, 118, 0.15)",
              color: state === "Idle" ? "var(--text-secondary)" : "var(--color-battery)",
              border: state === "Idle" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0, 230, 118, 0.3)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "bold"
            }}>
              SYSTEM STATUS: {state.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="kpi-container">
        {/* Solar Generation */}
        <div className="kpi-card" style={{ borderColor: "rgba(253, 184, 19, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-label">Solar Output</span>
            <Sun size={14} style={{ color: "var(--color-solar)" }} />
          </div>
          <span className="kpi-value" style={{ color: "var(--color-solar)" }}>{solar.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>kW</span></span>
        </div>

        {/* Wind Generation */}
        <div className="kpi-card" style={{ borderColor: "rgba(0, 200, 255, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-label">Wind Output</span>
            <Wind size={14} style={{ color: "var(--color-wind)" }} />
          </div>
          <span className="kpi-value" style={{ color: "var(--color-wind)" }}>{wind.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>kW</span></span>
        </div>

        {/* Hydro Generation */}
        <div className="kpi-card" style={{ borderColor: "rgba(0, 150, 255, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-label">Hydro Output</span>
            <Droplet size={14} style={{ color: "var(--color-hydro)" }} />
          </div>
          <span className="kpi-value" style={{ color: "var(--color-hydro)" }}>{hydro.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>kW</span></span>
        </div>

        {/* Total Renewable Offset */}
        <div className="kpi-card" style={{ borderColor: "rgba(0, 230, 118, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-label">Carbon Offset</span>
            <span style={{ fontSize: "10px", color: "var(--color-battery)", fontWeight: "bold" }}>CO₂ Saved</span>
          </div>
          <span className="kpi-value" style={{ color: "var(--color-battery)" }}>{carbonOffsetKg} <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>kg/h</span></span>
        </div>

        {/* Renewable mix percentage */}
        <div className="kpi-card" style={{ borderColor: "rgba(124, 77, 255, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-label">Grid Load Coverage</span>
            <Battery size={14} style={{ color: "var(--color-ai)" }} />
          </div>
          <span className="kpi-value" style={{ color: "var(--color-ai)" }}>{score.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
