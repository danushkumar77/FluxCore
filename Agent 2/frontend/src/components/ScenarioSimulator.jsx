import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { LineChart, AlertTriangle, ShieldCheck, Thermometer } from "lucide-react";

export default function ScenarioSimulator({ summary }) {
  const [cloudAdd, setCloudAdd] = useState(0.0);
  const [windMult, setWindMult] = useState(1.0);
  const [hydroMult, setHydroMult] = useState(1.0);
  const [demandMult, setDemandMult] = useState(1.0);
  
  const [simResults, setSimResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const solar = summary?.solar_generation || 0;
  const wind = summary?.wind_generation || 0;
  const hydro = summary?.hydro_generation || 0;
  const demand = summary?.weather?.grid_demand || 15000;

  const triggerSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("http://127.0.0.1:8001/scenario/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json.stringify({
          cloud_cover_add: parseFloat(cloudAdd),
          wind_speed_mult: parseFloat(windMult),
          reservoir_level_mult: parseFloat(hydroMult),
          grid_demand_mult: parseFloat(demandMult)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
      }
    } catch (e) {
      console.error("Simulation request failed:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const chartData = [
    { name: "Solar Output", Baseline: solar, Simulated: simResults ? simResults.predictions.solar : solar },
    { name: "Wind Output", Baseline: wind, Simulated: simResults ? simResults.predictions.wind : wind },
    { name: "Hydro Output", Baseline: hydro, Simulated: simResults ? simResults.predictions.hydro : hydro },
    { name: "Grid Demand", Baseline: demand, Simulated: simResults ? simResults.weather.grid_demand : demand }
  ];

  return (
    <div style={{ display: "flex", gap: "20px", width: "100%", padding: "20px", height: "100vh" }}>
      
      {/* Simulation Sliders (Left Side) */}
      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <LineChart size={18} style={{ color: "var(--color-wind)" }} />
          Scenario Configuration Sliders
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          
          {/* Cloud Cover Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Cloud Cover Spike</span>
              <span className="mono" style={{ fontWeight: "bold" }}>+{Math.round(cloudAdd * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="0.8" step="0.05" value={cloudAdd} 
              onChange={(e) => setCloudAdd(e.target.value)} 
              style={{ width: "100%" }}
            />
          </div>

          {/* Wind Multiplier Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Wind Speed Multiplier</span>
              <span className="mono" style={{ fontWeight: "bold" }}>x{parseFloat(windMult).toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0" max="2.0" step="0.1" value={windMult} 
              onChange={(e) => setWindMult(e.target.value)} 
              style={{ width: "100%" }}
            />
          </div>

          {/* Hydro Reservoir Multiplier Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Reservoir Level Multiplier</span>
              <span className="mono" style={{ fontWeight: "bold" }}>x{parseFloat(hydroMult).toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.2" max="1.5" step="0.05" value={hydroMult} 
              onChange={(e) => setHydroMult(e.target.value)} 
              style={{ width: "100%" }}
            />
          </div>

          {/* Grid Load Multiplier Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Grid Demand Multiplier</span>
              <span className="mono" style={{ fontWeight: "bold" }}>x{parseFloat(demandMult).toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.5" max="2.0" step="0.1" value={demandMult} 
              onChange={(e) => setDemandMult(e.target.value)} 
              style={{ width: "100%" }}
            />
          </div>

          <button
            onClick={triggerSimulation}
            disabled={isSimulating}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #00C8FF, #7C4DFF)",
              color: "#FFF",
              fontWeight: "bold",
              cursor: isSimulating ? "not-allowed" : "pointer",
              marginTop: "20px"
            }}
          >
            {isSimulating ? "RUNNING SIMULATOR..." : "RUN WHAT-IF SIMULATION"}
          </button>
        </div>
      </div>

      {/* Comparative Graphs & AI Assessment (Right Side) */}
      <div className="glass-card" style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        <h3 style={{ fontSize: "16px" }}>Simulation Impact Report</h3>

        {/* Recharts BarChart */}
        <div style={{ height: "200px", width: "100%", fontSize: "11px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: "#0B2D28", border: "1px solid rgba(255,255,255,0.05)" }} />
              <Legend />
              <Bar dataKey="Baseline" fill="rgba(255,255,255,0.2)" />
              <Bar dataKey="Simulated" fill="var(--color-wind)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Simulated Text Analysis Reports */}
        {simResults ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
            
            {/* Gen details */}
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
              <div style={{ fontWeight: "bold", color: "var(--color-wind)", textTransform: "uppercase", fontSize: "10px" }}>Generation Shift</div>
              <p style={{ marginTop: "4px", color: "var(--text-primary)" }}>{simResults.generation_impact}</p>
            </div>

            {/* Battery details */}
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
              <div style={{ fontWeight: "bold", color: "var(--color-battery)", textTransform: "uppercase", fontSize: "10px" }}>BESS Battery Impact</div>
              <p style={{ marginTop: "4px", color: "var(--text-primary)" }}>{simResults.battery_impact}</p>
            </div>

            {/* Grid capacity details */}
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
              <div style={{ fontWeight: "bold", color: "var(--color-solar)", textTransform: "uppercase", fontSize: "10px" }}>Transmission Line Stability</div>
              <p style={{ marginTop: "4px", color: "var(--text-primary)" }}>{simResults.stability_impact}</p>
            </div>

            {/* Emissions details */}
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
              <div style={{ fontWeight: "bold", color: "var(--color-ai)", textTransform: "uppercase", fontSize: "10px" }}>Net Carbon Saved</div>
              <p style={{ marginTop: "4px", color: "var(--text-primary)" }}>{simResults.emissions_impact}</p>
            </div>

            {/* Risk details */}
            <div style={{ background: "rgba(255, 87, 34, 0.08)", border: "1px solid rgba(255, 87, 34, 0.2)", padding: "10px", borderRadius: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
              <AlertTriangle size={16} style={{ color: "#FF5722" }} />
              <div>
                <div style={{ fontWeight: "bold", color: "#FF5722", textTransform: "uppercase", fontSize: "9px" }}>Critical Risk Audits</div>
                <p style={{ fontSize: "11px", color: "#FF8A65", marginTop: "2px" }}>{simResults.risk_assessment}</p>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, color: "var(--text-secondary)", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "8px", padding: "40px", fontSize: "13px" }}>
            Awaiting slider adjustments. Run the what-if simulation to output generation comparisons.
          </div>
        )}
      </div>

    </div>
  );
}

// Helper to handle JSON.stringify safely in JSX context
const json = { stringify: (obj) => JSON.stringify(obj) };
