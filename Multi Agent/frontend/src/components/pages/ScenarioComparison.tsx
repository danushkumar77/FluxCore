import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { GitCompare, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

export const ScenarioComparison = () => {
  const [selectedScenarios, setSelectedScenarios] = useState({
    a: "baseline",
    b: "optimized"
  });

  const comparisonData = [
    { name: "Risk Index", scenarioA: 65, scenarioB: 12 },
    { name: "Grid Cost ($)", scenarioA: 85, scenarioB: 42 },
    { name: "Carbon offset (Tons)", scenarioA: 15, scenarioB: 54 },
    { name: "Reliability %", scenarioA: 88, scenarioB: 98 }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header selection */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <GitCompare className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Multi-Scenario Analyzer</h3>
            <p className="text-[10px] text-slate-400">Perform side-by-side parameter comparisons between grid operating models.</p>
          </div>
        </div>

        <div className="flex space-x-4 text-[10px]">
          <p className="text-slate-400">Scenario A: <span className="text-brand-rose font-bold">Baseline SCADA</span></p>
          <p className="text-slate-400">Scenario B: <span className="text-brand-emerald font-bold">BESS Arbitrage Optimization</span></p>
        </div>
      </div>

      {/* 2. Side by side charts & Recommendation summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Comparison charts */}
        <div className="xl:col-span-2 p-4 glass-panel rounded-xl border border-white/5 h-80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Operational Metrics Comparison</h4>
          
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="scenarioA" fill="#ef4444" name="Baseline Grid" />
                <Bar dataKey="scenarioB" fill="#10b981" name="Optimized Arbitrage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations card */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3 h-80 overflow-y-auto">
          <h4 className="text-xs font-bold text-brand-cyan uppercase flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-brand-emerald animate-pulse" /> AI Strategic Recommendation
          </h4>
          <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
            Optimized Battery Arbitrage strategy reduces overall operational risk indices from 65 to 12. Localised carbon intensity is minimized by prioritizing PV solar farm dispatch during peak hours, saving approximately 39.0 metric tons. Grid reliability scores are boosted to 98% nominal stability limits.
          </p>
          <div className="p-2 bg-slate-900/60 rounded border border-white/5 text-[9px] text-slate-500 leading-normal">
            Financial Recommendation: <br />
            - Net cost saving: $4,300/day <br />
            - Battery degradation rate: curtail discharge if temp exceeds 45C
          </div>
        </div>

      </div>

    </div>
  );
};
