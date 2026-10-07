import React from "react";
import { Activity, Sliders, Sun, Wind, Battery, Heart } from "lucide-react";
import { TelemetryMeasurement } from "../../types";

interface TelemetryPageProps {
  telemetry: TelemetryMeasurement | null;
}

export const LiveTelemetryPage = ({ telemetry }: TelemetryPageProps) => {
  const dataPoints = [
    { label: "Voltage (Substation A)", value: telemetry?.voltage_kv ? `${telemetry.voltage_kv} kV` : "114.8 kV", percentage: 95.6, color: "bg-brand-cyan" },
    { label: "Current Core load", value: telemetry?.current_a ? `${telemetry.current_a} A` : "690 A", percentage: 86.2, color: "bg-brand-cyan" },
    { label: "Active Power Output", value: telemetry?.active_power_mw ? `${telemetry.active_power_mw} MW` : "80.4 MW", percentage: 80.4, color: "bg-brand-cyan" },
    { label: "Reactive Power load", value: telemetry?.reactive_power_mvar ? `${telemetry.reactive_power_mvar} MVar` : "12.4 MVar", percentage: 24.8, color: "bg-brand-purple" },
    { label: "Grid Frequency bound", value: telemetry?.frequency_hz ? `${telemetry.frequency_hz} Hz` : "50.00 Hz", percentage: 100, color: "bg-brand-emerald" },
    { label: "Solar Irradiance", value: telemetry?.solar_irradiance_w_m2 ? `${telemetry.solar_irradiance_w_m2} W/m²` : "450 W/m²", percentage: 45.0, color: "bg-brand-amber" },
    { label: "Wind Velocity", value: telemetry?.wind_speed_m_s ? `${telemetry.wind_speed_m_s} m/s` : "8.5 m/s", percentage: 56.6, color: "bg-brand-cyan" },
    { label: "Battery SOC status", value: telemetry?.battery_soc_pct ? `${telemetry.battery_soc_pct}%` : "75.0%", percentage: telemetry?.battery_soc_pct || 75.0, color: "bg-brand-purple" },
    { label: "Battery health SOH", value: telemetry?.battery_soh_pct ? `${telemetry.battery_soh_pct}%` : "98.4%", percentage: telemetry?.battery_soh_pct || 98.4, color: "bg-brand-emerald" },
    { label: "Carbon Intensity", value: telemetry?.carbon_intensity_g_kwh ? `${telemetry.carbon_intensity_g_kwh} g/kWh` : "145 g/kWh", percentage: 36.2, color: "bg-brand-amber" },
    { label: "Real-time Spot Price", value: telemetry?.market_price_mwh ? `$${telemetry.market_price_mwh}/MWh` : "$42.50/MWh", percentage: 42.5, color: "bg-brand-cyan" }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Ingestion status */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Live SCADA Streams</h3>
            <p className="text-[10px] text-slate-400">Continuous telemetry pipeline connection via WebSockets.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-500 uppercase block">Ingest Rate</span>
          <span className="text-xs font-bold text-brand-cyan">1 / sec</span>
        </div>
      </div>

      {/* 2. Telemetry items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dataPoints.map((dp, i) => (
          <div key={i} className="p-4 glass-panel rounded-xl border border-white/5 hover:border-brand-cyan/20 transition space-y-3">
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-400 text-[10px] uppercase truncate max-w-[200px]">{dp.label}</span>
              <span className="text-white text-xs">{dp.value}</span>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className={`${dp.color} h-full transition-all duration-500`} style={{ width: `${Math.min(100, dp.percentage)}%` }} />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
