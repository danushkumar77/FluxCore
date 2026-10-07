import React, { useState } from "react";
import { Sun, Wind, Droplet, Battery, ShieldAlert, Cpu, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function OperationsCenter({ summary, historyList, pendingActions, onApprove, onReject, isRunning, onTriggerRun }) {
  const solar = summary?.solar_generation || 0;
  const wind = summary?.wind_generation || 0;
  const hydro = summary?.hydro_generation || 0;
  const total = summary?.renewable_generation || 0;
  const score = summary?.renewable_score || 0;
  const demand = summary?.weather?.grid_demand || 15000;
  const batterySoc = summary?.weather?.battery_soc || 50;
  const carbonOffsetKg = (total * 0.450).toFixed(1);
  const decision = summary?.decision || {};
  const reasoning = summary?.reasoning || "Running telemetry loops...";
  
  const [operatorComment, setOperatorComment] = useState("");

  const chartData = [...historyList]
    .reverse()
    .slice(-12)
    .map(h => {
      const date = new Date(h.timestamp);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Solar: h.solar_forecast,
        Wind: h.wind_forecast,
        Hydro: h.hydro_forecast
      };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", overflowY: "auto", height: "100vh" }}>
      
      {/* Top Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        
        {/* Solar Card */}
        <div className="glass-card" style={{ borderColor: "rgba(253, 184, 19, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Solar Output</span>
            <Sun size={16} style={{ color: "var(--color-solar)" }} />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--color-solar)", marginTop: "10px" }}>{solar.toLocaleString()} <span style={{ fontSize: "12px", color: "#FFF" }}>kW</span></h2>
        </div>

        {/* Wind Card */}
        <div className="glass-card" style={{ borderColor: "rgba(0, 200, 255, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Wind Output</span>
            <Wind size={16} style={{ color: "var(--color-wind)" }} />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--color-wind)", marginTop: "10px" }}>{wind.toLocaleString()} <span style={{ fontSize: "12px", color: "#FFF" }}>kW</span></h2>
        </div>

        {/* Hydro Card */}
        <div className="glass-card" style={{ borderColor: "rgba(0, 150, 255, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Hydro Output</span>
            <Droplet size={16} style={{ color: "var(--color-hydro)" }} />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--color-hydro)", marginTop: "10px" }}>{hydro.toLocaleString()} <span style={{ fontSize: "12px", color: "#FFF" }}>kW</span></h2>
        </div>

        {/* Battery Card */}
        <div className="glass-card" style={{ borderColor: "rgba(0, 230, 118, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Battery Storage</span>
            <Battery size={16} style={{ color: "var(--color-battery)" }} />
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--color-battery)", marginTop: "10px" }}>{batterySoc.toFixed(0)}% <span style={{ fontSize: "12px", color: "#FFF" }}>SOC</span></h2>
        </div>

        {/* Coverage Card */}
        <div className="glass-card" style={{ borderColor: "rgba(124, 77, 255, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Grid Cover</span>
            <span style={{ fontSize: "10px", color: "var(--color-ai)", fontWeight: "bold" }}>KPI</span>
          </div>
          <h2 style={{ fontSize: "24px", color: "var(--color-ai)", marginTop: "10px" }}>{score.toFixed(1)}%</h2>
        </div>

      </div>

      {/* Main Grid: Left Chart / Right AI control */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        
        {/* Forecast Trends Chart */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "320px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "bold" }}>Renewable Mix Trends</h3>
          <div style={{ flex: 1, width: "100%", fontSize: "11px" }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="time" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: "var(--card-bg-solid)", border: "1px solid var(--card-border)" }} />
                  <Area type="monotone" dataKey="Solar" stroke="var(--color-solar)" fill="rgba(253, 184, 19, 0.05)" />
                  <Area type="monotone" dataKey="Wind" stroke="var(--color-wind)" fill="rgba(0, 200, 255, 0.05)" />
                  <Area type="monotone" dataKey="Hydro" stroke="var(--color-hydro)" fill="rgba(0, 150, 255, 0.05)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                Awaiting telemetry runs...
              </div>
            )}
          </div>
        </div>

        {/* AI Selected Strategy Summary */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={16} style={{ color: "var(--color-ai)" }} />
            Active Strategy
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "18px", color: "var(--color-ai)", fontWeight: "bold" }}>
                {decision.name || "Plan A (Prioritize Solar)"}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4", marginTop: "8px" }}>
                {reasoning}
              </p>
            </div>
            
            <button
              onClick={onTriggerRun}
              disabled={isRunning}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #00C8FF, #7C4DFF)",
                color: "#FFF",
                fontWeight: "bold",
                cursor: isRunning ? "not-allowed" : "pointer",
                opacity: isRunning ? 0.6 : 1
              }}
            >
              {isRunning ? "Running..." : "Manual Strategy Run"}
            </button>
          </div>
        </div>

      </div>

      {/* Human-in-the-Loop Relays Queue */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={16} style={{ color: "var(--color-solar)" }} />
          Operator Approval Workflow Relays
        </h3>
        
        {pendingActions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pendingActions.map(act => (
              <div key={act.id} style={{
                background: "rgba(253, 184, 19, 0.04)",
                border: "1px solid rgba(253, 184, 19, 0.15)",
                padding: "16px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF" }}>
                    Action: {act.action}() (Run #{act.run_id})
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Parameters: {act.parameters}
                  </div>
                  {act.risk_analysis && (
                    <div style={{ fontSize: "11px", color: "#FF8A65", fontStyle: "italic", marginTop: "2px" }}>
                      ⚠️ Risk assessment: {act.risk_analysis}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Add operational notes..."
                    onChange={(e) => setOperatorComment(e.target.value)}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#FFF",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      width: "200px"
                    }}
                  />
                  <button 
                    onClick={() => { onApprove(act.id, operatorComment); setOperatorComment(""); }}
                    style={{
                      background: "var(--color-battery)",
                      border: "none",
                      color: "#000",
                      fontWeight: "bold",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => { onReject(act.id, operatorComment); setOperatorComment(""); }}
                    style={{
                      background: "#FF5722",
                      border: "none",
                      color: "#FFF",
                      fontWeight: "bold",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "30px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
            No pending dispatches requiring human approval.
          </div>
        )}
      </div>

    </div>
  );
}
