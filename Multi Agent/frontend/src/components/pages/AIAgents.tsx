import React, { useState } from "react";
import { Cpu, TrendingUp, Sun, BatteryCharging, AlertOctagon, Wrench, ShieldAlert, Leaf } from "lucide-react";
import { motion } from "framer-motion";

export const AIAgents = () => {
  const [inspectedAgent, setInspectedAgent] = useState<any | null>(null);
  const [diagnosisState, setDiagnosisState] = useState<string>("");

  const agents = [
    {
      id: 1,
      name: "Demand Forecast Intelligence",
      icon: TrendingUp,
      color: "border-brand-cyan shadow-brand-cyan/5",
      metrics: [
        { label: "Current State", value: "Monitoring", status: "active" },
        { label: "Confidence", value: "94.8%", status: "healthy" },
        { label: "Forecast Accuracy", value: "98.1%", status: "healthy" },
        { label: "Latency", value: "14ms", status: "healthy" },
        { label: "Events Published", value: "1,200", status: "normal" }
      ]
    },
    {
      id: 2,
      name: "Renewable Energy Intelligence",
      icon: Sun,
      color: "border-brand-emerald shadow-brand-emerald/5",
      metrics: [
        { label: "Current State", value: "Analysis", status: "active" },
        { label: "Solar Forecast", value: "18.4 MW", status: "normal" },
        { label: "Wind Forecast", value: "12.1 MW", status: "normal" },
        { label: "Hydro Output", value: "8.5 MW", status: "normal" },
        { label: "Confidence", value: "91.2%", status: "healthy" }
      ]
    },
    {
      id: 3,
      name: "Battery Energy Intelligence",
      icon: BatteryCharging,
      color: "border-brand-purple shadow-brand-purple/5",
      metrics: [
        { label: "Current State", value: "Optimization", status: "active" },
        { label: "Charge Plan", value: "2.4 MW", status: "normal" },
        { label: "Discharge Plan", value: "0.0 MW", status: "normal" },
        { label: "RUL (Health)", value: "98.4% SOH", status: "healthy" },
        { label: "Temp Core", value: "25.4 C", status: "healthy" }
      ]
    },
    {
      id: 4,
      name: "Grid Reliability & Fault Agent",
      icon: AlertOctagon,
      color: "border-brand-rose shadow-brand-rose/5",
      metrics: [
        { label: "Current State", value: "Monitoring", status: "normal" },
        { label: "Fault Detection", value: "NO FAULTS", status: "healthy" },
        { label: "Voltage Index", value: "0.99 pu", status: "healthy" },
        { label: "Freq Stability", value: "50.01 Hz", status: "healthy" },
        { label: "Outage Risk", value: "LOW (1.2%)", status: "healthy" }
      ]
    },
    {
      id: 5,
      name: "Predictive Maintenance & Asset Agent",
      icon: Wrench,
      color: "border-brand-amber shadow-brand-amber/5",
      metrics: [
        { label: "Current State", value: "Monitoring", status: "normal" },
        { label: "Asset Monitored", value: "Transformer A", status: "normal" },
        { label: "Failure Prob", value: "2.4%", status: "healthy" },
        { label: "Health Score", value: "97.8 / 100", status: "healthy" },
        { label: "Queue status", value: "0 Pending", status: "healthy" }
      ]
    },
    {
      id: 6,
      name: "Economic Intelligence Agent",
      icon: Cpu,
      color: "border-brand-cyan shadow-brand-cyan/5",
      metrics: [
        { label: "Current State", value: "Idle", status: "normal" },
        { label: "Arbitrage Spread", value: "$24.50 / MWh", status: "healthy" },
        { label: "Carbon Offset", value: "4.2 Tons", status: "healthy" },
        { label: "Profit Today", value: "$1,890.00", status: "healthy" },
        { label: "Optimization Score", value: "96.4%", status: "healthy" }
      ]
    },
    {
      id: 7,
      name: "Cybersecurity Agent",
      icon: ShieldAlert,
      color: "border-brand-rose shadow-brand-rose/5",
      metrics: [
        { label: "Current State", value: "Monitoring", status: "active" },
        { label: "Threat Score", value: "0 / 100", status: "healthy" },
        { label: "Intrusions", value: "0 Blocks", status: "healthy" },
        { label: "IP Audits", value: "450/sec", status: "healthy" },
        { label: "API Integrity", value: "100%", status: "healthy" }
      ]
    },
    {
      id: 8,
      name: "Electric Vehicle Coordination Agent",
      icon: BatteryCharging,
      color: "border-brand-cyan shadow-brand-cyan/5",
      metrics: [
        { label: "Current State", value: "Optimization", status: "active" },
        { label: "Active Chargers", value: "12 Sessions", status: "normal" },
        { label: "Queue Load", value: "3 Cars", status: "normal" },
        { label: "V2G State", value: "Enabled", status: "healthy" },
        { label: "Renewable Share", value: "85.2%", status: "healthy" }
      ]
    },
    {
      id: 9,
      name: "Carbon Optimization Agent",
      icon: Leaf,
      color: "border-brand-emerald shadow-brand-emerald/5",
      metrics: [
        { label: "Current State", value: "Optimization", status: "active" },
        { label: "Intensity Offset", value: "145 g/kWh", status: "healthy" },
        { label: "Net Zero Target", value: "82% Met", status: "healthy" },
        { label: "CO2 Offset Today", value: "39.2 Tons", status: "healthy" }
      ]
    }
  ];

  const handleDiagnosis = (name: string) => {
    setDiagnosisState("evaluating");
    setTimeout(() => {
      setDiagnosisState("healthy");
    }, 1200);
  };

  const handleCloseModal = () => {
    setInspectedAgent(null);
    setDiagnosisState("");
  };

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto max-h-[85vh] p-1">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.id}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`p-5 glass-panel rounded-xl border flex flex-col justify-between ${agent.color} hover:bg-slate-900/60 transition shadow-lg`}
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white/5 rounded-lg text-brand-cyan border border-white/5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">{agent.name}</h3>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-3">
                  {agent.metrics.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-slate-400">{m.label}:</span>
                      <span className={`font-semibold ${
                        m.value === "Monitoring" || m.value === "Analysis" || m.value === "Optimization"
                          ? "text-brand-cyan animate-pulse font-bold"
                          : (m.value.includes("9") || m.value === "NO FAULTS" || m.value === "healthy" || m.value.includes("LOW")
                              ? "text-brand-emerald"
                              : "text-white")
                      }`}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Agent ID:FC-00{agent.id}</span>
                <span 
                  onClick={() => setInspectedAgent(agent)}
                  className="text-brand-cyan cursor-pointer hover:underline font-bold"
                >
                  Inspect Agent →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Inspected Agent Modal Backdrop */}
      {inspectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
          <div className="glass-panel border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition text-sm"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-cyan/15 rounded-lg border border-brand-cyan/30 text-brand-cyan">
                {React.createElement(inspectedAgent.icon, { className: "w-5 h-5" })}
              </div>
              <div>
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">{inspectedAgent.name}</h3>
                <span className="text-[9px] text-slate-500 block">SYSTEM AGENT ID: FC-00{inspectedAgent.id}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-3 text-xs">
              <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                This agent operates autonomously within the grid control loops, subscribing to `telemetry.updated` streams via the event broker, checking validation models, and emitting corresponding grid dispatch plans.
              </p>
              
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Runtime logs queue</span>
                <div className="p-2.5 bg-slate-950/60 border border-white/5 rounded text-[10px] space-y-1 font-mono">
                  <p className="text-brand-emerald">● [21:30:12] Ingested 1 SCADA packet</p>
                  <p className="text-slate-400">● [21:30:14] Model inference compiled</p>
                  <p className="text-slate-400">● [21:30:18] Emitted coordination command</p>
                </div>
              </div>

              {diagnosisState && (
                <div className={`p-2 rounded text-[10px] font-bold uppercase text-center border ${
                  diagnosisState === "evaluating"
                    ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/20 animate-pulse"
                    : "bg-brand-emerald/15 text-brand-emerald border-brand-emerald/20"
                }`}>
                  {diagnosisState === "evaluating" ? "● Diagnosis sweep active..." : "● Diagnostics completed: HEALTHY (100% integrity)"}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/5 flex space-x-2">
              <button 
                onClick={() => handleDiagnosis(inspectedAgent.name)}
                disabled={diagnosisState === "evaluating"}
                className="flex-1 bg-brand-cyan hover:bg-brand-cyan/85 disabled:opacity-50 text-slate-950 py-2 rounded text-[10px] font-bold transition uppercase"
              >
                Run Self-Diagnosis
              </button>
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded text-[10px] transition uppercase"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
