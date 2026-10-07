import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Sun, Wind, Battery, DollarSign, Sparkles, 
  Cpu, Activity, RefreshCw, AlertTriangle, ShieldCheck, Thermometer, Database
} from 'lucide-react';
import { predict } from '../services/api';
import { PredictionRequest, PredictionResponse } from '../types';
import { Button } from '../components/ui/button';

const INITIAL_REQUEST: PredictionRequest = {
  hour: 12,
  minute: 0,
  day: 28,
  month: 7,
  year: 2026,
  weekday: 1,
  is_weekend: false,
  is_holiday: false,
  season: 'summer',
  temperature: 28.5,
  humidity: 55,
  wind_speed: 12,
  rainfall: 0,
  solar_irradiance: 720,
  atmospheric_pressure: 1013,
  current_load: 24000,
  previous_hour_load: 23200,
  previous_day_load: 22800,
  grid_frequency: 50.01,
  voltage: 230,
  power_factor: 0.96,
  solar_generation: 3200,
  wind_generation: 1800,
  hydro_generation: 1400,
  renewable_percentage: 26.6,
  battery_soc: 68,
  available_storage: 1200,
  electricity_price: 75,
  demand_response_event: false
};

interface ThinkingStep {
  label: string;
  duration: number;
}

const THINKING_STEPS: ThinkingStep[] = [
  { label: "Ingesting real-time Smart Grid Telemetry...", duration: 600 },
  { label: "Synchronizing Wide-Area Sensor Network...", duration: 500 },
  { label: "Filtering baseline telemetry noise...", duration: 500 },
  { label: "Running trained XGBoost load regressor...", duration: 700 },
  { label: "Estimating forecast variance intervals...", duration: 400 },
  { label: "Computing grid risk and voltage indexes...", duration: 500 },
  { label: "Recalling matching historical scenarios...", duration: 500 },
  { label: "Consulting Smart Grid Operating Rules...", duration: 500 },
  { label: "Consulting Gemini Core explaining prompts...", duration: 800 },
  { label: "Generating prioritized planning stages...", duration: 600 },
  { label: "Simulating grid device RTU actions...", duration: 600 },
  { label: "Persisting reflection models to database...", duration: 400 }
];

export default function Predict() {
  const [form, setForm] = useState<PredictionRequest>(INITIAL_REQUEST);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setCompletedSteps([]);
    
    // Start step-by-step thinking simulation
    for (let i = 0; i < THINKING_STEPS.length; i++) {
      setActiveStep(i);
      await new Promise(resolve => setTimeout(resolve, THINKING_STEPS[i].duration));
      setCompletedSteps(prev => [...prev, i]);
    }
    
    try {
      const res = await predict(form);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setActiveStep(-1);
    }
  };

  const applyScenario = (scenarioName: string) => {
    let updates: Partial<PredictionRequest> = {};
    if (scenarioName === 'heat_wave') {
      updates = { temperature: 42.0, solar_irradiance: 980, current_load: 38000, electricity_price: 180, demand_response_event: true };
    } else if (scenarioName === 'festival') {
      updates = { temperature: 21.0, current_load: 34000, electricity_price: 95, is_holiday: true };
    } else if (scenarioName === 'cloudy') {
      updates = { temperature: 16.0, solar_irradiance: 90, current_load: 21000, battery_soc: 45 };
    } else if (scenarioName === 'cyclone') {
      updates = { temperature: 14.0, wind_speed: 95, solar_irradiance: 0, current_load: 26000, demand_response_event: true };
    } else if (scenarioName === 'transformer') {
      updates = { current_load: 22000, grid_frequency: 48.9 };
    } else if (scenarioName === 'high_solar') {
      updates = { temperature: 32.0, solar_irradiance: 1050, current_load: 20000, electricity_price: 20 };
    } else if (scenarioName === 'low_wind') {
      updates = { wind_speed: 2, current_load: 27000, electricity_price: 95 };
    } else if (scenarioName === 'weekend') {
      updates = { current_load: 18000, is_weekend: true };
    } else if (scenarioName === 'industrial') {
      updates = { current_load: 39000, electricity_price: 160 };
    } else if (scenarioName === 'ev_peak') {
      updates = { current_load: 33000, electricity_price: 115 };
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="flex-1 flex flex-col gap-6 text-slate-200">
      {/* HUD Page Header */}
      <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2.5">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Operator Console</span>
          <h2 className="text-lg font-bold text-white font-mono tracking-wider uppercase">Interactive AI Grid Sandbox</h2>
        </div>
      </div>

      {/* Simulator Scenario Buttons */}
      <div className="hud-panel p-3 rounded-xl select-none">
        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-2">Simulate Macro Scenarios</span>
        <div className="flex flex-wrap gap-2">
          {['heat_wave', 'festival', 'cloudy', 'cyclone', 'transformer', 'high_solar', 'low_wind', 'weekend', 'industrial', 'ev_peak'].map(sc => (
            <button 
              key={sc}
              onClick={() => applyScenario(sc)}
              className="px-3 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/20 rounded font-mono text-[10px] uppercase transition-all duration-200"
            >
              {sc.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        {/* Left Panel: Sliders & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4 hud-panel p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">Parameter Sliders</span>
            <Cpu className="w-4 h-4 text-[#00f0ff]" />
          </div>

          <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin text-xs font-mono">
            {/* Temp slider */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Temperature</span>
                <span className="text-white font-bold">{form.temperature} °C</span>
              </div>
              <input 
                type="range" min="-10" max="45" step="0.5" 
                value={form.temperature} 
                onChange={e => setForm({ ...form, temperature: Number(e.target.value) })}
                className="w-full accent-[#00f0ff] bg-slate-800 rounded-lg h-1"
              />
            </div>

            {/* Solar Irradiance */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5" /> Solar Irradiance</span>
                <span className="text-white font-bold">{form.solar_irradiance} W/m²</span>
              </div>
              <input 
                type="range" min="0" max="1100" step="10" 
                value={form.solar_irradiance} 
                onChange={e => setForm({ ...form, solar_irradiance: Number(e.target.value) })}
                className="w-full accent-[#00f0ff] bg-slate-800 rounded-lg h-1"
              />
            </div>

            {/* Battery SOC */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5" /> Battery reserves SOC</span>
                <span className="text-white font-bold">{form.battery_soc} %</span>
              </div>
              <input 
                type="range" min="10" max="100" step="1" 
                value={form.battery_soc} 
                onChange={e => setForm({ ...form, battery_soc: Number(e.target.value) })}
                className="w-full accent-[#00ff88] bg-slate-800 rounded-lg h-1"
              />
            </div>

            {/* Price */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Electricity pricing</span>
                <span className="text-white font-bold">${form.electricity_price} /MWh</span>
              </div>
              <input 
                type="range" min="10" max="300" step="2" 
                value={form.electricity_price} 
                onChange={e => setForm({ ...form, electricity_price: Number(e.target.value) })}
                className="w-full accent-[#00ff88] bg-slate-800 rounded-lg h-1"
              />
            </div>

            {/* Current Load */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Baseline Demand Load</span>
                <span className="text-white font-bold">{form.current_load.toLocaleString()} MW</span>
              </div>
              <input 
                type="range" min="15000" max="45000" step="500" 
                value={form.current_load} 
                onChange={e => setForm({ ...form, current_load: Number(e.target.value) })}
                className="w-full accent-blue-500 bg-slate-800 rounded-lg h-1"
              />
            </div>
          </div>

          <div className="border-t border-[#00f0ff]/10 pt-4 mt-2">
            <Button 
              onClick={handlePredict} 
              disabled={loading}
              className="w-full bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-mono text-xs uppercase"
            >
              {loading ? 'RUNNING COMPUTATIONS...' : 'EXECUTE PREDICT SCAN'}
            </Button>
          </div>
        </div>

        {/* Center Panel: Grid Twin SVG or Thinking Stepper Overlay */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 min-h-[350px] relative">
            <AnimatePresence mode="wait">
              {loading ? (
                /* Typewriter 12-Step Agent Thinking Mode Overlay */
                <motion.div 
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 hud-panel p-4 rounded-xl flex flex-col justify-between bg-[#0e1628]/95 overflow-hidden border border-[#00f0ff]/30"
                >
                  <div className="flex items-center gap-2 border-b border-[#00f0ff]/15 pb-2 mb-3">
                    <RefreshCw className="w-4 h-4 text-[#00f0ff] animate-spin" />
                    <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">Agent Core Thinking Flow</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 text-[10.5px] font-mono text-slate-300 scrollbar-thin">
                    {THINKING_STEPS.map((step, idx) => {
                      const isCompleted = completedSteps.includes(idx);
                      const isActive = activeStep === idx;
                      return (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className={isActive ? 'text-[#00f0ff] glow-cyan font-bold' : isCompleted ? 'text-slate-400' : 'text-slate-500'}>
                            {idx + 1}. {step.label}
                          </span>
                          <span className={`text-[9px] ${isActive ? 'text-amber-400 font-bold' : isCompleted ? 'text-[#00ff88] font-bold' : 'text-slate-600'}`}>
                            {isActive ? 'COMPUTING...' : isCompleted ? '✔ DONE' : 'WAITING'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* Standard Grid Map twin */
                <motion.div 
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col"
                >
                  <div className="hud-panel p-4 rounded-xl flex flex-col h-full bg-[#050816]/75">
                    <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/15 pb-2">
                      <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">Active Grid Waveform flow</span>
                    </div>
                    <div className="flex-1 bg-[#050816] rounded-lg border border-[#00f0ff]/10 p-2 flex flex-col items-center justify-center">
                      <svg viewBox="0 0 300 220" className="w-full max-h-[220px]">
                        <g transform="translate(40, 50)">
                          <circle r="18" fill="rgba(0, 240, 255, 0.1)" stroke="#00f0ff" strokeWidth="1" />
                          <Sun className="w-5 h-5 text-[#00f0ff] -translate-x-2.5 -translate-y-2.5" />
                        </g>
                        <g transform="translate(40, 160)">
                          <circle r="18" fill="rgba(0, 240, 255, 0.1)" stroke="#00f0ff" strokeWidth="1" />
                          <Wind className="w-5 h-5 text-[#00f0ff] -translate-x-2.5 -translate-y-2.5" />
                        </g>
                        <g transform="translate(150, 105)">
                          <circle r="22" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1.5" className="grid-node-pulse" />
                          <Cpu className="w-6 h-6 text-[#f59e0b] -translate-x-3 -translate-y-3" />
                        </g>
                        <g transform="translate(260, 105)">
                          <circle r="20" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="1" />
                          <Zap className="w-6 h-6 text-[#3b82f6] -translate-x-3 -translate-y-3" />
                        </g>

                        <path d="M 58 50 L 128 105" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="2.5" fill="none" />
                        <path d="M 58 50 L 128 105" stroke="#00f0ff" strokeWidth="2" fill="none" className="electron-flow" />

                        <path d="M 58 160 L 128 105" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="2.5" fill="none" />
                        <path d="M 58 160 L 128 105" stroke="#00f0ff" strokeWidth="2" fill="none" className="electron-flow" />

                        <path d="M 172 105 L 240 105" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="3.5" fill="none" />
                        <path d="M 172 105 L 240 105" stroke="#f59e0b" strokeWidth="3.5" fill="none" className="electron-flow" />
                      </svg>
                      <p className="text-[10px] text-muted-foreground font-mono mt-4 text-center">
                        Active Sandbox. Adjust sliders or select a scenario to start simulation.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Output Briefing Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex-1 hud-panel p-4 rounded-xl flex flex-col gap-3 justify-between bg-[#0e1628]/85">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2">
              <span className="text-xs font-mono font-bold text-white tracking-widest">AI DECISION SUMMARY</span>
              <Sparkles className="w-4 h-4 text-[#c084fc]" />
            </div>

            {result ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400">Forecasted Demand</span>
                    <p className="text-lg font-bold text-white">{result.prediction.toLocaleString()} MW</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400">Model Confidence</span>
                    <p className="text-lg font-bold text-[#00ff88]">{result.confidence.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400">Grid Risk Level</span>
                    <span className="px-2 py-0.5 rounded text-[10px] border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold block w-fit mt-1">
                      {result.risk}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400">Reserve Margin</span>
                    <p className="text-sm font-semibold text-white mt-1">{result.reserve_margin.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="border-t border-[#00f0ff]/10 pt-3">
                  <span className="text-[9px] text-slate-400">Decision Logic Explainability</span>
                  <p className="text-[10px] text-slate-300 leading-normal italic mt-1 font-terminal">
                    "{result.reasoning}"
                  </p>
                </div>

                <div className="border-t border-[#00f0ff]/10 pt-3">
                  <span className="text-[9px] text-slate-400">Action Recommendations</span>
                  <div className="space-y-1.5 mt-1.5">
                    {result.recommendations.slice(0, 3).map((rec, i) => (
                      <div key={i} className="flex gap-2 text-slate-300 text-[10.5px]">
                        <span className="text-[#00f0ff]">0{i+1} /</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6 border border-dashed border-[#00f0ff]/15 rounded-lg">
                <p className="text-xs text-muted-foreground font-mono">
                  No simulation active. Configure grid settings on the left to start.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
