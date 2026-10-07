import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { Thermometer, ShieldCheck, Heart, ZapOff, Shield } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function HealthMonitor() {
  const { telemetry } = useBess();
  const [healthData, setHealthData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/battery/health")
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(err => console.error("Error fetching health:", err));

    fetch("http://127.0.0.1:8000/battery/history?limit=20")
      .then(res => res.json())
      .then(data => {
        if (data.telemetry) {
          const formatted = data.telemetry.reverse().map((t: any) => ({
            time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            voltage: t.avg_cell_voltage,
            temp: t.avg_cell_temp
          }));
          setHistory(formatted);
        }
      })
      .catch(err => console.error(err));
  }, [telemetry]);

  const soh = healthData?.soh_pct || 98.4;
  const risk = healthData?.risk_score || 12.5;
  const resistance = healthData?.resistance_mohm || 1.85;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "calc(100vh - 84px)", overflowY: "auto" }}>
      
      {/* Visual State Gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        
        <div className="mission-panel" style={{ padding: "20px", textAlign: "center" }}>
          <Heart size={28} style={{ color: "var(--battery-green)", marginBottom: "6px" }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block" }}>STATE OF HEALTH (SOH)</span>
          <p className="tech-font" style={{ fontSize: "1.75rem", fontWeight: 700, margin: "6px 0" }}>{soh.toFixed(2)} %</p>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Nominal Operating Band: 80% - 100%</span>
        </div>

        <div className="mission-panel" style={{ padding: "20px", textAlign: "center" }}>
          <Thermometer size={28} style={{ color: "var(--warning-orange)", marginBottom: "6px" }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block" }}>CELL IMPEDANCE (DCIR)</span>
          <p className="tech-font" style={{ fontSize: "1.75rem", fontWeight: 700, margin: "6px 0" }}>{resistance.toFixed(2)} mΩ</p>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Calculated via current pulse delta</span>
        </div>

        <div className="mission-panel" style={{ padding: "20px", textAlign: "center" }}>
          <ZapOff size={28} style={{ color: risk > 25 ? "var(--critical-red)" : "var(--energy-cyan)", marginBottom: "6px" }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block" }}>AGGREGATE RISK INDEX</span>
          <p className="tech-font" style={{ fontSize: "1.75rem", fontWeight: 700, margin: "6px 0", color: risk > 25 ? "var(--critical-red)" : "var(--text-primary)" }}>{risk.toFixed(1)}</p>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Evaluates temperature and DoD multipliers</span>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        
        {/* Cell Voltage Trend */}
        <div className="mission-panel" style={{ padding: "20px" }}>
          <h4 className="tech-font" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}><Shield size={14} style={{ color: "var(--energy-cyan)" }} /> CELL VOLTAGE DEVIATION TREND</h4>
          <div style={{ height: "200px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} />
                <YAxis domain={[3.0, 4.4]} stroke="var(--text-muted)" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "6px" }} />
                <Line type="monotone" dataKey="voltage" stroke="var(--energy-cyan)" strokeWidth={1.5} dot={false} name="Voltage (V)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Trend */}
        <div className="mission-panel" style={{ padding: "20px" }}>
          <h4 className="tech-font" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}><Thermometer size={14} style={{ color: "var(--warning-orange)" }} /> RACK TEMPERATURE GRADIENTS</h4>
          <div style={{ height: "200px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} />
                <YAxis stroke="var(--text-muted)" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--glass-border)", borderRadius: "6px" }} />
                <Line type="monotone" dataKey="temp" stroke="var(--warning-orange)" strokeWidth={1.5} dot={false} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
