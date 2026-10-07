import React from "react";
import { Eye, ShieldCheck, ChevronRight, Activity, HelpCircle, AlertOctagon, RefreshCw } from "lucide-react";

export const XAICenter = () => {
  const explanationSteps = [
    { label: "Telemetry Input", value: "voltage: 114.8 kV, load: 80.4 MW" },
    { label: "Deterministic Audit", value: "IEEE-1547 overvoltage check: PASSED" },
    { label: "AI Prediction Model", value: "XGBoost load prediction: 82.1 MW in 1 hr (+2.1% spike)" },
    { label: "Safety Bounds Guard", value: "Battery state limits checked: SOC 75.0% (>20% min)" },
    { label: "Emitted Command", value: "Curtailed charging. Dispatch 4.0 MW discharge." }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header status */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Eye className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Explainable AI (XAI) Audit Center</h3>
            <p className="text-[10px] text-slate-400">Verifying neural net decisions against strict physical power bounds.</p>
          </div>
        </div>
        <span className="text-[9px] bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded font-bold uppercase">
          XAI Level: 3 (Full Traceability)
        </span>
      </div>

      {/* 2. Visual Reasoning Pipeline Flow */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-4">
        <h4 className="font-bold text-white uppercase text-[10px] border-b border-white/5 pb-2">Active Reasoning Chain</h4>
        
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          {explanationSteps.map((step, idx) => (
            <div key={idx} className="flex items-center space-x-2 shrink-0">
              <div className="p-3 bg-slate-900/60 border border-white/5 rounded-lg w-52 space-y-1">
                <span className="text-[8px] text-brand-cyan font-bold block uppercase">STAGE 0{idx + 1}: {step.label}</span>
                <p className="text-[9px] text-slate-300 font-sans leading-normal truncate">{step.value}</p>
              </div>
              {idx < explanationSteps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Splitted Audit panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* Supporting criteria rules list */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h4 className="font-bold text-brand-cyan uppercase">Supporting Safety Standard Constraints</h4>
          <div className="space-y-2">
            <div className="p-2 bg-slate-900/40 border border-white/5 rounded flex justify-between items-center text-[10px]">
              <span className="text-white">IEEE-1547 Sag Limits</span>
              <span className="text-brand-emerald font-bold">PASSED (0.99 pu deviation)</span>
            </div>
            <div className="p-2 bg-slate-900/40 border border-white/5 rounded flex justify-between items-center text-[10px]">
              <span className="text-white">IEC-62619 BESS Temp Limit</span>
              <span className="text-brand-emerald font-bold">PASSED (25.4 C &lt; 60C limit)</span>
            </div>
            <div className="p-2 bg-slate-900/40 border border-white/5 rounded flex justify-between items-center text-[10px]">
              <span className="text-white">Grid Voltage Balance Range</span>
              <span className="text-brand-emerald font-bold">PASSED (+1.2% dev)</span>
            </div>
          </div>
        </div>

        {/* Alternative Outcomes evaluated */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h4 className="font-bold text-brand-rose uppercase">Alternative Strategies Evaluated</h4>
          <div className="space-y-2 text-[10px]">
            <div className="p-2 bg-slate-900/40 border border-white/5 rounded space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-300">Alt A: Discharge BESS at 6.0 MW</span>
                <span className="text-brand-rose uppercase text-[8px]">REJECTED: Temp Overrun Risk</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans mt-0.5">Cell temperatures predicted to breach 58C limit, violating IEC-62619 guidelines.</p>
            </div>

            <div className="p-2 bg-slate-900/40 border border-white/5 rounded space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-300">Alt B: Grid Load Curtailment</span>
                <span className="text-brand-rose uppercase text-[8px]">REJECTED: High Penalty Cost</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans mt-0.5">Shedding industrial load triggers $4,500/hr contract penalty fees.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
