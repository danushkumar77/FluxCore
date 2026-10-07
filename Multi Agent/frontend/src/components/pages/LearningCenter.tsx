import React from "react";
import { GraduationCap, Award, Cpu, ShieldCheck, Check } from "lucide-react";

export const LearningCenter = () => {
  const experiences = [
    { name: "DemandForecastAgent (Load forecasting)", level: 85, lessons: 142 },
    { name: "BatteryEnergyAgent (Arbitrage Optimization)", level: 92, lessons: 320 },
    { name: "GridReliabilityAgent (Breaker fault classification)", level: 98, lessons: 450 }
  ];

  const lessons = [
    { rule: "BESS charge throttling", detail: "Throttled charging past 40C core cell temperature, reducing battery SOH degradation coefficients by 12% in training sets.", timestamp: "2026-07-27" },
    { rule: "Peak demand spike curve fitting", detail: "XGBoost weights adjusted for industrial zones peak load predictions on hot weekdays (+2.1% adjustment factors).", timestamp: "2026-07-29" }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header status */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <GraduationCap className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">AI Learning & Experience Center</h3>
            <p className="text-[10px] text-slate-400">Verifying neural weights parameter changes and training datasets updates.</p>
          </div>
        </div>
      </div>

      {/* 2. Experience progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {experiences.map((exp, i) => (
          <div key={i} className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
            <h4 className="font-bold text-white uppercase text-[10px] truncate">{exp.name}</h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Experience Index</span>
                <span className="text-brand-cyan font-bold">{exp.level}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-cyan h-full" style={{ width: `${exp.level}%` }} />
              </div>
            </div>
            <p className="text-[9px] text-slate-500">Lessons Learned: {exp.lessons} files</p>
          </div>
        ))}
      </div>

      {/* 3. Lessons learned list */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
        <h4 className="font-bold text-brand-cyan uppercase">Vector Memory Lessons Log</h4>
        
        <div className="space-y-2">
          {lessons.map((ls, idx) => (
            <div key={idx} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl space-y-1 font-sans text-[11px] text-slate-300">
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-white uppercase mb-1">
                <span>{ls.rule}</span>
                <span className="text-slate-500">{ls.timestamp}</span>
              </div>
              <p className="leading-relaxed">{ls.detail}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
