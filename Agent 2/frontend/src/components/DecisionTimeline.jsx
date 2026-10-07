import React, { useState } from "react";
import { History, Eye, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function DecisionTimeline({ traces }) {
  const [selectedTrace, setSelectedTrace] = useState(null);

  return (
    <div style={{ display: "flex", gap: "20px", width: "100%", padding: "20px", height: "100vh" }}>
      
      {/* List of Traces (Left Side) */}
      <div className="glass-card" style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={18} style={{ color: "var(--color-ai)" }} />
          AI Decision Trace Timeline
        </h3>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Audit trail of autonomous control runs. Click to trace observation vectors, memory matches, and goal evaluations.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {traces.length > 0 ? (
            traces.map(t => {
              const date = new Date(t.timestamp);
              const data = t.trace_data;
              return (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTrace(data)}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: selectedTrace?.run_id === data.run_id ? "1px solid var(--color-ai)" : "1px solid rgba(255,255,255,0.05)",
                    padding: "14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF" }}>
                      Run #{data.run_id} • {data.selected_action}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {date.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: t.status === "APPROVED" || t.status === "AUTO_EXECUTED" ? "rgba(0, 230, 118, 0.15)" : 
                                  t.status === "PENDING_APPROVAL" ? "rgba(253, 184, 19, 0.15)" : "rgba(255, 87, 34, 0.15)",
                      color: t.status === "APPROVED" || t.status === "AUTO_EXECUTED" ? "var(--color-battery)" : 
                             t.status === "PENDING_APPROVAL" ? "var(--color-solar)" : "#FF5722"
                    }}>
                      {t.status}
                    </span>
                    <span className="mono" style={{ fontSize: "12px", color: "var(--color-ai)", fontWeight: "bold" }}>
                      {data.goals_met?.overall_compatibility || 90}% Goals
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", fontSize: "12px" }}>
              No decision traces registered yet. Run forecasts to log audits.
            </div>
          )}
        </div>
      </div>

      {/* Trace Details Inspector (Right Side) */}
      <div className="glass-card" style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        {selectedTrace ? (
          <>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", color: "var(--color-ai)" }}>
                Trace Audit: Run #{selectedTrace.run_id}
              </h3>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Selected: {selectedTrace.selected_action}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "12px" }}>
              
              {/* Telemetry Observation */}
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Observation Vector</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "6px", marginTop: "4px" }} className="mono">
                  <div>Solar Irrad: {selectedTrace.observation.solar_irradiance} W/m²</div>
                  <div>Wind Speed: {selectedTrace.observation.wind_speed} m/s</div>
                  <div>Temperature: {selectedTrace.observation.temperature} °C</div>
                  <div>Grid Demand: {selectedTrace.observation.grid_demand?.toLocaleString()} kW</div>
                </div>
              </div>

              {/* Forecast Predictions */}
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>ML Generation Predictions</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "6px", marginTop: "4px" }} className="mono">
                  <div style={{ color: "var(--color-solar)" }}>Solar: {selectedTrace.prediction.solar_generation?.toFixed(0)} kW</div>
                  <div style={{ color: "var(--color-wind)" }}>Wind: {selectedTrace.prediction.wind_generation?.toFixed(0)} kW</div>
                  <div style={{ color: "var(--color-hydro)" }}>Hydro: {selectedTrace.prediction.hydro_generation?.toFixed(0)} kW</div>
                </div>
              </div>

              {/* Memory Retrieval matches */}
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>SQLite Matched Memory Matches</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  {selectedTrace.retrieved_memory && selectedTrace.retrieved_memory.length > 0 ? (
                    selectedTrace.retrieved_memory.map((m, idx) => (
                      <div key={idx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "8px", borderRadius: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)" }}>
                          <span>Match #{idx+1} ({m.timestamp?.split("T")[1]?.slice(0,5)})</span>
                          <span style={{ color: "var(--color-ai)" }}>Similarity: {((1.0 - m.distance)*100).toFixed(1)}%</span>
                        </div>
                        <div style={{ fontWeight: "bold", marginTop: "2px" }}>Plan: {m.selected_plan}</div>
                        <div style={{ fontStyle: "italic", fontSize: "10px", marginTop: "2px" }}>"{m.lessons_learned}"</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No matching memory. First initialization run.</div>
                  )}
                </div>
              </div>

              {/* Goal audits */}
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Goal Management Audit</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                  {selectedTrace.goals_met?.evaluations ? (
                    Object.entries(selectedTrace.goals_met.evaluations).map(([gKey, gEval]) => (
                      <div key={gKey} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.01)", padding: "6px 8px", borderRadius: "4px" }}>
                        <span style={{ textTransform: "capitalize" }}>{gKey.replace(/_/g, " ")}</span>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span className="mono" style={{ fontWeight: "bold" }}>{gEval.score}</span>
                          <span style={{
                            fontSize: "9px",
                            fontWeight: "bold",
                            color: gEval.status === "COMPLIANT" ? "var(--color-battery)" : "#FF5722"
                          }}>{gEval.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--text-secondary)" }}>Goal verification pending.</div>
                  )}
                </div>
              </div>

              {/* Gemini Reasoning */}
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>AI Core Decision Synthesis</span>
                <p style={{ marginTop: "4px", lineHeight: "1.4", fontStyle: "italic", color: "var(--text-secondary)", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  "{selectedTrace.reasoning}"
                </p>
              </div>

            </div>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", textAlign: "center" }}>
            Select a trace from the decision timeline to audit the AI reasoning log.
          </div>
        )}
      </div>

    </div>
  );
}
