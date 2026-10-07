import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { TelemetryMeasurement } from "../types";

export const TelemetryCharts = ({ history }: { history: TelemetryMeasurement[] }) => {
  // Format chart time labels - if history is empty, fall back to mock database states
  const chartData = (history.length >= 2 ? history : [
    { timestamp: new Date(Date.now() - 25000).toISOString(), active_power_mw: 80.4, frequency_hz: 50.00 },
    { timestamp: new Date(Date.now() - 20000).toISOString(), active_power_mw: 81.2, frequency_hz: 50.02 },
    { timestamp: new Date(Date.now() - 15000).toISOString(), active_power_mw: 79.8, frequency_hz: 49.98 },
    { timestamp: new Date(Date.now() - 10000).toISOString(), active_power_mw: 80.5, frequency_hz: 50.01 },
    { timestamp: new Date(Date.now() - 5000).toISOString(), active_power_mw: 80.4, frequency_hz: 50.03 }
  ]).map((h) => ({
    ...h,
    time: new Date(h.timestamp || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Generation & Load Output Area Chart */}
      <div className="p-4 glass-panel rounded-lg border border-white/5 flex flex-col h-60">
        <h4 className="text-xs font-bold text-brand-emerald mb-2 uppercase tracking-wider">Active Grid Load & Generation (MW)</h4>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
              <Area type="monotone" dataKey="active_power_mw" stroke="#10b981" fillOpacity={1} fill="url(#colorMw)" name="Active Load" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Frequency & Price Stability Chart */}
      <div className="p-4 glass-panel rounded-lg border border-white/5 flex flex-col h-60">
        <h4 className="text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Grid Frequency Stability (Hz)</h4>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={[49.8, 50.2]} tickCount={5} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
              <Area type="monotone" dataKey="frequency_hz" stroke="#06b6d4" fillOpacity={1} fill="url(#colorHz)" name="Frequency" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
