import { motion } from 'framer-motion';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';
import WeeklyTrendChart from '../components/charts/WeeklyTrendChart';
import { useDashboard } from '../hooks/useDashboard';
import { Terminal, Shield, RefreshCw, Layers, Cpu, Server, HardDrive } from 'lucide-react';

export default function Analytics() {
  const { data } = useDashboard();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col gap-6 text-slate-200"
    >
      {/* HUD Page Header */}
      <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#00f0ff] animate-pulse" />
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Model Diagnostics</span>
            <h2 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Analytics Engine</h2>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 px-2 py-1 rounded">
          STATUS: HYPERPARAMETER LOCK
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Performance Metrics Card (4 cols) */}
        <div className="lg:col-span-4 hud-panel p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-4">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#10b981]" /> Model Metrics
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">XGBOOST V1</span>
            </div>

            <div className="space-y-4 font-mono">
              <div>
                <span className="text-[9px] text-slate-400">Mean Absolute Error (MAE)</span>
                <p className="text-xl font-bold text-white">122.77 MW</p>
                <div className="w-full bg-white/5 h-1 rounded overflow-hidden mt-1">
                  <div className="h-full bg-[#00f0ff]" style={{ width: '92%' }} />
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-400">R² Coefficient</span>
                <p className="text-xl font-bold text-[#10b981]">0.9993</p>
                <div className="w-full bg-white/5 h-1 rounded overflow-hidden mt-1">
                  <div className="h-full bg-[#10b981]" style={{ width: '99%' }} />
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-400">Root Mean Squared Error (RMSE)</span>
                <p className="text-xl font-bold text-white">157.37 MW</p>
              </div>

              <div>
                <span className="text-[9px] text-slate-400">MAPE Deviation</span>
                <p className="text-xl font-bold text-white">0.55%</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#00f0ff]/10 pt-3 mt-4 text-[10px] font-mono text-muted-foreground">
            Model pipeline verified. Cross-validation: 5-split time series.
          </div>
        </div>

        {/* Center: Drivers Chart Panel (5 cols) */}
        <div className="lg:col-span-5 hud-panel p-4 rounded-xl flex flex-col h-[280px]">
          <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-4">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Key Demand Drivers</span>
            <span className="text-[9px] font-mono text-muted-foreground">COEFFICIENT RATIOS</span>
          </div>
          <div className="flex-1 min-h-0">
            <FeatureImportanceChart />
          </div>
        </div>

        {/* Right: Hardware stats / Diagnostics (3 cols) */}
        <div className="lg:col-span-3 hud-panel p-4 rounded-xl flex flex-col gap-4 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00f0ff]" /> Host Diagnostics
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> CPU Load</span>
              <span className="text-[#00f0ff]">4.2%</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> RAM Alloc</span>
              <span>182 MB</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Query Time</span>
              <span>42 ms</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Cache hits</span>
              <span className="text-[#10b981]">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart Panel */}
      {data && (
        <div className="hud-panel p-4 rounded-xl flex flex-col h-[280px]">
          <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-4">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">7-Day Demand Trend Ratios</span>
            <span className="text-[9px] font-mono text-muted-foreground">WEEKLY AVERAGE LOAD</span>
          </div>
          <div className="flex-1 min-h-0">
            <WeeklyTrendChart data={data.weekly_trend} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
