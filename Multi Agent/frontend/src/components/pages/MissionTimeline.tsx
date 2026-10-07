import React from "react";
import { Clock, ShieldAlert, Zap, Battery, Wrench, RefreshCw, Check } from "lucide-react";

export const MissionTimeline = () => {
  const events = [
    { time: "21:30:12", type: "fault", name: "Feeder 4 Overcurrent Trip Detected", desc: "GridReliabilityAgent registered high overload current (112% rating).", icon: ShieldAlert, color: "text-brand-rose bg-brand-rose/10 border-brand-rose/20" },
    { time: "21:30:14", type: "incident", name: "Emergency Incident Created", desc: "Orchestrator created incident ticket inc-104, assigned to Sarah Jenkins.", icon: Zap, color: "text-brand-rose bg-brand-rose/10 border-brand-rose/20" },
    { time: "21:30:18", type: "ai_decision", name: "AI BESS Injection Recommendation", desc: "BatteryEnergyAgent recommended discharge BESS Unit 1 at 4.0 MW to bypass breaker load.", icon: Battery, color: "text-brand-purple bg-brand-purple/10 border-brand-purple/20" },
    { time: "21:30:24", type: "rule_engine", name: "Rule Engine Safety Approval", desc: "Rule Engine confirmed battery SOC (75.0%) and core temp (25.4C) are safe.", icon: RefreshCw, color: "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" },
    { time: "21:30:30", type: "action", name: "Discharge Active Command Sent", desc: "Orchestrator dispatched BESS Discharge signal via Event Bus broker.", icon: Battery, color: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20" }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header status */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Grid Mission Timeline</h3>
            <p className="text-[10px] text-slate-400">Chronological history logs auditing alarms, AI plans, and dispatcher overrides.</p>
          </div>
        </div>
      </div>

      {/* 2. Timeline sequence layout */}
      <div className="relative border-l border-white/10 pl-6 ml-4 space-y-5 py-2 pr-1">
        {events.map((ev, idx) => {
          const Icon = ev.icon;
          return (
            <div key={idx} className="relative">
              
              {/* Dot icon */}
              <div className={`absolute -left-9.5 top-0.5 p-1 rounded-full border ${ev.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Card wrapper */}
              <div className="p-3.5 glass-panel rounded-xl border border-white/5 space-y-1.5 max-w-xl hover:border-brand-cyan/20 transition">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-white uppercase truncate max-w-[280px]">{ev.name}</span>
                  <span className="text-slate-500 font-bold">{ev.time}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{ev.desc}</p>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
