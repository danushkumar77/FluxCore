import React, { useState } from "react";
import { Terminal, ShieldAlert, Zap, RefreshCw, CheckCircle } from "lucide-react";
import { triggerSimulation } from "../../services/api";

export const SimulationLibrary = () => {
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  const scenarios = [
    { id: "transformer_failure", name: "Substation Transformer Failure", severity: "critical", desc: "Simulates absolute breakdown of main step-up coil windings. Triggers emergency load-shed protocols." },
    { id: "solar_offline", name: "PV Solar Farm Offline Sag", severity: "high", desc: "Simulates localized cloud cover or inverter breaker trip. Demands battery backup discharge." },
    { id: "battery_failure", name: "BESS Battery Storage Offline", severity: "high", desc: "Simulates thermal cell cutoff flag. CURTAILS active grid shaving capacity." },
    { id: "wind_drop", name: "Sudden Wind Turbine Drop", severity: "medium", desc: "Simulates rapid atmospheric sags, cutting wind farm generation by 75%." },
    { id: "demand_spike", name: "Industrial Zone Demand Spike", severity: "high", desc: "Simulates massive industrial loading. Checks peak forecasting limits." },
    { id: "blackout", name: "Total Grid Blackout Scenario", severity: "critical", desc: "Simulates high-voltage breaker trip. Triggers islanded microgrid recovery plans." },
    { id: "voltage_instability", name: "Line Voltage Instability Sag", severity: "medium", desc: "Simulates grid frequency fluctuations on Feeder 4 breaker sags." },
    { id: "cyber_attack", name: "SCADA Protocol Cyber Intrusion", severity: "critical", desc: "Simulates network protocol tampering. Tests Rule Engine safety overrides." },
    { id: "heat_wave", name: "Grid Heat Wave Overload", severity: "high", desc: "Simulates extreme ambient temperatures (42C), increasing load resistance and line losses." }
  ];

  const handleLaunch = async (id: string, severity: string) => {
    setTriggerStatus(id);
    try {
      const mockAssetId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      const res = await triggerSimulation(id, mockAssetId, severity);
      if (res.status === "success") {
        setTimeout(() => {
          setTriggerStatus(null);
          alert(`Grid Simulation Event Dispatched: ${id.replace("_", " ").toUpperCase()} successfully published to Event Bus.`);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setTriggerStatus(null);
    }
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header diagnostics */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2">
        <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
          <Terminal className="w-4 h-4 mr-1.5" /> Threat Scenario Injectors
        </h3>
        <p className="text-[10px] text-slate-400">Dispatch critical SCADA overrides onto the Event Bus to verify multi-agent recovery pipelines.</p>
      </div>

      {/* 2. Simulation options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isTriggering = triggerStatus === sc.id;
          const isCritical = sc.severity === "critical";

          return (
            <div key={sc.id} className="p-4 glass-panel rounded-xl border border-white/5 hover:border-brand-cyan/20 transition flex flex-col justify-between h-44">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
                    isCritical 
                      ? "bg-brand-rose/10 text-brand-rose border-brand-rose/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                      : "bg-brand-amber/10 text-brand-amber border-brand-amber/20"
                  }`}>
                    {sc.severity}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">SCENARIO ID: {sc.id}</span>
                </div>
                <h4 className="font-bold text-white uppercase text-[10px] mt-1">{sc.name}</h4>
                <p className="text-[9px] text-slate-400 font-sans mt-1.5 leading-relaxed">{sc.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-slate-500 text-[8px]">Ready to inject</span>
                
                <button 
                  onClick={() => handleLaunch(sc.id, sc.severity)}
                  disabled={triggerStatus !== null}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold transition border uppercase ${
                    isTriggering 
                      ? "bg-brand-rose/15 text-brand-rose border-brand-rose/30 animate-pulse" 
                      : isCritical 
                        ? "bg-brand-rose/10 text-brand-rose border-brand-rose/20 hover:bg-brand-rose/20" 
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {isTriggering ? "INJECTING..." : "LAUNCH SCENARIO"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
