import React from "react";
import { Leaf, Award, BarChart3, TrendingDown, Layers } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const CarbonIntel = () => {
  const carbonForecast = [
    { time: "08:00", intensity: 155, fossilShare: 62 },
    { time: "12:00", intensity: 120, fossilShare: 45 },
    { time: "16:00", intensity: 135, fossilShare: 52 },
    { time: "20:00", intensity: 170, fossilShare: 70 },
    { time: "24:00", intensity: 145, fossilShare: 58 }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">CO2 Saved</span>
            <p className="text-sm font-bold text-brand-emerald">39.2 Tons</p>
          </div>
          <Award className="w-5 h-5 text-brand-emerald animate-bounce" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Carbon Intensity</span>
            <p className="text-sm font-bold text-white">145 g/kWh</p>
          </div>
          <Leaf className="w-5 h-5 text-brand-emerald" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Renewable Ratio</span>
            <p className="text-sm font-bold text-white">42.5%</p>
          </div>
          <Layers className="w-5 h-5 text-brand-cyan" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Fossil Fuel Share</span>
            <p className="text-sm font-bold text-brand-rose">57.5%</p>
          </div>
          <TrendingDown className="w-5 h-5 text-brand-rose" />
        </div>
      </div>

      {/* 2. Decarbonization Charts & Net Zero progress splits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Carbon forecast timeline chart */}
        <div className="xl:col-span-2 p-4 glass-panel rounded-xl border border-white/5 h-80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Carbon Intensity Forecast Curve (g/kWh)</h4>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={carbonForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
                <Area type="monotone" dataKey="intensity" stroke="#10b981" fill="rgba(16,185,129,0.1)" name="Intensity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net zero forecast details */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3 h-80 overflow-y-auto">
          <h4 className="text-xs font-bold text-brand-cyan uppercase">Net Zero Progress Audit</h4>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span>Grid Decarbonization Ratio</span>
                <span className="text-brand-emerald font-bold">42.5%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-emerald h-full" style={{ width: "42.5%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span>Fossil Fuel Offset Index</span>
                <span className="text-brand-cyan font-bold">39.2 / 100 Tons</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-cyan h-full" style={{ width: "39.2%" }} />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
