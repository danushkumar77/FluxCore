import React, { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { MOCK_FORECAST_COMPARE } from "../../services/mockData";

export const ForecastCompare = () => {
  const [activeRange, setActiveRange] = useState<"yesterday" | "today" | "tomorrow">("today");

  // Simulate data adjustment based on range
  const data = MOCK_FORECAST_COMPARE.map((item) => {
    let scale = 1.0;
    if (activeRange === "yesterday") scale = 0.96;
    if (activeRange === "tomorrow") scale = 1.04;
    return {
      ...item,
      actual_load: +(item.actual_load * scale).toFixed(1),
      predicted_load: +(item.predicted_load * scale).toFixed(1),
      actual_gen: +(item.actual_gen * scale).toFixed(1),
      predicted_gen: +(item.predicted_gen * scale).toFixed(1)
    };
  });

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header controls */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1">
          {["yesterday", "today", "tomorrow"].map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range as any)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition ${
                activeRange === range 
                  ? "bg-brand-cyan text-slate-950" 
                  : "bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4 text-[10px]">
          <p className="text-slate-400">Mean Abs Error (MAPE): <span className="text-brand-emerald font-bold">1.8%</span></p>
          <p className="text-slate-400">Model Accuracy: <span className="text-brand-emerald font-bold">98.2%</span></p>
        </div>
      </div>

      {/* 2. Generation & Load comparison charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* Load Comparison area chart */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 h-80 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Actual vs Predicted Demand Load (MW)</h4>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Area type="monotone" dataKey="actual_load" stroke="#06b6d4" fill="rgba(6,182,212,0.1)" name="Actual Load" />
                <Area type="monotone" dataKey="predicted_load" stroke="#a855f7" fill="transparent" strokeDasharray="4 4" name="Predicted Load" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generation Comparison area chart */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 h-80 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-brand-emerald mb-2 uppercase tracking-wider">Actual vs Predicted Renewable Gen (MW)</h4>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Area type="monotone" dataKey="actual_gen" stroke="#10b981" fill="rgba(16,185,129,0.1)" name="Actual Gen" />
                <Area type="monotone" dataKey="predicted_gen" stroke="#f59e0b" fill="transparent" strokeDasharray="4 4" name="Predicted Gen" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
