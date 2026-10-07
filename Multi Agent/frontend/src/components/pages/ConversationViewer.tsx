import React from "react";
import { MessageSquare, Cpu, ArrowRight, ShieldCheck } from "lucide-react";

export const ConversationViewer = () => {
  const negotiations = [
    { from: "DemandForecastAgent", to: "BatteryEnergyAgent", msg: "Predicting peak demand spike to 82.1 MW (+2.1%) starting at 16:00. Please confirm reserve battery capacity availability.", timestamp: "21:30:10" },
    { from: "BatteryEnergyAgent", to: "DemandForecastAgent", msg: "BESS Unit 1 capacity checked: SOC is 75.0%. Core cell temp is nominal (25.4C). Confirmed: Can inject up to 4.0 MW discharge.", timestamp: "21:30:12" },
    { from: "EconomicIntelligenceAgent", to: "BatteryEnergyAgent", msg: "Spot market price peaking at $72.50/MWh. Discharge approved: Optimal arbitrage spread confirmed ($24.50 profit margin/MWh).", timestamp: "21:30:15" },
    { from: "GridReliabilityAgent", to: "BatteryEnergyAgent", msg: "Line voltage Sag detected on Feeder 4 breaker path. Requesting BESS discharge starting immediately to bypass localized overload sags.", timestamp: "21:30:18" }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header diagnostics */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Multi-Agent Negotiation Board</h3>
            <p className="text-[10px] text-slate-400">Inter-agent messaging records trading battery capacities and load limits.</p>
          </div>
        </div>
      </div>

      {/* 2. Message timelines dialogue bubbles */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {negotiations.map((chat, idx) => (
          <div key={idx} className="p-3.5 bg-slate-900/40 rounded-xl border border-white/5 space-y-2">
            
            {/* From to badges */}
            <div className="flex flex-wrap items-center gap-2 text-[8px] font-bold">
              <span className="bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded border border-brand-cyan/30">
                {chat.from}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="bg-brand-purple/15 text-brand-purple px-2 py-0.5 rounded border border-brand-purple/30">
                {chat.to}
              </span>
              <span className="text-slate-500 ml-auto">{chat.timestamp}</span>
            </div>

            {/* Conversation message bubble */}
            <p className="text-slate-200 font-sans leading-relaxed text-[11px] pt-1">
              "{chat.msg}"
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};
