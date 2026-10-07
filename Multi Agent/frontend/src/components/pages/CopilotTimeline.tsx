import React from "react";
import { GitMerge, Activity, Server, Clock } from "lucide-react";
import { MOCK_LOGS } from "../../services/mockData";

export const CopilotTimeline = () => {
  const events = [
    { publisher: "TelemetryWorker", subscriber: "All Agents", topic: "telemetry.updated", priority: 3, latency: "1.2ms", correlationId: "c-48a-12", traceId: "t-98e-42" },
    { publisher: "DemandForecastAgent", subscriber: "Battery, Economic", topic: "demand.forecast.updated", priority: 3, latency: "14ms", correlationId: "c-48a-12", traceId: "t-98e-42" },
    { publisher: "GridReliabilityAgent", subscriber: "Orchestrator, BESS", topic: "grid.fault.detected", priority: 1, latency: "4ms", correlationId: "c-89f-21", traceId: "t-b9d-88" },
    { publisher: "BatteryEnergyAgent", subscriber: "Event Broker", topic: "battery.strategy.selected", priority: 2, latency: "8ms", correlationId: "c-89f-21", traceId: "t-b9d-88" }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header status */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <GitMerge className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Live Event Bus Flow</h3>
            <p className="text-[10px] text-slate-400">Continuous broker dispatch metrics auditing publisher latency queues.</p>
          </div>
        </div>
      </div>

      {/* 2. Events Stream list */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {events.map((ev, idx) => (
          <div key={idx} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl space-y-2 hover:border-brand-cyan/20 transition">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-brand-cyan font-bold text-[10px]">{ev.topic}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                ev.priority === 1 
                  ? "bg-brand-rose/10 text-brand-rose border-brand-rose/20 animate-pulse" 
                  : "bg-white/5 text-slate-400 border-white/5"
              }`}>
                Priority {ev.priority}
              </span>
            </div>

            {/* Ingestion metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] text-slate-400 pt-1 border-t border-white/5">
              <p>Publisher: <span className="text-white font-semibold">{ev.publisher}</span></p>
              <p>Consumer: <span className="text-white font-semibold">{ev.subscriber}</span></p>
              <p>Latency: <span className="text-brand-cyan font-bold">{ev.latency}</span></p>
              <p>Trace ID: <span className="text-slate-500 uppercase">{ev.traceId}</span></p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
