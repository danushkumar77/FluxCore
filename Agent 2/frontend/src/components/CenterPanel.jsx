import React from "react";
import { Cpu } from "lucide-react";

export default function CenterPanel({ summary }) {
  // Extract state variables
  const solarGen = summary?.solar_generation || 0;
  const windGen = summary?.wind_generation || 0;
  const hydroGen = summary?.hydro_generation || 0;
  const totalGen = summary?.renewable_generation || 0;
  
  const weather = summary?.weather || {};
  const isNight = (weather?.solar_irradiance || 0) === 0;
  const windSpeed = weather?.wind_speed || 0;
  const batterySoc = weather?.battery_soc || 50;
  const gridDemand = weather?.grid_demand || 15000;
  
  // Calculate dynamic animations speeds
  // Wind turbine rotation duration (inverse of wind speed)
  const windRotationDuration = windSpeed > 3 ? `${Math.max(1, 15 - windSpeed)}s` : "0s";
  
  // Determine power flow active states
  const hasSolarFlow = solarGen > 500;
  const hasWindFlow = windGen > 500;
  const hasHydroFlow = hydroGen > 300;
  const isBatteryCharging = totalGen > gridDemand;
  const hasBatteryDischarge = !isBatteryCharging && batterySoc > 10 && totalGen < gridDemand;

  return (
    <div className="center-content">
      <div className="glass-card" style={{ flex: 1, minHeight: "450px", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Title / Legend */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={18} style={{ color: "var(--color-ai)" }} />
            Ecosystem Digital Twin
          </h2>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-solar)" }} /> Solar
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-wind)" }} /> Wind
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-hydro)" }} /> Hydro
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-battery)" }} /> Battery
            </span>
          </div>
        </div>

        {/* Digital Twin SVG Map */}
        <div style={{ flex: 1, position: "relative", background: "rgba(0,0,0,0.2)", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
          <svg viewBox="0 0 800 450" width="100%" height="100%" style={{ display: "block" }}>
            
            {/* Sky Background Gradient */}
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
              
              {/* Battery Charge Fill Gradient */}
              <linearGradient id="batteryGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#00C8FF" />
                <stop offset="100%" stopColor="#00E676" />
              </linearGradient>
            </defs>
            
            <rect width="800" height="450" fill="url(#skyGrad)" />
            
            {/* Stars (Night only) */}
            {isNight && (
              <>
                <circle cx="150" cy="50" r="1.5" fill="#FFF" opacity="0.8" />
                <circle cx="280" cy="80" r="1" fill="#FFF" opacity="0.5" />
                <circle cx="420" cy="40" r="2" fill="#FFF" opacity="0.9" />
                <circle cx="650" cy="70" r="1.5" fill="#FFF" opacity="0.7" />
                <circle cx="720" cy="110" r="1" fill="#FFF" opacity="0.4" />
              </>
            )}

            {/* Sun / Moon */}
            {isNight ? (
              <circle cx="100" cy="80" r="25" fill="#E0F2F1" opacity="0.9" filter="drop-shadow(0 0 10px rgba(224, 242, 241, 0.4))" />
            ) : (
              <circle cx="100" cy="80" r="30" fill="var(--color-solar)" className="sun-glow-anim" />
            )}

            {/* Clouds (Moving slightly) */}
            {!isNight && (
              <g opacity={weather.cloud_cover > 0.5 ? 0.8 : 0.4}>
                <path d="M 220 70 a 15 15 0 0 1 30 0 a 20 20 0 0 1 40 0 a 15 15 0 0 1 0 30 l -70 0 a 15 15 0 0 1 0 -30 z" fill="#80CBC4" />
                <path d="M 520 80 a 12 12 0 0 1 24 0 a 18 18 0 0 1 36 0 a 12 12 0 0 1 0 24 l -60 0 a 12 12 0 0 1 0 -24 z" fill="#80CBC4" opacity="0.7" />
              </g>
            )}

            {/* Mountains in background */}
            <path d="M -50 350 L 150 200 L 300 350 Z" fill="#031613" opacity="0.8" />
            <path d="M 200 350 L 380 180 L 550 350 Z" fill="#020f0d" />
            
            {/* Hydro Dam (Left/Middle Hills) */}
            <rect x="250" y="270" width="80" height="80" fill="#143e37" rx="4" />
            <path d="M 200 350 Q 250 250 270 270" stroke="var(--color-hydro)" strokeWidth="6" fill="none" />
            
            {/* Flowing Water Reservoir (Hydro Flow Animation) */}
            <path d="M 270 275 L 330 350" stroke="#0096FF" strokeWidth="8" fill="none" />
            {hasHydroFlow && (
              <path d="M 270 275 L 330 350" stroke="#FFF" strokeWidth="6" strokeDasharray="5,10" className="flow-water" fill="none" />
            )}

            {/* Solar Farm Arrays (Bottom Left) */}
            <g transform="translate(60, 290)">
              {/* Back row panel */}
              <polygon points="10,40 50,20 90,20 50,40" fill="#0d3b33" stroke="rgba(255,255,255,0.1)" />
              <line x1="50" y1="40" x2="50" y2="55" stroke="#80CBC4" strokeWidth="3" />
              
              {/* Front row panel */}
              <polygon points="40,65 90,40 140,40 90,65" fill="#0d3b33" stroke="var(--color-solar)" strokeWidth={solarGen > 2000 ? 1.5 : 0.5} />
              <line x1="90" y1="65" x2="90" y2="85" stroke="#80CBC4" strokeWidth="3" />
              <text x="35" y="98" fill="var(--color-solar)" fontSize="10" fontWeight="bold" className="mono">SOLAR: {solarGen.toFixed(0)} kW</text>
            </g>

            {/* Wind Farm (Center/Right Hills) */}
            <g transform="translate(480, 200)">
              {/* Turbine 1 */}
              <line x1="0" y1="120" x2="0" y2="40" stroke="#80CBC4" strokeWidth="4" />
              <g transform="translate(0, 40)">
                <circle cx="0" cy="0" r="4" fill="#FFF" />
                <g style={{ animation: `rotate-turbine-anim ${windRotationDuration} linear infinite`, transformOrigin: "0px 0px" }}>
                  <line x1="0" y1="0" x2="0" y2="-35" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                  <line x1="0" y1="0" x2="30" y2="18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                  <line x1="0" y1="0" x2="-30" y2="18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                </g>
              </g>

              {/* Turbine 2 (Smaller background) */}
              <line x1="80" y1="130" x2="80" y2="60" stroke="#80CBC4" strokeWidth="3" opacity="0.8" />
              <g transform="translate(80, 60)">
                <circle cx="0" cy="0" r="3" fill="#FFF" opacity="0.8" />
                <g style={{ animation: `rotate-turbine-anim ${windRotationDuration} linear infinite`, transformOrigin: "0px 0px" }} opacity="0.8">
                  <line x1="0" y1="0" x2="0" y2="-25" stroke="#FFF" strokeWidth="2" />
                  <line x1="0" y1="0" x2="21" y2="13" stroke="#FFF" strokeWidth="2" />
                  <line x1="0" y1="0" x2="-21" y2="13" stroke="#FFF" strokeWidth="2" />
                </g>
              </g>
              <text x="-40" y="148" fill="var(--color-wind)" fontSize="10" fontWeight="bold" className="mono">WIND: {windGen.toFixed(0)} kW</text>
            </g>

            {/* Hydro Dam Text */}
            <text x="240" y="388" fill="var(--color-hydro)" fontSize="10" fontWeight="bold" className="mono">HYDRO: {hydroGen.toFixed(0)} kW</text>

            {/* Battery Storage Box (Bottom Center) */}
            <g transform="translate(360, 310)">
              {/* Outer Shell */}
              <rect x="0" y="0" width="80" height="50" fill="rgba(11, 45, 40, 0.6)" stroke="var(--color-battery)" strokeWidth="2" rx="6" />
              {/* Battery Cap */}
              <rect x="80" y="18" width="6" height="14" fill="var(--color-battery)" rx="2" />
              
              {/* Fill level */}
              <rect x="5" y="5" width={`${(70 * batterySoc) / 100}`} height="40" fill="url(#batteryGrad)" rx="3" opacity="0.85" />
              
              {/* Battery SOC Text */}
              <text x="40" y="28" fill="#FFF" fontSize="11" fontWeight="bold" textAnchor="middle" className="mono">{batterySoc.toFixed(0)}%</text>
              <text x="40" y="62" fill="var(--color-battery)" fontSize="9" fontWeight="bold" textAnchor="middle" className="mono">BATT SOC</text>
            </g>

            {/* City Substation & Silhouette (Right Side) */}
            <g transform="translate(640, 270)">
              {/* City outlines */}
              <rect x="0" y="-30" width="25" height="110" fill="#0d2420" />
              <rect x="30" y="-60" width="30" height="140" fill="#061613" />
              <rect x="65" y="-10" width="20" height="90" fill="#091c18" />
              
              {/* City Windows (Yellow dots) */}
              <circle cx="10" cy="0" r="1" fill="#FDB813" />
              <circle cx="15" cy="0" r="1" fill="#FDB813" />
              <circle cx="10" cy="20" r="1" fill="#FDB813" />
              <circle cx="45" cy="-40" r="1.5" fill="#FDB813" />
              <circle cx="45" cy="-20" r="1.5" fill="#FDB813" />
              <circle cx="45" cy="0" r="1.5" fill="#FDB813" />
              <circle cx="50" cy="20" r="1.5" fill="#FDB813" />
              
              {/* Substation */}
              <rect x="-40" y="50" width="35" height="30" fill="#143e37" stroke="rgba(255,255,255,0.1)" rx="3" />
              {/* Lightning symbol */}
              <path d="M -22 55 L -26 65 L -20 65 L -24 75" stroke="#FDB813" strokeWidth="2" fill="none" />
              
              <text x="-35" y="98" fill="var(--text-primary)" fontSize="10" fontWeight="bold" className="mono">GRID: {gridDemand.toLocaleString()} kW</text>
            </g>

            {/* Transmission Lines (Paths connecting assets) */}
            {/* Solar to Substation */}
            <path d="M 170 340 L 400 340 L 600 320" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {hasSolarFlow && (
              <path d="M 170 340 L 400 340 L 600 320" fill="none" className="flow-power-solar" strokeWidth="2.5" />
            )}

            {/* Wind to Substation */}
            <path d="M 520 320 L 600 320" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {hasWindFlow && (
              <path d="M 520 320 L 600 320" fill="none" className="flow-power-wind" strokeWidth="2.5" />
            )}

            {/* Hydro to Substation */}
            <path d="M 330 330 L 600 320" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {hasHydroFlow && (
              <path d="M 330 330 L 600 320" fill="none" className="flow-power-hydro" strokeWidth="2.5" />
            )}

            {/* Battery to Substation (Bidirectional) */}
            <path d="M 440 330 L 600 320" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            {isBatteryCharging && (
              <path d="M 600 320 L 440 330" fill="none" className="flow-power-grid" strokeWidth="2.5" />
            )}
            {hasBatteryDischarge && (
              <path d="M 440 330 L 600 320" fill="none" className="flow-power-grid" strokeWidth="2.5" />
            )}
          </svg>
        </div>

        {/* Real-time Load Balance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Total Renewable Generation:</span>
            <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--color-wind)", marginTop: "2px" }}>
              {totalGen.toLocaleString()} kW
            </div>
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Net Grid Balance:</span>
            <div style={{ 
              fontSize: "16px", 
              fontWeight: "bold", 
              color: (totalGen - gridDemand) >= 0 ? "var(--color-battery)" : "#FF5722",
              marginTop: "2px" 
            }}>
              {(totalGen - gridDemand) >= 0 ? "+" : ""}{(totalGen - gridDemand).toLocaleString()} kW
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
