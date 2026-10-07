import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Award, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface CarbonIntelProps {
  telemetry: any;
}

export default function CarbonIntel({ telemetry }: CarbonIntelProps) {
  const trendData = Array.from({ length: 12 }, (_, idx) => {
    const hour = 8 + idx;
    const solar = Math.max(0.0, Math.sin((hour - 6) * Math.PI / 12) * 450);
    const gridImport = Math.max(50.0, 600.0 - solar);
    const co2Saved = solar * 0.385;

    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      'Solar Gen (kW)': Math.round(solar),
      'CO2 Saved (kg)': Math.round(co2Saved),
      'Grid Import (kW)': Math.round(gridImport)
    };
  });

  return (
    <div className="p-8 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded relative overflow-hidden glow-profit">
          <div className="absolute top-0 right-0 p-3 text-gridProfit bg-gridProfit bg-opacity-10 rounded-bl">
            <Leaf className="w-5 h-5 animate-bounce" />
          </div>
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">CO₂ Emissions Avoided</span>
          <h3 className="text-3xl font-extrabold text-gridProfit mt-2 custom-font-mono">
            {telemetry.co2_avoided.toFixed(1)} kg
          </h3>
          <span className="text-[10px] text-slate-400 block mt-2">Cumulative total today</span>
        </div>

        <div className="glass-panel p-6 rounded relative overflow-hidden glow-energy">
          <div className="absolute top-0 right-0 p-3 text-gridEnergy bg-gridEnergy bg-opacity-10 rounded-bl">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">Green mix ratio</span>
          <h3 className="text-3xl font-extrabold text-gridEnergy mt-2 custom-font-mono">
            {telemetry.green_score.toFixed(1)}%
          </h3>
          <span className="text-[10px] text-slate-400 block mt-2">Renewables contribution rate</span>
        </div>

        <div className="glass-panel p-6 rounded relative overflow-hidden glow-warning">
          <div className="absolute top-0 right-0 p-3 text-gridWarning bg-gridWarning bg-opacity-10 rounded-bl">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">Sustainability Score</span>
          <h3 className="text-3xl font-extrabold text-gridWarning mt-2 custom-font-mono">
            94/100
          </h3>
          <span className="text-[10px] text-slate-400 block mt-2">FluxCore rating: <strong className="text-gridProfit">EXCELLENT</strong></span>
        </div>

        <div className="glass-panel p-6 rounded relative overflow-hidden glow-ai">
          <div className="absolute top-0 right-0 p-3 text-gridAI bg-gridAI bg-opacity-10 rounded-bl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">Carbon Credit Accrued</span>
          <h3 className="text-3xl font-extrabold text-gridAI mt-2 custom-font-mono">
            ${(telemetry.co2_avoided * 0.025).toFixed(2)}
          </h3>
          <span className="text-[10px] text-slate-400 block mt-2">Valued at $25.00/metric ton</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
            Renewable Displacement & Carbon Savings Curve
          </h4>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2e40" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0e1b29', borderColor: '#1a2e40', color: '#fff' }} />
                <Area type="monotone" dataKey="CO2 Saved (kg)" stroke="#00E676" fillOpacity={1} fill="url(#colorGreen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental impact facts card with leaf animation */}
        <div className="glass-panel p-6 rounded flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
              ESG Compliance Registry
            </h4>
            
            {/* Growing Leaf Animation Pod */}
            <div className="flex items-center justify-center p-4">
              <motion.svg 
                className="w-16 h-16 text-gridProfit" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <motion.path 
                  d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.path d="M9 22v-4" />
              </motion.svg>
            </div>

            <div className="space-y-4 text-xs text-slate-400 mt-2">
              <p className="leading-relaxed">
                By prioritizing Plan A and local solar generation, Agent 6 offsets heavy carbon grid imports. Average grid carbon intensity is evaluated at <strong className="text-white font-mono">0.385 kg CO2/kWh</strong>.
              </p>
              <div className="p-3 bg-slate-900 border border-borderMuted rounded space-y-2 font-mono">
                <div className="flex justify-between">
                  <span>Carbon Tax Penalty Rate:</span>
                  <span className="text-white">$0.08/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Grid Compliance Min:</span>
                  <span className="text-white">50.0%</span>
                </div>
                <div className="flex justify-between">
                  <span>Green rating score:</span>
                  <span className="text-gridProfit">94%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-4 leading-normal">
            Calculated in conformance with EPA Scope 2 guidelines and carbon offsets standards.
          </div>
        </div>
      </div>
    </div>
  );
}
