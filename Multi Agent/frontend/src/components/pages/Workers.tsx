import React from "react";
import { Sliders, CheckCircle, AlertCircle, RefreshCw, Cpu } from "lucide-react";
import { MOCK_WORKERS } from "../../services/mockData";

export const Workers = () => {
  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header diagnostics */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <Sliders className="w-4 h-4 mr-1.5" /> Background Worker Registry
          </h3>
          <p className="text-[10px] text-slate-400">Continuous asynchronous task loops executed by python multiprocessing engines.</p>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-500 uppercase block">Active Threads</span>
          <span className="text-sm font-bold text-white">8 / 8 RUNNING</span>
        </div>
      </div>

      {/* 2. Worker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_WORKERS.map((wk, i) => (
          <div key={i} className="p-4 glass-panel rounded-xl border border-white/5 hover:border-brand-cyan/20 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-white uppercase text-[10px] truncate max-w-[170px]">{wk.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${
                  wk.status === "running" 
                    ? "bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-pulse" 
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {wk.status}
                </span>
              </div>
              
              <div className="space-y-2 border-t border-white/5 pt-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">CPU Usage:</span>
                  <span className="text-brand-cyan font-bold">{wk.cpu.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand-cyan h-full" style={{ width: `${wk.cpu * 8}%` }} />
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Memory:</span>
                  <span className="text-white">{wk.memory} MB</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 text-[9px] text-slate-500 font-mono flex justify-between items-center">
              <span>Task Latency: {wk.executionTimeMs}ms</span>
              <span>Done: {wk.tasksCompleted}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
