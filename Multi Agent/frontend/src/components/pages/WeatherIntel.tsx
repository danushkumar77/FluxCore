import React from "react";
import { CloudSun, Sun, Wind, CloudRain, ShieldAlert, Thermometer, Droplets } from "lucide-react";
import { MOCK_WEATHER } from "../../services/mockData";

export const WeatherIntel = () => {
  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Atmospheric parameters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Core Temp</span>
            <p className="text-sm font-bold text-white">{MOCK_WEATHER.temperature_c} C</p>
          </div>
          <Thermometer className="w-5 h-5 text-brand-rose" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Wind Velocity</span>
            <p className="text-sm font-bold text-brand-cyan">{MOCK_WEATHER.wind_speed_m_s} m/s</p>
          </div>
          <Wind className="w-5 h-5 text-brand-cyan" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Irradiance</span>
            <p className="text-sm font-bold text-brand-amber">{MOCK_WEATHER.solar_irradiance_w_m2} W/m²</p>
          </div>
          <Sun className="w-5 h-5 text-brand-amber" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Humidity</span>
            <p className="text-sm font-bold text-white">{MOCK_WEATHER.humidity_pct}%</p>
          </div>
          <Droplets className="w-5 h-5 text-brand-cyan" />
        </div>

        <div className="p-3.5 glass-panel rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase text-slate-500">Storm Risk</span>
            <p className={`text-sm font-bold ${MOCK_WEATHER.storm_risk_pct > 30 ? "text-brand-rose" : "text-brand-emerald"}`}>
              {MOCK_WEATHER.storm_risk_pct}%
            </p>
          </div>
          <ShieldAlert className={`w-5 h-5 ${MOCK_WEATHER.storm_risk_pct > 30 ? "text-brand-rose animate-pulse" : "text-slate-500"}`} />
        </div>
      </div>

      {/* 2. Middle splits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Forecast Timeline list */}
        <div className="xl:col-span-2 p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <CloudSun className="w-4 h-4 mr-1.5" /> Weather Forecast Timeline
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {MOCK_WEATHER.timeline.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-900/40 rounded border border-white/5 text-center space-y-2">
                <span className="text-slate-500 font-bold">{item.time}</span>
                <p className="text-white text-xs font-bold">{item.temp} C</p>
                
                <div className="space-y-1 text-[9px] text-slate-400 border-t border-white/5 pt-1.5">
                  <p>Wind: {item.wind} m/s</p>
                  <p>Solar: {item.irradiance} W/m²</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact analysis detail card */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <Activity className="w-4 h-4 mr-1.5" /> Renewable Impact Analysis
          </h3>
          <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
            {MOCK_WEATHER.impact_analysis}
          </p>
          <div className="p-2 bg-slate-900/60 rounded border border-white/5 text-[9px] text-slate-500 leading-normal">
            Model Correlation: <br />
            - Ambient Temp vs Battery Soh: -0.15 correlation coeff <br />
            - Cloud Cover vs Solar output: -0.84 correlation coeff
          </div>
        </div>

      </div>

    </div>
  );
};
import { Activity } from "lucide-react";
