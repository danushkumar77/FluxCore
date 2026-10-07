import React from "react";
import { 
  Heart, Zap, Battery, Activity, AlertTriangle, Cpu, HelpCircle, Layers
} from "lucide-react";
import { TelemetryMeasurement } from "../../types";
import { TelemetryCharts } from "../TelemetryCharts";

interface OverviewProps {
  telemetry: TelemetryMeasurement | null;
  history: TelemetryMeasurement[];
  alertsCount: number;
}

export const Overview = ({ telemetry, history, alertsCount }: OverviewProps) => {
  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* 1. Top KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Grid Health */}
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-semibold font-mono tracking-wider">Grid Health</span>
            <Heart className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white uppercase">98.2%</span>
            <p className="text-[9px] text-brand-emerald font-mono">● Optimal</p>
          </div>
        </div>

        {/* KPI 2: Active Load */}
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-semibold font-mono tracking-wider">Grid Load</span>
            <Zap className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono">
              {telemetry?.active_power_mw ? `${telemetry.active_power_mw} MW` : "80.4 MW"}
            </span>
            <p className="text-[9px] text-slate-400 font-mono">Active Demand</p>
          </div>
        </div>

        {/* KPI 3: Renewable Ratio */}
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-semibold font-mono tracking-wider">Renewable %</span>
            <Layers className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono">42.5%</span>
            <p className="text-[9px] text-brand-emerald font-mono">+1.2% this hour</p>
          </div>
        </div>

        {/* KPI 4: Battery SOC */}
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-semibold font-mono tracking-wider">BESS SOC</span>
            <Battery className="w-4 h-4 text-brand-purple" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono">
              {telemetry?.battery_soc_pct ? `${telemetry.battery_soc_pct}%` : "75.0%"}
            </span>
            <p className="text-[9px] text-brand-purple font-mono">Charging</p>
          </div>
        </div>

        {/* KPI 5: Frequency */}
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-semibold font-mono tracking-wider">Frequency</span>
            <Activity className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono">
              {telemetry?.frequency_hz ? `${telemetry.frequency_hz} Hz` : "50.00 Hz"}
            </span>
            <p className="text-[9px] text-brand-cyan font-mono">Stable Nominal</p>
          </div>
        </div>

        {/* KPI 6: Active Alerts */}
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-semibold font-mono tracking-wider">Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${alertsCount > 0 ? "text-brand-amber animate-pulse" : "text-slate-500"}`} />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono">{alertsCount}</span>
            <p className="text-[9px] text-slate-400 font-mono">Active Signals</p>
          </div>
        </div>
      </div>

      {/* 2. Embedded Rolling charts */}
      <div className="flex-1 min-h-[300px]">
        <TelemetryCharts history={history} />
      </div>
    </div>
  );
};
