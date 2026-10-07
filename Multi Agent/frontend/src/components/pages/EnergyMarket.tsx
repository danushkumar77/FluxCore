import React from "react";
import { DollarSign, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const EnergyMarket = () => {
  const marketRates = [
    { time: "00:00", spotPrice: 22.4, carbonPrice: 85.0 },
    { time: "04:00", spotPrice: 18.5, carbonPrice: 85.0 },
    { time: "08:00", spotPrice: 45.2, carbonPrice: 85.2 },
    { time: "12:00", spotPrice: 32.4, carbonPrice: 85.4 },
    { time: "16:00", spotPrice: 58.0, carbonPrice: 85.4 },
    { time: "20:00", spotPrice: 72.5, carbonPrice: 85.5 },
    { time: "24:00", spotPrice: 35.1, carbonPrice: 85.2 }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Spot Rate</span>
            <p className="text-sm font-bold text-white">$42.50 / MWh</p>
          </div>
          <TrendingUp className="w-5 h-5 text-brand-cyan" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Carbon Price</span>
            <p className="text-sm font-bold text-white">$85.40 / Ton</p>
          </div>
          <Layers className="w-5 h-5 text-brand-purple" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Arbitrage Margin</span>
            <p className="text-sm font-bold text-brand-emerald">+$24.50 / MWh</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-brand-emerald" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Credits Traded</span>
            <p className="text-sm font-bold text-white">450 RECs</p>
          </div>
          <DollarSign className="w-5 h-5 text-brand-cyan" />
        </div>
      </div>

      {/* 2. Charts & Action logs split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Spot Price graph */}
        <div className="xl:col-span-2 p-4 glass-panel rounded-xl border border-white/5 h-80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-brand-cyan mb-2 uppercase tracking-wider">Wholesale Electricity Spot Price Curve</h4>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
                <Area type="monotone" dataKey="spotPrice" stroke="#06b6d4" fill="rgba(6,182,212,0.1)" name="Price ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trading Opportunities list */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3 h-80 overflow-y-auto">
          <h4 className="text-xs font-bold text-brand-cyan uppercase">Trading Strategy Optimizer</h4>
          <div className="space-y-2 pt-1">
            <div className="p-2.5 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald rounded">
              <span className="font-bold block uppercase text-[8px]">Opportunity [Rec: CHARGE]</span>
              <p className="text-[10px] text-slate-300 font-sans mt-1">Wholesale price is low ($18.50). Recommend charging BESS Unit 1 to capacity before solar peak curtailment sags.</p>
            </div>

            <div className="p-2.5 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded">
              <span className="font-bold block uppercase text-[8px]">Opportunity [Rec: ARBITRAGE]</span>
              <p className="text-[10px] text-slate-300 font-sans mt-1">Evening load peak is approaching ($72.50). Prepare BESS Unit 1 for 4.0 MW dispatch selling margins.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
