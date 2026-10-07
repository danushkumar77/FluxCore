import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { Cpu, Activity, ShieldCheck, RefreshCw, Zap } from "lucide-react";

export default function SystemHealth() {
  const { telemetry } = useBess();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/system/status");
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [telemetry]);

  const stateMachine = health?.state_machine || {};
  const workers = health?.background_workers || {};
  const latencies = health?.performance_latency_ms || {};
  const websocket = health?.websocket || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Overview Block */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Activity style={{ color: "var(--battery-green)" }} /> Agent Diagnostics & Observability</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Heartbeat signals, background scheduler diagnostics, thread loops, and API gateway response latencies.
          </p>
        </div>
        <button onClick={fetchStatus} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* Workers & Websocket */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h4 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Cpu size={16} style={{ color: "var(--energy-cyan)" }} /> Background Worker Heartbeats</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
              {Object.entries(workers).map(([key, val]: any) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{key.replace("_", " ")}</span>
                  <span className="status-badge badge-nominal" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "24px" }}>
            <h4 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Zap size={16} style={{ color: "var(--ai-purple)" }} /> WebSocket Server Diagnostics</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Websocket State</span>
                <strong style={{ color: "var(--battery-green)" }}>{websocket.status || "LISTENING"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Connected Clients</span>
                <strong>{websocket.active_connections ?? 0} active</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Latencies metrics */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h4 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={16} style={{ color: "var(--battery-green)" }} /> Loop execution Latency metrics</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Object.entries(latencies).map(([key, val]: any) => {
              // Normalize latency representation up to 300ms max
              const widthPct = Math.min(100, (val / 300) * 100);
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                    <span style={{ textTransform: "capitalize" }}>{key}</span>
                    <span style={{ fontWeight: 600 }}>{val.toFixed(1)} ms</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${widthPct}%`, height: "100%", backgroundColor: "var(--energy-cyan)" }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(latencies).length === 0 && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
                No active latency log samples collected yet. Wait for a cycle completion.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
