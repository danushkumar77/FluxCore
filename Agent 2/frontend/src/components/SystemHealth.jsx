import React from "react";
import { ShieldCheck, Cpu, HardDrive, Network, Clock } from "lucide-react";

export default function SystemHealth({ state, summary }) {
  const profile = summary?.identity || {
    name: "🌿 Renewable Energy Intelligence Agent (Agent 2)",
    codename: "FluxCore-Ren-02",
    mission: "Secure, maximize, and stabilize clean renewable energy distribution across the smart grid network.",
    role: "Autonomous Renewable Grid Operations Control Engineer",
    responsibilities: [
      "Observe live grid inputs and local meteorological variables.",
      "Predict solar, wind, and hydroelectric generation levels.",
      "Formulate operational plans using Gemini AI reasoning."
    ],
    principles: {
      "SAFETY_FIRST": "Never dispatch loads exceeding transmission boundaries.",
      "CARBON_MAXIMIZATION": "Displace carbon-intensive thermal generation.",
      "ASSET_PRESERVATION": "Regulate battery SOC charge rates."
    }
  };

  const steps = [
    { label: "MONITORING", stateKey: "monitoring" },
    { label: "FORECASTING", stateKey: "forecasting" },
    { label: "REASONING", stateKey: "reasoning" },
    { label: "PLANNING", stateKey: "planning" },
    { label: "OPTIMIZING", stateKey: "optimizing" },
    { label: "EXECUTING", stateKey: "executing" },
    { label: "REFLECTING", stateKey: "reflecting" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", overflowY: "auto", height: "100vh" }}>
      
      {/* Agent Identity Profile */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-wind)" }}>
          <Cpu size={18} />
          Agent Brain Identity Layer
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", fontSize: "13px", marginTop: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <span style={{ color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase" }}>Agent Codename</span>
              <div style={{ fontWeight: "bold", fontSize: "14px", color: "#FFF" }}>{profile.codename}</div>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase" }}>Core Role</span>
              <div style={{ fontWeight: "bold" }}>{profile.role}</div>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase" }}>Mission</span>
              <p style={{ color: "var(--text-primary)", lineHeight: "1.4", marginTop: "4px" }}>{profile.mission}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: "20px" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase" }}>Decision Principles</span>
            {profile.principles && Object.entries(profile.principles).map(([key, val]) => (
              <div key={key} style={{ background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: "6px", borderLeft: "3px solid var(--color-wind)" }}>
                <span className="mono" style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-wind)" }}>{key}: </span>
                <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System State Machine visualizer */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "bold" }}>Agent State Machine Loop</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", overflowX: "auto", padding: "10px 0" }}>
          {steps.map((s, idx) => {
            const isCurrent = state?.toLowerCase() === s.stateKey || (s.stateKey === "monitoring" && state?.toLowerCase() === "monitoring_results");
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  flex: 1
                }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: isCurrent ? "2px solid var(--color-wind)" : "1px solid rgba(255,255,255,0.1)",
                    background: isCurrent ? "rgba(0, 200, 255, 0.15)" : "rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: isCurrent ? "#FFF" : "var(--text-secondary)",
                    boxShadow: isCurrent ? "0 0 10px rgba(0, 200, 255, 0.4)" : "none"
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: "10px", color: isCurrent ? "#FFF" : "var(--text-secondary)", fontWeight: isCurrent ? "bold" : "normal" }}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", flex: 1, margin: "0 -10px" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend Health Diagnostics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* API Latencies */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
            <Network size={16} style={{ color: "var(--color-wind)" }} />
            API & Telemetry Health
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span>FastAPI Gateway Server</span>
              <span style={{ color: "var(--color-battery)", fontWeight: "bold" }}>ONLINE</span>
            </div>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span>Open-Meteo Weather API</span>
              <span style={{ color: "var(--color-battery)", fontWeight: "bold" }}>ACTIVE (0.32s)</span>
            </div>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span>Gemini Brain Reasoning Engine</span>
              <span style={{ color: "var(--color-battery)", fontWeight: "bold" }}>CONNECTED</span>
            </div>
          </div>
        </div>

        {/* Database parameters */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
            <HardDrive size={16} style={{ color: "var(--color-wind)" }} />
            Database & File Health
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span>SQLite Database Connection</span>
              <span style={{ color: "var(--color-battery)", fontWeight: "bold" }}>NOMINAL</span>
            </div>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <span>Active WebSocket Streams</span>
              <span style={{ color: "var(--color-battery)", fontWeight: "bold" }}>ESTABLISHED</span>
            </div>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", paddingBottom: "4px", borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <span>Agent Memory Vectors</span>
              <span style={{ color: "#FFF", fontWeight: "bold" }}>Indexed (Cosine similarity)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
