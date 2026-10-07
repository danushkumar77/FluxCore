import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Thermometer, Wind, Eye, Sliders, Play, AlertOctagon, 
  Power, ShieldAlert, Cpu, RefreshCw, BarChart2
} from "lucide-react";

export default function DigitalTwin() {
  const { 
    telemetry, autonomousMode, setAutonomousMode, 
    coolingOverride, setCoolingOverride, breakerTripped, setBreakerTripped 
  } = useBess();
  
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loadingSim, setLoadingSim] = useState(false);
  const [containerData, setContainerData] = useState<any>(null);
  
  // Custom camera orientation variables
  const [rx, setRx] = useState(55);
  const [rz, setRz] = useState(-35);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/battery/assets")
      .then(res => res.json())
      .then(data => {
        if (data.sites && data.sites[0] && data.sites[0].containers[0]) {
          setContainerData(data.sites[0].containers[0]);
        }
      })
      .catch(err => console.error("Error loading BESS assets:", err));
  }, [telemetry]);

  const handleSimulate = async (scenario: string) => {
    setLoadingSim(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/battery/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container_id: "BESS-001", scenario })
      });
      const data = await res.json();
      setSimulationResult(data);
      
      // If scenario is grid outage or equipment failure, trigger overrides to mock active SCADA responses
      if (scenario === "GRID_OUTAGE" || scenario === "EQUIPMENT_FAILURE") {
        setBreakerTripped(true);
        setAutonomousMode(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSim(false);
    }
  };

  const status = breakerTripped ? "FAULT" : (telemetry?.status || containerData?.status || "IDLE");
  const soc = telemetry?.soc || containerData?.soc || 50.0;
  const power = breakerTripped ? 0.0 : (telemetry?.active_power_kw || containerData?.active_power_kw || 0.0);
  const avgTemp = telemetry?.avg_cell_temp || 25.0;

  // Fan speed class based on load & cooling manual inputs
  let fanClass = "";
  if (coolingOverride > 60 || avgTemp > 38 || status !== "IDLE") {
    fanClass = "fan-rotating-fast";
  } else if (coolingOverride > 20 || status !== "IDLE") {
    fanClass = "fan-rotating-slow";
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "12px", height: "calc(100vh - 84px)", overflow: "hidden" }}>
      
      {/* 3D Scene View */}
      <div className="mission-panel" style={{ display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        
        {/* Header telemetry overlays */}
        <div style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, display: "flex", gap: "12px" }}>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(7, 20, 31, 0.8)" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>CONTAINER ID</span>
            <span className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600 }}>BESS-001</span>
          </div>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(7, 20, 31, 0.8)" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>SOC LEVEL</span>
            <span className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--battery-green)" }}>{soc.toFixed(1)}%</span>
          </div>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(7, 20, 31, 0.8)" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", display: "block" }}>ACTIVE DISPATCH</span>
            <span className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--energy-cyan)" }}>{power.toFixed(0)} kW</span>
          </div>
        </div>

        {/* Rotational controls */}
        <div style={{ position: "absolute", bottom: "16px", left: "16px", zIndex: 10, display: "flex", gap: "6px" }}>
          <button onClick={() => setRz(prev => prev - 15)} className="btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Rotate Left</button>
          <button onClick={() => setRz(prev => prev + 15)} className="btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Rotate Right</button>
          <button onClick={() => { setRx(55); setRz(-35); }} className="btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Reset Camera</button>
        </div>

        {/* 3D Scene View Rendering */}
        <div className="scene-3d" style={{ flex: 1 }}>
          <div className="container-3d" style={{ transform: `rotateX(${rx}deg) rotateY(0deg) rotateZ(${rz}deg)` }}>
            
            {/* 3D Box Sides */}
            {/* Top Side */}
            <div className="face face-top">
              {containerData?.racks?.map((rack: any, rIdx: number) => (
                <div key={rack.rack_id} style={{ display: "flex", flexDirection: "column", gap: "6px", border: "1px solid rgba(0, 200, 255, 0.15)", padding: "4px", borderRadius: "4px" }}>
                  <span className="tech-font" style={{ fontSize: "0.55rem", color: "var(--text-secondary)", textAlign: "center" }}>RACK-{rIdx}</span>
                  {rack.modules?.map((mod: any) => (
                    <div 
                      key={mod.module_id}
                      onClick={() => setSelectedModule(mod)}
                      style={{ 
                        flex: 1, 
                        backgroundColor: selectedModule?.module_id === mod.module_id ? "rgba(0, 200, 255, 0.4)" : "rgba(0, 230, 118, 0.15)",
                        borderRadius: "2px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        border: selectedModule?.module_id === mod.module_id ? "1.5px solid var(--energy-cyan)" : "1px solid rgba(255,255,255,0.08)"
                      }}
                    >
                      MOD
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Front Side */}
            <div className="face face-front" style={{ padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Wind size={20} className={fanClass} style={{ color: "var(--energy-cyan)" }} />
                <span className="tech-font" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>EXHAUST FAN A</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Wind size={20} className={fanClass} style={{ color: "var(--energy-cyan)" }} />
                <span className="tech-font" style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>EXHAUST FAN B</span>
              </div>
            </div>

            {/* Left Side */}
            <div className="face face-left" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "10px" }}>
              <Zap size={24} style={{ color: "var(--warning-orange)", animation: status !== "IDLE" ? "pulse 1s infinite alternate" : "none" }} />
              <span className="tech-font" style={{ fontSize: "0.65rem", marginTop: "4px", color: "var(--text-secondary)" }}>INVERTER STRIP</span>
            </div>

          </div>

          {/* Glowing particle channel flows under the BESS */}
          <div style={{ position: "absolute", bottom: "15%", left: "10%", right: "10%", height: "2px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "1px" }}>
            {status === "CHARGING" && <div className="flow-dot" />}
            {status === "DISCHARGING" && <div className="flow-dot" style={{ animationDirection: "reverse" }} />}
          </div>
        </div>

        {/* Simulation Output Area */}
        <AnimatePresence>
          {simulationResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="mission-panel"
              style={{ margin: "16px", padding: "16px", border: "1px dashed var(--energy-cyan)", backgroundColor: "rgba(7, 20, 31, 0.9)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ color: "var(--energy-cyan)", fontSize: "0.9rem" }}>SCENARIO: {simulationResult.scenario}</h4>
                <button onClick={() => setSimulationResult(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>Dismiss</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", fontSize: "0.8rem" }}>
                <div>
                  <p style={{ marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)" }}>Strategy Selection:</span> <strong style={{ color: "var(--battery-green)" }}>{simulationResult.optimized_strategy}</strong></p>
                  <p style={{ marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)" }}>Economic Margins:</span> <span style={{ color: "var(--battery-green)", fontWeight: 600 }}>${simulationResult.financial_impact_usd.toFixed(2)}</span></p>
                  <p style={{ marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)" }}>Explanation:</span> {simulationResult.engineering_explanation}</p>
                </div>
                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: "12px" }}>
                  <p style={{ marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)" }}>Operator Command:</span> <strong style={{ color: "var(--warning-orange)" }}>{simulationResult.recommended_action}</strong></p>
                  <p style={{ marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)" }}>SOH Wear:</span> {simulationResult.battery_wear_pct.toFixed(5)}%</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Operator Settings & Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflowY: "auto" }}>
        
        {/* Module detail panel */}
        <div className="mission-panel" style={{ padding: "16px" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
            <Eye size={14} style={{ color: "var(--battery-green)" }} /> Segment Telemetry
          </h4>
          
          <AnimatePresence mode="wait">
            {selectedModule ? (
              <motion.div
                key={selectedModule.module_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}
              >
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Active Drawer</span>
                  <p className="tech-font" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{selectedModule.module_id}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {selectedModule.cells?.map((cell: any) => {
                    let tempColor = "var(--battery-green)";
                    if (cell.temperature > 38) tempColor = "var(--warning-orange)";
                    if (cell.temperature > 48) tempColor = "var(--critical-red)";
                    
                    return (
                      <div key={cell.cell_id} style={{ border: "1px solid rgba(255,255,255,0.04)", borderRadius: "4px", padding: "6px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                        <span className="tech-font" style={{ fontSize: "0.55rem", color: "var(--text-secondary)" }}>{cell.cell_id.replace("CELL-BESS-001-", "C-")}</span>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px", fontSize: "0.75rem", fontWeight: 600 }}>
                          <span>{cell.voltage.toFixed(2)}V</span>
                          <span style={{ color: tempColor }}>{cell.temperature.toFixed(1)}°C</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                Click a module on the 3D container model to load live cell parameters.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Human Override Controls */}
        <div className="mission-panel" style={{ padding: "16px" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
            <Sliders size={14} style={{ color: "var(--warning-orange)" }} /> Human Override Deck
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            
            {/* Breaker Switch */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.75rem", display: "block" }}>Main Circuit Breaker</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>{breakerTripped ? "FAULT ISOLATION" : "ONLINE CONNECTED"}</span>
              </div>
              <button 
                onClick={() => setBreakerTripped(!breakerTripped)}
                className={`btn-primary ${breakerTripped ? "override-active" : ""}`}
                style={{ fontSize: "0.7rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Power size={12} /> {breakerTripped ? "Reset Breaker" : "Trip Breaker"}
              </button>
            </div>

            {/* Cooling Override */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                <span>Aux Cooling Fans Duty</span>
                <span className="tech-font" style={{ fontWeight: 600 }}>{coolingOverride}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={coolingOverride}
                onChange={e => setCoolingOverride(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--energy-cyan)" }}
              />
            </div>
            
          </div>
        </div>

        {/* Microgrid Scenarios selector */}
        <div className="mission-panel" style={{ padding: "16px" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
            <Play size={14} style={{ color: "var(--energy-cyan)" }} /> Microgrid Scenarios
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "10px" }}>
            {[
              { id: "RENEWABLE_SURPLUS", name: "Solar Surplus Capture" },
              { id: "PEAK_DEMAND", name: "Peak Shaving Discharge" },
              { id: "GRID_OUTAGE", name: "Grid Feeder Outage" },
              { id: "CELL_OVERHEATING", name: "Thermal Runaway Override" },
              { id: "ELECTRICITY_PRICE_SPIKE", name: "LMP Price Spike Arbitrage" }
            ].map(sc => (
              <button
                key={sc.id}
                disabled={loadingSim}
                onClick={() => handleSimulate(sc.id)}
                className="btn-primary"
                style={{ fontSize: "0.75rem", padding: "6px", textAlign: "left" }}
              >
                {sc.name}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
