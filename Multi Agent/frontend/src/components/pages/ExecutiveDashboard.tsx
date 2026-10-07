import React from "react";
import { Presentation, ShieldCheck, TrendingUp, Cpu, Heart, Activity } from "lucide-react";

export const ExecutiveDashboard = () => {
  const kpis = [
    { label: "Overall Grid Health", value: "98.2%", color: "text-brand-emerald", desc: "Stable voltage profile." },
    { label: "Reliability Index", value: "99.98%", color: "text-brand-cyan", desc: "No critical outages." },
    { label: "Financial Savings", value: "$4,300/day", color: "text-brand-emerald", desc: "From battery arbitrage." },
    { label: "Carbon Reduction", value: "39.2 Tons", color: "text-brand-emerald", desc: "Renewable priority dispatch." },
    { label: "Renewable Utilization", value: "85.4%", color: "text-brand-cyan", desc: "Curtailment minimized." },
    { label: "AI Prediction Accuracy", value: "98.2%", color: "text-brand-cyan", desc: "XGBoost Load Forecaster." },
    { label: "System Availability", value: "100.0%", color: "text-brand-emerald", desc: "All 8 workers online." },
    { label: "Asset Health Score", value: "94.8 / 100", color: "text-brand-emerald", desc: "Transformers core temp within bounds." }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header banner */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Presentation className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Executive Command Dashboard</h3>
            <p className="text-[10px] text-slate-400">Board-level indices auditing financial, carbon, and reliability performance.</p>
          </div>
        </div>
      </div>

      {/* 2. Board Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="p-4 glass-panel rounded-xl border border-white/5 flex flex-col justify-between h-32 hover:border-brand-cyan/20 transition">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block font-bold">{kpi.label}</span>
              <p className={`text-lg font-bold mt-1.5 ${kpi.color}`}>{kpi.value}</p>
            </div>
            <p className="text-[9px] text-slate-400 font-sans leading-normal">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. Strategic Summary */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2">
        <h4 className="font-bold text-white uppercase text-[10px]">Quarterly Strategic Objectives Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] pt-1">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[8px]">Goal 1: Carbon Reduction</span>
            <div className="flex justify-between items-center">
              <span>Progress: 82% of target</span>
              <span className="text-brand-emerald">On Track</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div className="bg-brand-emerald h-full" style={{ width: "82%" }} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[8px]">Goal 2: Battery Life Extension</span>
            <div className="flex justify-between items-center">
              <span>Cell SOH: 98.4%</span>
              <span className="text-brand-emerald">Optimal</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div className="bg-brand-purple h-full" style={{ width: "98.4%" }} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[8px]">Goal 3: Outage minimization</span>
            <div className="flex justify-between items-center">
              <span>MTTR: &lt; 2 minutes</span>
              <span className="text-brand-cyan">Exceeded</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div className="bg-brand-cyan h-full" style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
