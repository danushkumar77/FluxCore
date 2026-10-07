import React from "react";
import { BookOpen, ShieldAlert } from "lucide-react";

export default function KnowledgeCenter() {
  const rules = [
    {
      id: "SOLAR_CURTAILMENT_LIMIT",
      title: "Solar Irradiance Overload Boundary",
      desc: "If incoming solar irradiance exceeds 800 W/m² and net load demand coverage is met, the agent should curtail inverter dispatches or redirect power to storage to protect sub-transmission transformers.",
      severity: "MEDIUM"
    },
    {
      id: "WIND_CUTOUT_STORM_PARK",
      title: "Wind Turbine Cut-out Storm Safety",
      desc: "If meteorological wind speeds exceed 25 m/s, pitch yaw systems must feather blades and lock rotors ('STORM_PARKED') to prevent centripetal gearbox shears.",
      severity: "CRITICAL"
    },
    {
      id: "HYDRO_RESERVOIR_SPINNING_RESERVES",
      title: "Hydro Hydrological Pressure Safety",
      desc: "If catchment reservoir level falls below 20%, peaker generation is disabled to protect turbine heads from cavitation. If levels exceed 95%, automatic dam spillway gates are bypassed.",
      severity: "HIGH"
    },
    {
      id: "BATTERY_THERMAL_CELL_BOUNDS",
      title: "Battery Storage Bank Preservation",
      desc: "Deep discharge cycles below 15% SOC or high-C charging rates above 90% SOC are restricted by battery controller relays to preserve cells State of Health.",
      severity: "HIGH"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", overflowY: "auto", height: "100vh" }}>
      
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={18} style={{ color: "var(--color-solar)" }} />
            Autonomous Smart Grid Knowledge Base Rules
          </h2>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Regulatory and physics limits checked by the agent state machine to intercept unsafe dispatch strategies.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rules.map(r => (
            <div key={r.id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", padding: "14px", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "11px", color: "var(--color-wind)", fontWeight: "bold" }}>{r.id}</span>
                <span style={{
                  fontSize: "9px",
                  fontWeight: "bold",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  background: r.severity === "CRITICAL" ? "#FF5722" : r.severity === "HIGH" ? "#FF9100" : "#FFEE58",
                  color: r.severity === "CRITICAL" || r.severity === "HIGH" ? "#FFF" : "#000"
                }}>{r.severity} LIMIT</span>
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", marginTop: "6px" }}>{r.title}</h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4", marginTop: "4px" }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
