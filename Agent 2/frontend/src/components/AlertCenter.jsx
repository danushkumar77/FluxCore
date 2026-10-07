import React from "react";
import { AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";

export default function AlertCenter({ alerts, alertHistory, onAcknowledge }) {
  return (
    <div style={{ display: "flex", gap: "20px", width: "100%", padding: "20px", height: "100vh" }}>
      
      {/* Active Alerts (Left Side) */}
      <div className="glass-card" style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={18} style={{ color: "#FF5722" }} />
          Active Grid Alarms
        </h3>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Real-time security flag violations. Grid safety requires prompt operator review and acknowledgment.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {alerts.length > 0 ? (
            alerts.map(a => (
              <div 
                key={a.id}
                style={{
                  background: a.severity === "CRITICAL" ? "rgba(255, 87, 34, 0.05)" : 
                              a.severity === "HIGH" ? "rgba(255, 145, 0, 0.05)" : "rgba(255, 235, 59, 0.03)",
                  border: `1px solid ${
                    a.severity === "CRITICAL" ? "#FF5722" : 
                    a.severity === "HIGH" ? "#FF9100" : "#FFEE58"
                  }`,
                  padding: "16px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: a.severity === "CRITICAL" ? "#FF5722" : 
                                  a.severity === "HIGH" ? "#FF9100" : "#FFEE58",
                      color: a.severity === "CRITICAL" || a.severity === "HIGH" ? "#FFF" : "#000"
                    }}>
                      {a.severity}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{a.source}</span>
                  </div>
                  <p style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", marginTop: "4px" }}>
                    {a.message}
                  </p>
                </div>

                <button 
                  onClick={() => onAcknowledge(a.id)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-secondary)",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <CheckCircle size={14} /> Clear Alert
                </button>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--color-battery)", border: "1px dashed rgba(0, 230, 118, 0.2)", borderRadius: "8px", padding: "40px", gap: "8px" }}>
              <ShieldCheck size={28} />
              <span>Grid Safety parameters nominal. No active alerts.</span>
            </div>
          )}
        </div>
      </div>

      {/* Alarm History Log (Right Side) */}
      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "bold" }}>Alarm History Log</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {alertHistory.slice(0, 20).map(a => {
            const date = new Date(a.timestamp);
            return (
              <div 
                key={a.id} 
                style={{ 
                  background: "rgba(255,255,255,0.01)", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid rgba(255,255,255,0.03)",
                  opacity: a.is_acknowledged ? 0.6 : 1
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)" }}>
                  <span>{a.source}</span>
                  <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: "11px", marginTop: "4px", color: "#FFF" }}>{a.message}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
