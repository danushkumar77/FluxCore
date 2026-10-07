import React, { useEffect, useState } from "react";
import { useBess } from "../App";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap, Shield, Sun, Activity, Database, AlertCircle, RefreshCw, Terminal } from "lucide-react";

export default function OperationsCenter() {
  const { telemetry, agentState, alerts, policy } = useBess();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/battery/history?limit=15")
      .then(res => res.json())
      .then(data => {
        if (data.telemetry) {
          const formatted = data.telemetry.reverse().map((t: any) => ({
            time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            solar: t.solar_forecast_kw,
            load: t.demand_forecast_kw,
            price: t.market_price_usd
          }));
          setHistoryData(formatted);
        }
        
        if (data.decisions) {
          const mappedEvents = data.decisions.slice(0, 10).map((d: any) => ({
            id: d.decision_id.slice(0, 8),
            timestamp: new Date(d.timestamp).toLocaleTimeString(),
            message: `Selected ${d.selected_plan} (${d.explanation.substring(0, 45)}...)`,
            confidence: d.confidence
          }));
          setEvents(mappedEvents);
        }
      })
      .catch(err => console.error("Error loading operations history:", err));
  }, [telemetry]);

  const activeAlerts = alerts.filter(a => a.active);
  const soc = telemetry?.soc || 68.0;
  const soh = telemetry?.soh || 98.4;
  const power = telemetry?.active_power_kw || 0.0;
  const currentDraw = telemetry?.current_draw_a || 0.0;
  const avgTemp = telemetry?.avg_cell_temp || 25.0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "calc(100vh - 84px)", overflowY: "auto" }}>
      
      {/* Battery Fleet KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
        
        <div className="mission-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>TOTAL CAPACITY</span>
          <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "4px" }}>2.0 MWh</p>
        </div>

        <div className="mission-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>CURRENT SOC</span>
          <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "4px", color: "var(--battery-green)" }}>{soc.toFixed(1)}%</p>
        </div>

        <div className="mission-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>BATTERY SOH</span>
          <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "4px" }}>{soh.toFixed(1)}%</p>
        </div>

        <div className="mission-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>AVAILABLE DISPATCH</span>
          <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "4px", color: "var(--energy-cyan)" }}>{power.toFixed(0)} kW</p>
        </div>

        <div className="mission-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>ACTIVE STRATEGY</span>
          <p className="tech-font" style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "4px", color: "var(--ai-purple)" }}>{policy.replace("_", " ")}</p>
        </div>

        <div className="mission-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>CARBON REDUCTION</span>
          <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "4px" }}>{(power * 0.28).toFixed(1)} kg</p>
        </div>

      </div>

      {/* Graphs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "12px" }}>
        
        {/* Forecast Area Chart */}
        <div className="mission-panel" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 className="tech-font" style={{ display: "flex", alignItems: "center", gap: "6px" }}><Sun size={14} style={{ color: "var(--warning-orange)" }} /> LOAD VS GENERATION TIMELINE</h4>
          </div>

          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning-orange)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--warning-orange)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--energy-cyan)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--energy-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "6px" }} />
                <Area type="monotone" dataKey="solar" stroke="var(--warning-orange)" fill="url(#solarGrad)" name="Solar (kW)" />
                <Area type="monotone" dataKey="load" stroke="var(--energy-cyan)" fill="url(#loadGrad)" name="Load (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Grid State */}
        <div className="mission-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 className="tech-font" style={{ display: "flex", alignItems: "center", gap: "6px" }}><Database size={14} style={{ color: "var(--energy-cyan)" }} /> MICROGRID STABILITY</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Grid Frequency</span>
              <strong className="tech-font" style={{ color: "var(--battery-green)" }}>{telemetry?.frequency_hz.toFixed(2) || "60.00"} Hz</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Line Voltage</span>
              <strong className="tech-font">{telemetry?.grid_voltage_v.toFixed(1) || "480.0"} V</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Internal Temp</span>
              <strong className="tech-font" style={{ color: avgTemp > 38 ? "var(--warning-orange)" : "var(--text-primary)" }}>{avgTemp.toFixed(1)}°C</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Grid Tariff</span>
              <strong className="tech-font" style={{ color: "var(--energy-cyan)" }}>${telemetry?.market_price_usd.toFixed(2) || "45.00"}/MWh</strong>
            </div>
          </div>

          <div className="mission-panel" style={{ padding: "10px", border: "1px solid rgba(124, 77, 255, 0.2)", backgroundColor: "rgba(124, 77, 255, 0.02)", marginTop: "6px" }}>
            <span className="tech-font" style={{ fontSize: "0.65rem", color: "var(--ai-purple)", fontWeight: 600, display: "block" }}>AGENT RUN STATE</span>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              State machine transitioned to <strong>{agentState}</strong>. Evaluating optimization matrices under policy weights.
            </p>
          </div>
        </div>

      </div>

      {/* Events / Console Logs Ticker */}
      <div className="mission-panel" style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", minHeight: "180px" }}>
        <h4 className="tech-font" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}><Terminal size={14} style={{ color: "var(--ai-purple)" }} /> ACTIVE OPTIMIZATION AUDIT TIMELINE</h4>
        
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {events.map((evt, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <span className="tech-font" style={{ color: "var(--text-muted)" }}>[{evt.timestamp}]</span>
                <span className="tech-font" style={{ color: "var(--energy-cyan)" }}>[CID:{evt.id}]</span>
                <span>{evt.message}</span>
              </div>
              <span className="tech-font" style={{ color: "var(--battery-green)" }}>Confidence: {(evt.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
          {events.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              No BESS events logged in active database. Wait for loop scheduler.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
