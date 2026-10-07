import React from "react";
import { BrainCircuit, Play, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export default function RightPanel({ summary, state, streamLog, isRunning }) {
  const decision = summary?.decision || {};
  const plans = summary?.decision_matrix?.plans || {};
  const reasoning = summary?.reasoning || "Analyzing grid telemetry...";
  const recommendations = summary?.recommendations || [];
  const warnings = summary?.warnings || [];

  return (
    <div className="right-sidebar">
      {/* AI Reasoning and Optimizer */}
      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BrainCircuit size={18} style={{ color: "var(--color-ai)" }} />
            AI Renewable Optimizer
          </h2>
          <span style={{ fontSize: "11px", color: "var(--color-ai)", fontWeight: "bold", textTransform: "uppercase" }}>
            Gemini Core
          </span>
        </div>

        {/* Streaming Thinking Steps / Log */}
        {isRunning && streamLog ? (
          <div style={{ background: "rgba(124, 77, 255, 0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(124, 77, 255, 0.1)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)" }}>
              <span>AI AGENT LIFECYCLE: {state.toUpperCase()}</span>
              <span>{streamLog.progress}%</span>
            </div>
            
            {/* Progress bar */}
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${streamLog.progress}%`, background: "var(--color-ai)" }} />
            </div>

            {/* Typewriter message */}
            <div style={{ fontSize: "13px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", minHeight: "24px" }} className="mono">
              <Cpu size={14} className="rotate-turbine" style={{ color: "var(--color-ai)" }} />
              <span>{streamLog.step}</span>
            </div>
          </div>
        ) : (
          /* Static Success Summary when not running */
          <div style={{ background: "rgba(0, 230, 118, 0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0, 230, 118, 0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={16} style={{ color: "var(--color-battery)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>
              Optimal Renewable Strategy Ready & Deployed
            </span>
          </div>
        )}

        {/* Selected Strategy Metrics */}
        {summary && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
            
            {/* Strategy Title */}
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Active Strategy</span>
              <h3 style={{ color: "var(--color-ai)", fontSize: "18px", marginTop: "2px" }}>
                {decision.name || "Plan A (Prioritize Solar)"}
              </h3>
            </div>

            {/* Strategy Scores Matrix */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Optimization Scores Matrix</span>
              <div className="matrix-grid">
                {decision.scores ? (
                  Object.entries(decision.scores).map(([label, val]) => (
                    <div key={label} className="matrix-cell">
                      <div className="matrix-label">{label}</div>
                      <div className="matrix-val" style={{ 
                        color: label === "Carbon" ? "var(--color-battery)" : 
                               label === "Stability" ? "var(--color-wind)" : 
                               label === "Cost" ? "var(--color-solar)" : "var(--text-primary)"
                      }}>{val}</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="matrix-cell"><div className="matrix-label">Cost</div><div className="matrix-val">85</div></div>
                    <div className="matrix-cell"><div className="matrix-label">Carbon</div><div className="matrix-val">90</div></div>
                    <div className="matrix-cell"><div className="matrix-label">Grid</div><div className="matrix-val">95</div></div>
                    <div className="matrix-cell"><div className="matrix-label">Batt</div><div className="matrix-val">80</div></div>
                    <div className="matrix-cell"><div className="matrix-label">Avail</div><div className="matrix-val">95</div></div>
                  </>
                )}
              </div>
            </div>

            {/* Gemini Engineering Reasoning */}
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Gemini Engineering Reasoning</span>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.4", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.03)", marginTop: "4px" }}>
                {reasoning}
              </p>
            </div>

            {/* Concrete Action Recommendations */}
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Dispatch Control Actions</span>
              <ul style={{ display: "flex", flexDirection: "column", gap: "6px", listStyleType: "none", marginTop: "6px" }}>
                {recommendations.map((rec, idx) => (
                  <li key={idx} style={{ 
                    fontSize: "12px", 
                    color: "var(--text-primary)", 
                    paddingLeft: "15px", 
                    position: "relative",
                    lineHeight: "1.3"
                  }}>
                    <span style={{ position: "absolute", left: "0", top: "5px", width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-ai)" }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Compliance Warnings Alert */}
            {warnings.length > 0 && (
              <div style={{ background: "rgba(255, 87, 34, 0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255, 87, 34, 0.2)", display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "5px" }}>
                <ShieldAlert size={16} style={{ color: "#FF5722", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "#FF5722", fontWeight: "bold", textTransform: "uppercase" }}>Safety Boundary Warning</div>
                  <ul style={{ listStyleType: "none", padding: 0, marginTop: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {warnings.map((w, idx) => (
                      <li key={idx} style={{ fontSize: "11px", color: "#FF8A65" }}>
                        • {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
