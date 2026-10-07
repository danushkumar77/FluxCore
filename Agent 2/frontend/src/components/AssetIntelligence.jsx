import React from "react";
import { ShieldCheck, ShieldAlert, Settings, Wrench } from "lucide-react";

export default function AssetIntelligence({ summary }) {
  const sim = summary?.simulation || {
    solar: { capacity: 10000, efficiency: 18.2, soh: 99.5 },
    wind: { capacity: 8000, rotor_state: "IDLE", soh: 98.8 },
    hydro: { capacity: 5000, reservoir_level: 80, soh: 99.2 },
    battery: { capacity_mwh: 10.0, soc: 50, soh: 99.7 }
  };
  
  const solarGen = summary?.solar_generation || 0;
  const windGen = summary?.wind_generation || 0;
  const hydroGen = summary?.hydro_generation || 0;

  const assets = [
    {
      id: "solar",
      name: "Solar Array Farm",
      type: "Generation (Photovoltaic)",
      capacity: "10,000 kW",
      health: sim.solar.soh,
      current: `${solarGen.toLocaleString()} kW`,
      efficiency: `${sim.solar.efficiency}%`,
      status: sim.solar.soh > 95 ? "NOMINAL" : "MAINTENANCE_REQUIRED",
      recs: "Schedule automated inverter inspection to mitigate temperature efficiency drops."
    },
    {
      id: "wind",
      name: "Wind Turbine Field",
      type: "Generation (Aerodynamic)",
      capacity: "8,000 kW",
      health: sim.wind.soh,
      current: `${windGen.toLocaleString()} kW`,
      efficiency: sim.wind.rotor_state,
      status: sim.wind.soh > 95 ? "NOMINAL" : "ATTENTION_REQUIRED",
      recs: "Perform gearbox yaw alignment check; rotor vibration coefficients are slightly offset."
    },
    {
      id: "hydro",
      name: "Hydro Dam Penstocks",
      type: "Generation (Hydraulic Peaker)",
      capacity: "5,000 kW",
      health: sim.hydro.soh,
      current: `${hydroGen.toLocaleString()} kW`,
      efficiency: `${sim.hydro.reservoir_level}% Res`,
      status: sim.hydro.soh > 95 ? "NOMINAL" : "ATTENTION_REQUIRED",
      recs: "Preserve head pressure. Conduct siltation checks on turbine water catchment intake."
    },
    {
      id: "battery",
      name: "Battery Energy Storage (BESS)",
      type: "Storage (Chemical)",
      capacity: "10 MWh",
      health: sim.battery.soh,
      current: `${sim.battery.soc}% SOC`,
      efficiency: `${(sim.battery.soh * 0.9).toFixed(1)}% Roundtrip`,
      status: sim.battery.soh > 95 ? "NOMINAL" : "NOMINAL",
      recs: "Battery health stable. Restrict fast C-rate charging above 85% state of charge."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", overflowY: "auto", height: "100vh" }}>
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Wrench size={18} style={{ color: "var(--color-solar)" }} />
            Renewable Asset Intelligence Module
          </h2>
        </div>

        {/* Assets Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "12px" }}>Asset Name</th>
                <th style={{ padding: "12px" }}>Type</th>
                <th style={{ padding: "12px" }}>Max Capacity</th>
                <th style={{ padding: "12px" }}>Health Score</th>
                <th style={{ padding: "12px" }}>Current Output</th>
                <th style={{ padding: "12px" }}>Efficiency Index</th>
                <th style={{ padding: "12px" }}>Operational Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "16px 12px", fontWeight: "bold" }}>{asset.name}</td>
                  <td style={{ padding: "16px 12px", color: "var(--text-secondary)" }}>{asset.type}</td>
                  <td style={{ padding: "16px 12px", fontFamily: "var(--font-mono)" }}>{asset.capacity}</td>
                  <td style={{ padding: "16px 12px", fontWeight: "bold" }}>
                    <span style={{ color: asset.health > 99 ? "var(--color-battery)" : "var(--color-solar)" }}>
                      {asset.health.toFixed(3)}%
                    </span>
                  </td>
                  <td style={{ padding: "16px 12px", fontFamily: "var(--font-mono)" }}>{asset.current}</td>
                  <td style={{ padding: "16px 12px", color: "var(--text-secondary)" }}>{asset.efficiency}</td>
                  <td style={{ padding: "16px 12px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      background: asset.status === "NOMINAL" ? "rgba(0, 230, 118, 0.15)" : "rgba(253, 184, 19, 0.15)",
                      color: asset.status === "NOMINAL" ? "var(--color-battery)" : "var(--color-solar)"
                    }}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Asset Recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {assets.map(asset => (
          <div key={asset.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px", borderColor: asset.status === "NOMINAL" ? "rgba(255,255,255,0.05)" : "rgba(253, 184, 19, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "bold" }}>{asset.name} AI Diagnosis</h4>
              {asset.status === "NOMINAL" ? (
                <ShieldCheck size={16} style={{ color: "var(--color-battery)" }} />
              ) : (
                <ShieldAlert size={16} style={{ color: "var(--color-solar)" }} />
              )}
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4", marginTop: "4px" }}>
              {asset.recs}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
