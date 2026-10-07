import React, { useState } from "react";
import { SlidersHorizontal, Eye, Save, RotateCcw, ShieldCheck } from "lucide-react";

export const ConfigSettings = () => {
  const [profile, setProfile] = useState("development");
  const [telemetrySpeed, setTelemetrySpeed] = useState(3);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [flags, setFlags] = useState({
    useVectorMemory: true,
    useDeterministicRules: true,
    enableGeminiFallback: true,
    verboseWorkersLogging: false
  });

  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleToggle = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header controls */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Platform Configuration
          </h3>
          <p className="text-[10px] text-slate-400">Manage running parameters, system speeds, and neural fallback flags.</p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleSave}
            className="bg-brand-cyan hover:bg-brand-cyan/85 text-slate-950 px-3.5 py-1.5 rounded text-[10px] font-bold transition flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savedStatus ? "SAVED!" : "SAVE CONFIG"}</span>
          </button>
        </div>
      </div>

      {/* 2. Form Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* Left Column: Environmental Profiles & Speeds */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-4">
          <h4 className="font-bold text-white uppercase text-[10px] border-b border-white/5 pb-2">Operational Bounds</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Environment Profile</label>
              <div className="grid grid-cols-3 gap-2">
                {["development", "staging", "production"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setProfile(p)}
                    className={`py-1.5 rounded uppercase font-bold text-[9px] border transition ${
                      profile === p 
                        ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40" 
                        : "bg-white/5 text-slate-400 border-white/5 hover:text-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 block">Telemetry Dispatch Interval</label>
                <span className="text-brand-cyan font-bold">{telemetrySpeed}s</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={telemetrySpeed}
                onChange={(e) => setTelemetrySpeed(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 block">Simulation Accelerator</label>
                <span className="text-brand-cyan font-bold">{simulationSpeed}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Feature Flags switches */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-4">
          <h4 className="font-bold text-white uppercase text-[10px] border-b border-white/5 pb-2">Active Feature Flags</h4>
          
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white block font-semibold">Use Vector Memory</span>
                <p className="text-[9px] text-slate-400 font-sans mt-0.5">Enables storage and retrieval of incident history context.</p>
              </div>
              <input 
                type="checkbox" 
                checked={flags.useVectorMemory}
                onChange={() => handleToggle("useVectorMemory")}
                className="w-4 h-4 cursor-pointer accent-brand-cyan"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-white block font-semibold">Enable Deterministic Rules</span>
                <p className="text-[9px] text-slate-400 font-sans mt-0.5">Applies threshold limits for automatic protection sags.</p>
              </div>
              <input 
                type="checkbox" 
                checked={flags.useDeterministicRules}
                onChange={() => handleToggle("useDeterministicRules")}
                className="w-4 h-4 cursor-pointer accent-brand-cyan"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-white block font-semibold">Neural Model Reasoning Fallback</span>
                <p className="text-[9px] text-slate-400 font-sans mt-0.5">Triggers LLM validation check on safety rule bypass overrides.</p>
              </div>
              <input 
                type="checkbox" 
                checked={flags.enableGeminiFallback}
                onChange={() => handleToggle("enableGeminiFallback")}
                className="w-4 h-4 cursor-pointer accent-brand-cyan"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-white block font-semibold">Verbose Worker Threads Debugging</span>
                <p className="text-[9px] text-slate-400 font-sans mt-0.5">Increases database logging write frequency for execution states.</p>
              </div>
              <input 
                type="checkbox" 
                checked={flags.verboseWorkersLogging}
                onChange={() => handleToggle("verboseWorkersLogging")}
                className="w-4 h-4 cursor-pointer accent-brand-cyan"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
