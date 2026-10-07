import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { History, Eye, Settings2, ShieldCheck, Zap } from "lucide-react";

export default function BottomPanel({ summary, historyList, toolLogs, reflections }) {
  const [activeTab, setActiveTab] = useState("tools"); // tools or memory

  // format chart data from history list
  const chartData = [...historyList]
    .reverse() // show chronological order
    .slice(-15) // show last 15 points
    .map(h => {
      const date = new Date(h.timestamp);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Solar: h.solar_forecast,
        Wind: h.wind_forecast,
        Hydro: h.hydro_forecast
      };
    });

  // Extract reflection variables
  const reflect = summary?.reflection || {};
  const learningScore = reflect.learning_score || 95;
  const drift = reflect.model_drift || 0.0;
  const lessons = reflect.lessons_learned || "System operating within nominal error tolerances (+/- 5%).";

  return (
    <div className="bottom-panel">
      
      {/* 1. Generation Forecast Trends Chart */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "220px" }}>
        <h3 style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
          <Zap size={14} style={{ color: "var(--color-wind)" }} />
          Forecast Trends (Last 15 Cycles)
        </h3>
        
        <div style={{ flex: 1, width: "100%", height: "100%", fontSize: "10px" }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-solar)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-solar)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-wind)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-wind)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHydro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-hydro)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-hydro)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ background: "var(--card-bg-solid)", border: "1px solid var(--card-border)", color: "#FFF" }} 
                  itemStyle={{ fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="Solar" stroke="var(--color-solar)" fillOpacity={1} fill="url(#colorSolar)" />
                <Area type="monotone" dataKey="Wind" stroke="var(--color-wind)" fillOpacity={1} fill="url(#colorWind)" />
                <Area type="monotone" dataKey="Hydro" stroke="var(--color-hydro)" fillOpacity={1} fill="url(#colorHydro)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
              Awaiting data runs...
            </div>
          )}
        </div>
      </div>

      {/* 2. Self-Reflection Engine */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
          <History size={14} style={{ color: "var(--color-ai)" }} />
          Self-Reflection & Drift Monitor
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            
            {/* Learning Score */}
            <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Learning Score</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: "var(--color-battery)" }}>{learningScore.toFixed(1)}</span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>/ 100</span>
              </div>
            </div>

            {/* Model Drift */}
            <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Estimated Drift</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: "bold", color: drift > 10 ? "#FF5722" : "var(--color-wind)" }}>{drift.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Lessons Learned text block */}
          <div style={{ flex: 1, background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.03)", padding: "8px 12px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "4px", minHeight: "60px", justifyContent: "center" }}>
            <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Lessons Learned Log</span>
            <p style={{ fontSize: "11px", color: "var(--text-primary)", lineHeight: "1.4", fontStyle: "italic" }}>
              "{lessons}"
            </p>
          </div>
        </div>
      </div>

      {/* 3. Memory Recall vs Tool Logs Tab Panel */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => setActiveTab("tools")}
              style={{
                background: "none", border: "none", outline: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: "bold",
                color: activeTab === "tools" ? "var(--color-battery)" : "var(--text-secondary)",
                borderBottom: activeTab === "tools" ? "2px solid var(--color-battery)" : "none",
                paddingBottom: "4px"
              }}
            >
              Tool Logs
            </button>
            <button 
              onClick={() => setActiveTab("memory")}
              style={{
                background: "none", border: "none", outline: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: "bold",
                color: activeTab === "memory" ? "var(--color-battery)" : "var(--text-secondary)",
                borderBottom: activeTab === "memory" ? "2px solid var(--color-battery)" : "none",
                paddingBottom: "4px"
              }}
            >
              Memory Recall
            </button>
          </div>
          <Settings2 size={14} style={{ color: "var(--text-secondary)" }} />
        </div>

        {/* Tab content area */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px" }}>
          {activeTab === "tools" ? (
            toolLogs.length > 0 ? (
              toolLogs.slice(0, 10).map((log, idx) => (
                <div key={idx} className="timeline-item" style={{ padding: "4px 0", borderLeftColor: log.status === "SUCCESS" ? "var(--color-battery)" : "#FF5722" }}>
                  <div className="timeline-dot" style={{ background: log.status === "SUCCESS" ? "var(--color-battery)" : "#FF5722", boxShadow: log.status === "SUCCESS" ? "0 0 8px var(--color-battery)" : "0 0 8px #FF5722" }} />
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#FFF" }}>
                      {log.tool_name}()
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {log.output}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", fontSize: "11px" }}>
                No tools executed yet.
              </div>
            )
          ) : (
            /* Memory tab: past matches retrieved by SQLite search */
            reflections.length > 0 ? (
              reflections.slice(0, 3).map((ref, idx) => (
                <div key={idx} style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  padding: "8px", 
                  borderRadius: "6px", 
                  border: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  fontSize: "11px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "10px" }}>
                    <span className="mono">MATCH #{idx+1} ({ref.forecast_time?.split("T")[1]?.slice(0,5)})</span>
                    <span style={{ color: "var(--color-battery)" }}>Score: {ref.learning_score}%</span>
                  </div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    Strategy Used: {ref.lessons_learned ? "Plan Optimized" : "Nominal"}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontStyle: "italic", marginTop: "2px" }}>
                    "Historical solar error was {ref.solar_error} kW, Wind error was {ref.wind_error} kW."
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", fontSize: "11px" }}>
                Memory engine scanning DB...
              </div>
            )
          )}
        </div>
      </div>

    </div>
  );
}
