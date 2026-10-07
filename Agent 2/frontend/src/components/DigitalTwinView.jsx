import React, { useState } from "react";
import { Cpu, Info, ShieldAlert, Thermometer, Battery, Activity } from "lucide-react";

export default function DigitalTwinView({ summary }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const solarGen = summary?.solar_generation || 0;
  const windGen = summary?.wind_generation || 0;
  const hydroGen = summary?.hydro_generation || 0;
  const totalGen = summary?.renewable_generation || 0;
  
  const weather = summary?.weather || {};
  const isNight = (weather?.solar_irradiance || 0) === 0;
  const windSpeed = weather?.wind_speed || 0;
  const batterySoc = weather?.battery_soc || 50;
  const gridDemand = weather?.grid_demand || 15000;
  
  const sim = summary?.simulation || {
    solar: { irradiance: 0, cell_temp: 20, efficiency: 18.2, capacity: 10000, soh: 99.5 },
    wind: { wind_speed: 5.0, rotor_state: "IDLE", yaw_deviation: 0, capacity: 8000, soh: 98.8 },
    hydro: { reservoir_level: 80, penstock_flow: 20, hydraulic_head: 96, siltation: 12.4, capacity: 5000, soh: 99.2 },
    battery: { soc: 50, soh: 99.7, state: "STABLE", cell_temp: 22, capacity_mwh: 10.0 }
  };

  const windRotationDuration = windSpeed > 3 ? `${Math.max(1, 15 - windSpeed)}s` : "0s";
  
  const hasSolarFlow = solarGen > 500;
  const hasWindFlow = windGen > 500;
  const hasHydroFlow = hydroGen > 300;
  const isBatteryCharging = totalGen > gridDemand;
  const hasBatteryDischarge = !isBatteryCharging && batterySoc > 10 && totalGen < gridDemand;

  const assets = {
    solar: {
      name: "Solar Array Farm (10 MW)",
      color: "var(--color-solar)",
      metrics: [
        { label: "Irradiance", val: `${sim.solar.irradiance} W/m²` },
        { label: "Cell Temperature", val: `${sim.solar.cell_temp} °C` },
        { label: "Operating Efficiency", val: `${sim.solar.efficiency}%` },
        { label: "Current Generation", val: `${solarGen.toLocaleString()} kW` },
        { label: "State of Health (SOH)", val: `${sim.solar.soh.toFixed(3)}%` }
      ],
      insight: "Clean panels optimize scatter. High cell temps above 45°C trigger thermal loss coefficients."
    },
    wind: {
      name: "Wind Turbine Array (8 MW)",
      color: "var(--color-wind)",
      metrics: [
        { label: "Wind Velocity", val: `${sim.wind.wind_speed} m/s` },
        { label: "Rotor Status", val: sim.wind.rotor_state },
        { label: "Yaw System Offset", val: `${sim.wind.yaw_deviation}°` },
        { label: "Current Generation", val: `${windGen.toLocaleString()} kW` },
        { label: "State of Health (SOH)", val: `${sim.wind.soh.toFixed(3)}%` }
      ],
      insight: "Rotor yaw actively rotates vector alignment. Speeds exceeding 25m/s lock blades in storm park."
    },
    hydro: {
      name: "Hydro Catchment Dam (5 MW)",
      color: "var(--color-hydro)",
      metrics: [
        { label: "Reservoir Level", val: `${sim.hydro.reservoir_level}%` },
        { label: "Penstock Water Flow", val: `${sim.hydro.penstock_flow} m³/s` },
        { label: "Hydraulic Head Pressure", val: `${sim.hydro.hydraulic_head} m` },
        { label: "Dam Siltation Level", val: `${sim.hydro.siltation}%` },
        { label: "State of Health (SOH)", val: `${sim.hydro.soh.toFixed(3)}%` }
      ],
      insight: "Dispatch regulated by penstock valve positioning. Preserves 50 m3/s environmental flow."
    },
    battery: {
      name: "Li-Ion Battery Storage (10 MWh)",
      color: "var(--color-battery)",
      metrics: [
        { label: "State of Charge (SOC)", val: `${sim.battery.soc}%` },
        { label: "Cell Health Index (SOH)", val: `${sim.battery.soh.toFixed(3)}%` },
        { label: "Operating Mode", val: sim.battery.state },
        { label: "Core Cell Temp", val: `${sim.battery.cell_temp} °C` }
      ],
      insight: "Fast charging raises cell core temps. Operating in the 20-80% safety window protects life."
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", width: "100%", padding: "20px", height: "100vh" }}>
      
      {/* SVG Container (Left Side) */}
      <div className="glass-card" style={{ flex: 1.8, display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} style={{ color: "var(--color-wind)" }} />
          Operations SVG Digital Twin
        </h3>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Click directly on Solar array, Wind turbines, Hydro penstock, or Battery bank to view active parameters.
        </p>
        
        <div style={{ flex: 1, position: "relative", background: "rgba(0,0,0,0.25)", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
          <svg viewBox="0 0 800 450" width="100%" height="100%" style={{ display: "block" }}>
            {/* Defs */}
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                {isNight ? (
                  <>
                    <stop offset="0%" stopColor="#020e0c" />
                    <stop offset="100%" stopColor="#041a16" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#052c24" />
                    <stop offset="100%" stopColor="#041a16" />
                  </>
                )}
              </linearGradient>
            </defs>

            <rect width="800" height="450" fill="url(#skyGrad)" />
            
            {/* Sun / Moon */}
            {isNight ? (
              <circle cx="100" cy="80" r="25" fill="#E0F2F1" opacity="0.9" filter="drop-shadow(0 0 10px rgba(224, 242, 241, 0.4))" />
            ) : (
              <circle cx="100" cy="80" r="30" fill="var(--color-solar)" className="sun-glow-anim" />
            )}

            {/* Mountains */}
            <path d="M -50 350 L 150 200 L 300 350 Z" fill="#031613" opacity="0.8" />
            <path d="M 200 350 L 380 180 L 550 350 Z" fill="#020f0d" />
            
            {/* Dam */}
            <rect x="250" y="270" width="80" height="80" fill="#143e37" rx="4" style={{ cursor: "pointer" }} onClick={() => setSelectedAsset("hydro")} />
            <path d="M 270 275 L 330 350" stroke="#0096FF" strokeWidth="8" fill="none" style={{ cursor: "pointer" }} onClick={() => setSelectedAsset("hydro")} />
            {hasHydroFlow && (
              <path d="M 270 275 L 330 350" stroke="#FFF" strokeWidth="6" strokeDasharray="5,10" className="flow-water" fill="none" />
            )}

            {/* Solar Arrays */}
            <g transform="translate(60, 290)" style={{ cursor: "pointer" }} onClick={() => setSelectedAsset("solar")}>
              <polygon points="10,40 50,20 90,20 50,40" fill="#0d3b33" stroke="rgba(255,255,255,0.1)" />
              <polygon points="40,65 90,40 140,40 90,65" fill="#0d3b33" stroke="var(--color-solar)" strokeWidth={solarGen > 2000 ? 1.5 : 0.5} />
              <line x1="90" y1="65" x2="90" y2="85" stroke="#80CBC4" strokeWidth="3" />
            </g>

            {/* Wind Turbines */}
            <g transform="translate(480, 200)" style={{ cursor: "pointer" }} onClick={() => setSelectedAsset("wind")}>
              <line x1="0" y1="120" x2="0" y2="40" stroke="#80CBC4" strokeWidth="4" />
              <g transform="translate(0, 40)">
                <circle cx="0" cy="0" r="4" fill="#FFF" />
                <g style={{ animation: `rotate-turbine-anim ${windRotationDuration} linear infinite`, transformOrigin: "0px 0px" }}>
                  <line x1="0" y1="0" x2="0" y2="-35" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                  <line x1="0" y1="0" x2="30" y2="18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                  <line x1="0" y1="0" x2="-30" y2="18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                </g>
              </g>
            </g>

            {/* Battery Storage Box */}
            <g transform="translate(360, 310)" style={{ cursor: "pointer" }} onClick={() => setSelectedAsset("battery")}>
              <rect x="0" y="0" width="80" height="50" fill="rgba(11, 45, 40, 0.6)" stroke="var(--color-battery)" strokeWidth="2" rx="6" />
              <rect x="5" y="5" width={`${(70 * batterySoc) / 100}`} height="40" fill="url(#batteryGrad)" rx="3" opacity="0.85" />
              <text x="40" y="28" fill="#FFF" fontSize="11" fontWeight="bold" textAnchor="middle" className="mono">{batterySoc.toFixed(0)}%</text>
            </g>

            {/* City */}
            <g transform="translate(640, 270)">
              <rect x="0" y="-30" width="25" height="110" fill="#0d2420" />
              <rect x="30" y="-60" width="30" height="140" fill="#061613" />
              <rect x="-40" y="50" width="35" height="30" fill="#143e37" stroke="rgba(255,255,255,0.1)" rx="3" />
            </g>

            {/* Power Flow Dashing lines */}
            <path d="M 170 340 L 400 340 L 600 320" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {hasSolarFlow && <path d="M 170 340 L 400 340 L 600 320" fill="none" className="flow-power-solar" strokeWidth="2.5" />}
            
            <path d="M 520 320 L 600 320" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {hasWindFlow && <path d="M 520 320 L 600 320" fill="none" className="flow-power-wind" strokeWidth="2.5" />}
            
            <path d="M 330 330 L 600 320" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {hasHydroFlow && <path d="M 330 330 L 600 320" fill="none" className="flow-power-hydro" strokeWidth="2.5" />}
          </svg>
        </div>
      </div>

      {/* Asset Overlay Panel (Right Side) */}
      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {selectedAsset ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", color: assets[selectedAsset].color }}>
                {assets[selectedAsset].name}
              </h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {assets[selectedAsset].metrics.map((m, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", paddingBottom: "6px", borderBottom: "1px dashed rgba(255,255,255,0.03)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                  <span className="mono" style={{ fontWeight: "bold" }}>{m.val}</span>
                </div>
              ))}

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "12px", borderRadius: "8px", marginTop: "10px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Info size={12} /> AI Asset Insight
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4", marginTop: "6px" }}>
                  {assets[selectedAsset].insight}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)", textAlign: "center", gap: "10px" }}>
            <Activity size={32} className="rotate-turbine" />
            <span>Select an asset on the digital twin map to view real-time engineering telemetry and overrides.</span>
          </div>
        )}
      </div>

    </div>
  );
}
