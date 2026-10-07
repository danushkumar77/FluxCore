import React from "react";
import { Database, Search } from "lucide-react";

export default function MemoryExplorer({ historyList }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", overflowY: "auto", height: "100vh" }}>
      
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={18} style={{ color: "var(--color-wind)" }} />
            Long-Term SQLite Memory Explorer
          </h2>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Historical logs search index. The agent queries these entries in real time using cosine similarities to evaluate lessons learned.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "10px" }}>Timestamp</th>
                <th style={{ padding: "10px" }}>Irradiance</th>
                <th style={{ padding: "10px" }}>Wind Speed</th>
                <th style={{ padding: "10px" }}>Reservoir</th>
                <th style={{ padding: "10px" }}>Grid Demand</th>
                <th style={{ padding: "10px" }}>Battery SOC</th>
                <th style={{ padding: "10px" }}>Selected Strategy</th>
                <th style={{ padding: "10px" }}>Confidence</th>
                <th style={{ padding: "10px" }}>Carbon Offset</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length > 0 ? (
                historyList.map(h => {
                  const date = new Date(h.timestamp);
                  return (
                    <tr key={h.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", height: "40px" }} className="mono">
                      <td style={{ padding: "10px", color: "#FFF" }}>{date.toLocaleString()}</td>
                      <td style={{ padding: "10px" }}>{h.solar_irradiance} W/m²</td>
                      <td style={{ padding: "10px" }}>{h.wind_speed} m/s</td>
                      <td style={{ padding: "10px" }}>{h.reservoir_level}%</td>
                      <td style={{ padding: "10px" }}>{h.grid_demand?.toLocaleString()} kW</td>
                      <td style={{ padding: "10px" }}>{h.battery_soc?.toFixed(0)}%</td>
                      <td style={{ padding: "10px", color: "var(--color-ai)", fontWeight: "bold" }}>{h.reasoning?.slice(0, 30)}...</td>
                      <td style={{ padding: "10px", color: "var(--color-battery)" }}>{h.confidence}%</td>
                      <td style={{ padding: "10px", color: "#00E676" }}>{h.carbon_reduction}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No database memory entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
