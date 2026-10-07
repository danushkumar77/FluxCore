import React, { useState } from "react";
import { GitMerge, Layers, Search, RefreshCw, Trash2, ShieldAlert } from "lucide-react";
import { MOCK_LOGS } from "../../services/mockData";

export const EventBusCenter = () => {
  const [dlqRecords, setDlqRecords] = useState([
    { dlq_id: "dlq-89f-21", event_name: "battery.strategy.selected", reason: "Validation failed: battery_soc_pct is negative (-2.4)", failed_at: "21:18:24" },
    { dlq_id: "dlq-10a-32", event_name: "telemetry.updated", reason: "Schema violation: voltage_kv field type mismatch", failed_at: "21:20:10" }
  ]);

  const eventSchemas = [
    { name: "telemetry.updated", version: "1.0.0", producer: "TelemetryWorker", consumers: "All Agents", priority: 3 },
    { name: "demand.forecast.updated", version: "1.0.0", producer: "DemandForecastAgent", consumers: "Battery, Economic Agents", priority: 3 },
    { name: "grid.fault.detected", version: "1.0.0", producer: "GridReliabilityAgent", consumers: "Orchestrator, BESS, Workers", priority: 1 },
    { name: "orchestrator.command", version: "1.0.0", producer: "Orchestrator", consumers: "All Agents", priority: 1 }
  ];

  const clearDlq = () => {
    setDlqRecords([]);
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono">
      {/* 1. Queue Statistics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Events / Sec</span>
          <p className="text-sm font-bold text-brand-cyan">185 EPS</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Queue Status</span>
          <p className="text-sm font-bold text-brand-emerald">0 Active</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Retry Queue</span>
          <p className="text-sm font-bold text-white">0 Pending</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">DLQ Size</span>
          <p className={`text-sm font-bold ${dlqRecords.length > 0 ? "text-brand-rose" : "text-slate-400"}`}>
            {dlqRecords.length} Failed
          </p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Avg Latency</span>
          <p className="text-sm font-bold text-white">1.8 ms</p>
        </div>
      </div>

      {/* 2. Middle Splitted Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* Left Panel: Event Registry schemas */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <GitMerge className="w-4 h-4 mr-1.5" /> Schema Registry
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-2">Event Name</th>
                  <th className="pb-2">Ver</th>
                  <th className="pb-2">Producer</th>
                  <th className="pb-2 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {eventSchemas.map((schema, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="py-2 text-white font-semibold">{schema.name}</td>
                    <td className="py-2 text-slate-400">{schema.version}</td>
                    <td className="py-2 text-slate-400">{schema.producer}</td>
                    <td className="py-2 text-right text-brand-cyan">{schema.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Event Logs Timeline */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <Layers className="w-4 h-4 mr-1.5" /> Event Broker Stream
          </h3>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {MOCK_LOGS.map((log, idx) => (
              <div key={idx} className="p-2 bg-slate-900/40 rounded border border-white/5 text-[10px] flex justify-between items-start gap-4">
                <div>
                  <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                  <span className="text-brand-cyan font-bold mr-2">{log.source}:</span>
                  <span className="text-slate-300">{log.msg}</span>
                </div>
                <span className="text-slate-500 uppercase text-[9px]">{log.traceId}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Dead Letter Queue Inspector */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-xs font-bold uppercase text-brand-rose tracking-wider flex items-center">
            <ShieldAlert className="w-4 h-4 mr-1.5 animate-pulse" /> Dead Letter Queue (DLQ) Inspector
          </h3>
          {dlqRecords.length > 0 && (
            <button 
              onClick={clearDlq}
              className="text-[10px] bg-brand-rose/15 hover:bg-brand-rose/25 text-brand-rose px-2.5 py-1 rounded transition border border-brand-rose/25 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Flush DLQ</span>
            </button>
          )}
        </div>
        
        {dlqRecords.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs font-semibold">
            All outbound event schemas are valid. DLQ is clear.
          </div>
        ) : (
          <div className="space-y-2">
            {dlqRecords.map((rec, i) => (
              <div key={i} className="p-2.5 bg-brand-rose/5 border border-brand-rose/20 rounded text-[10px] flex flex-wrap justify-between items-center gap-2">
                <div>
                  <span className="text-slate-400 mr-2">[{rec.failed_at}]</span>
                  <span className="font-bold text-white mr-2">{rec.event_name}</span>
                  <span className="text-brand-rose font-medium">({rec.reason})</span>
                </div>
                <span className="text-slate-500 text-[9px] uppercase">{rec.dlq_id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
