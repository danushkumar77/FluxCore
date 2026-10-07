import React from "react";
import { LineChart, BarChart, Server, Activity, ArrowUpRight } from "lucide-react";
import { MOCK_MODELS } from "../../services/mockData";

export const MLInfra = () => {
  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. MLOps KPI widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Models Registered</span>
          <p className="text-sm font-bold text-brand-cyan">12 Total</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Active Pipelines</span>
          <p className="text-sm font-bold text-brand-emerald">4 Deployments</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Avg Inference Latency</span>
          <p className="text-sm font-bold text-white">21.2 ms</p>
        </div>
        <div className="p-3.5 glass-panel rounded-xl border border-white/5">
          <span className="text-[9px] uppercase text-slate-400">Drift Alerts</span>
          <p className="text-sm font-bold text-brand-emerald">0 Warnings</p>
        </div>
      </div>

      {/* 2. Registered Model Table */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
        <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
          <Server className="w-4 h-4 mr-1.5" /> Model Registry & Deployments
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-2">Model Name</th>
                <th className="pb-2">Version</th>
                <th className="pb-2">Accuracy</th>
                <th className="pb-2">Recall / F1</th>
                <th className="pb-2">Inference Latency</th>
                <th className="pb-2">Drift %</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_MODELS.map((model, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="py-3 text-white font-semibold flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-2 text-brand-cyan" />
                    {model.name}
                  </td>
                  <td className="py-3 text-slate-400">{model.version}</td>
                  <td className="py-3 text-brand-emerald font-semibold">{model.accuracy.toFixed(3)}</td>
                  <td className="py-3 text-slate-400">{model.recall.toFixed(3)} / {model.f1.toFixed(3)}</td>
                  <td className="py-3 text-slate-300">{model.latencyMs} ms</td>
                  <td className={`py-3 ${model.driftPct > 3 ? "text-brand-amber font-semibold" : "text-brand-emerald"}`}>
                    {model.driftPct}%
                  </td>
                  <td className="py-3 text-right">
                    <span className="bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                      {model.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Preprocessing details */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
        <h4 className="font-bold text-brand-cyan uppercase">Feature Preprocessing Pipeline</h4>
        <p className="text-slate-400 text-[10px] leading-relaxed">
          All inference queries are processed sequentially: Telemetry Ingestion → Rolling Standard Scaler scaling → Lag features generator (T-1, T-2) → PCA feature selection. Output is cached for 120s TTL to prevent duplicate evaluation cycles.
        </p>
      </div>

    </div>
  );
};
