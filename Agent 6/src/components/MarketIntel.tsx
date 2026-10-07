import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, AreaChart, Area 
} from 'recharts';
import { AlertCircle, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface MarketIntelProps {
  telemetry: any;
}

export default function MarketIntel({ telemetry }: MarketIntelProps) {
  const basePrice = telemetry.market.buying_price;
  const chartData = Array.from({ length: 24 }, (_, hour) => {
    const peakFactor = (hour >= 16 && hour <= 21) ? 1.8 : 1.0;
    const offset = Math.sin((hour - 6) * Math.PI / 12) * 0.05;
    const actual = Math.max(0.04, basePrice * peakFactor + offset);
    const forecast = actual * (1.0 + (Math.sin(hour) * 0.03));
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      'Actual Price': parseFloat(actual.toFixed(3)),
      'Forecast Price': parseFloat(forecast.toFixed(3)),
      'Demand Forecast (kW)': Math.round(300 + Math.sin((hour - 8) * Math.PI / 12) * 150 + 200 * (hour >= 16 && hour <= 20 ? 1.5 : 1))
    };
  });

  const isVolatile = telemetry.market.volatility_score > 0.4;

  return (
    <div className="p-8 space-y-6">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded border border-borderMuted">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Day Ahead clearing</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-extrabold text-white custom-font-mono">
              ${(basePrice * 0.95).toFixed(3)}/kWh
            </h3>
            <span className="text-xs text-gridProfit flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Stable
            </span>
          </div>
        </div>

        <div className={`glass-panel p-6 rounded border ${isVolatile ? 'glow-critical' : 'glow-warning'}`}>
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Price Spike Likelihood</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className={`text-2xl font-extrabold custom-font-mono ${isVolatile ? 'text-gridCritical animate-pulse' : 'text-gridWarning'}`}>
              {(telemetry.market.volatility_score * 100).toFixed(0)}%
            </h3>
            <span className={`text-xs font-bold uppercase tracking-wider ${isVolatile ? 'text-gridCritical' : 'text-gridWarning'}`}>
              {isVolatile ? 'HIGH VOLATILITY' : 'NOMINAL'}
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded border border-borderMuted">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Market Commission Fee</span>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-extrabold text-gridAI custom-font-mono">
              0.50%
            </h3>
            <span className="text-xs text-slate-400 font-bold">Standard rate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Curves Graph */}
        <div className="lg:col-span-2 glass-panel p-6 rounded">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
            Day-Ahead vs Real-Time Electricity Prices
          </h4>
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2e40" />
                <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} unit=" $" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0e1b29', borderColor: '#1a2e40', color: '#fff' }}
                  labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Actual Price" stroke="#00C8FF" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Forecast Price" stroke="#7C4DFF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volatility Alert Monitor */}
        <div className="glass-panel p-6 rounded space-y-4">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-2">
            Real-Time Market Alerts
          </h4>
          <div className="space-y-3">
            <div className="p-3.5 bg-gridCritical bg-opacity-10 border border-gridCritical border-opacity-35 rounded text-xs flex gap-2 glow-critical">
              <ShieldAlert className="w-5 h-5 text-gridCritical shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-slate-200 block">Peak Tariff Spike Window</span>
                <p className="text-slate-400 mt-1">Real-time prices expected to reach $0.48/kWh between 16:00 and 20:00. Discharge pre-allocations activated.</p>
              </div>
            </div>
            <div className="p-3.5 bg-gridProfit bg-opacity-10 border border-gridProfit border-opacity-35 rounded text-xs flex gap-2">
              <AlertCircle className="w-5 h-5 text-gridProfit shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">Surplus Sell Window Open</span>
                <p className="text-slate-400 mt-1">Solar generation exceeding base operational thresholds. Opportunity to sell surplus at $0.12/kWh.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demand Curves Graph */}
      <div className="glass-panel p-6 rounded">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
          Grid Load Forecast Curves
        </h4>
        <div className="h-56 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2e40" />
              <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} unit=" kW" />
              <Tooltip contentStyle={{ backgroundColor: '#0e1b29', borderColor: '#1a2e40', color: '#fff' }} />
              <Area type="monotone" dataKey="Demand Forecast (kW)" stroke="#00C8FF" fillOpacity={1} fill="url(#colorDemand)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
