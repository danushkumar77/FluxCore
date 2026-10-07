import React from "react";
import { CloudRain, Compass, Thermometer, Droplets, Gauge, Eye, Play } from "lucide-react";

export default function LeftPanel({ weather, onTriggerForecast, isRunning }) {
  const irrad = weather?.solar_irradiance ?? 0;
  const cloud = (weather?.cloud_cover ?? 0) * 100;
  const windSpd = weather?.wind_speed ?? 0;
  const windDir = weather?.wind_direction ?? 0;
  const temp = weather?.temperature ?? 0;
  const humid = weather?.humidity ?? 0;
  const rain = weather?.rainfall ?? 0;
  const pressure = weather?.atmospheric_pressure ?? 1013;
  const reservoir = weather?.reservoir_level ?? 80;
  const source = weather?.source ?? "Scanning API...";

  return (
    <div className="left-sidebar">
      {/* Real-time Telemetry Card */}
      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Compass size={18} style={{ color: "var(--color-wind)" }} />
            Weather Telemetry
          </h2>
          <span style={{ fontSize: "10px", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
            {source}
          </span>
        </div>

        {/* Core parameters list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
          
          {/* Solar Irradiance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Solar Irradiance</span>
              <span className="mono" style={{ color: "var(--color-solar)", fontWeight: "bold" }}>{irrad} W/m²</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (irrad / 1000) * 100)}%`, background: "var(--color-solar)" }} />
            </div>
          </div>

          {/* Cloud Cover */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Cloud Cover</span>
              <span className="mono" style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{cloud.toFixed(1)}%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cloud}%`, background: "var(--text-secondary)" }} />
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Wind Velocity</span>
              <span className="mono" style={{ color: "var(--color-wind)", fontWeight: "bold" }}>{windSpd.toFixed(2)} m/s ({windDir.toFixed(0)}°)</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (windSpd / 25) * 100)}%`, background: "var(--color-wind)" }} />
            </div>
          </div>

          {/* Reservoir Level */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Reservoir Level</span>
              <span className="mono" style={{ color: "var(--color-hydro)", fontWeight: "bold" }}>{reservoir.toFixed(1)}%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${reservoir}%`, background: "var(--color-hydro)" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "5px" }}>
            {/* Temperature */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px", alignItems: "center" }}>
              <Thermometer size={16} style={{ color: "#FF5722" }} />
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Temp</div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{temp.toFixed(1)} °C</div>
              </div>
            </div>

            {/* Humidity */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px", alignItems: "center" }}>
              <Droplets size={16} style={{ color: "#00E676" }} />
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Humidity</div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{humid.toFixed(0)}%</div>
              </div>
            </div>

            {/* Rainfall */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px", alignItems: "center" }}>
              <CloudRain size={16} style={{ color: "#00C8FF" }} />
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Rainfall</div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{rain.toFixed(2)} mm</div>
              </div>
            </div>

            {/* Pressure */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px", alignItems: "center" }}>
              <Gauge size={16} style={{ color: "#E0F2F1" }} />
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Pressure</div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{pressure.toFixed(1)} hPa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual control block */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button 
            onClick={onTriggerForecast}
            disabled={isRunning}
            style={{
              background: isRunning ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00C8FF, #7C4DFF)",
              border: "none",
              color: isRunning ? "var(--text-secondary)" : "#FFF",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: isRunning ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <Play size={16} fill={isRunning ? "none" : "#FFF"} />
            {isRunning ? "AGENT FORECAST RUNNING..." : "TRIGGER AUTONOMOUS AGENT RUN"}
          </button>
          <span style={{ fontSize: "10px", color: "var(--text-secondary)", textAlign: "center" }}>
            The agent runs autonomously every 30s. Click to force execution.
          </span>
        </div>
      </div>
    </div>
  );
}
