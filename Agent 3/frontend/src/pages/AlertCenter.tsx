import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { ShieldAlert, CheckCircle, BellRing, AlertTriangle } from "lucide-react";

export default function AlertCenter() {
  const { alerts, triggerRefresh } = useBess();
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/alerts")
      .then(res => res.json())
      .then(data => setAllAlerts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [alerts]);

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/alerts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId })
      });
      if (res.ok) {
        fetchAlerts();
        triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Overview Block */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert style={{ color: "var(--critical-red)" }} /> BESS Alarm Operations Center</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Critical thermal limits, overvoltage thresholds, cell deviations, and microgrid interconnections.
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
          <BellRing size={14} /> Refresh Logs
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h4 style={{ marginBottom: "16px" }}>BESS Event Alerts Pipeline</h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {allAlerts.length > 0 ? (
            allAlerts.map(alt => {
              const isCritical = alt.severity === "CRITICAL";
              const isWarning = alt.severity === "WARNING";
              
              let borderCol = "rgba(0, 200, 255, 0.15)";
              let bgCol = "rgba(0, 200, 255, 0.01)";
              if (alt.active) {
                if (isCritical) {
                  borderCol = "var(--critical-red)";
                  bgCol = "rgba(244, 67, 54, 0.03)";
                } else if (isWarning) {
                  borderCol = "var(--warning-orange)";
                  bgCol = "rgba(255, 152, 0, 0.03)";
                }
              }
              
              return (
                <div 
                  key={alt.alert_id} 
                  style={{ 
                    border: `1px solid ${borderCol}`, 
                    borderRadius: "8px", 
                    padding: "16px",
                    backgroundColor: bgCol,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{ color: isCritical ? "var(--critical-red)" : (isWarning ? "var(--warning-orange)" : "var(--energy-cyan)"), marginTop: "2px" }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <span className="status-badge" style={{ 
                        backgroundColor: isCritical ? "rgba(244,67,54,0.15)" : (isWarning ? "rgba(255,152,0,0.15)" : "rgba(0,200,255,0.15)"),
                        color: isCritical ? "var(--critical-red)" : (isWarning ? "var(--warning-orange)" : "var(--energy-cyan)"),
                        fontSize: "0.65rem",
                        padding: "2px 8px"
                      }}>
                        {alt.severity}
                      </span>
                      
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "6px" }}>{alt.message}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Time: {new Date(alt.timestamp).toLocaleString()} | Source: {alt.source} | ID: {alt.alert_id}
                      </p>
                    </div>
                  </div>

                  {alt.active ? (
                    <button 
                      onClick={() => handleResolve(alt.alert_id)}
                      className="btn-primary" 
                      style={{ fontSize: "0.75rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <CheckCircle size={12} /> Clear Alarm
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={14} style={{ color: "var(--battery-green)" }} /> Resolved
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No BESS telemetry alarms raised in current cache.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
