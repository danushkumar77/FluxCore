import React from 'react';
import { Activity, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemHealthViewProps {
  telemetry: any;
  metrics: any;
  eventLogs: any[];
}

export default function SystemHealthView({ telemetry, metrics, eventLogs }: SystemHealthViewProps) {
  const stateFlow = [
    "Idle", "Monitoring", "Market Analysis", "Economic Forecasting", 
    "Strategy Planning", "Optimization", "AI Reasoning", "Execution", 
    "Reflection", "Learning"
  ];

  const mlModels = [
    { name: "Electricity Price Forecast Model", mae: "0.024", rmse: "0.038", r2: "0.89", status: "ACTIVE" },
    { name: "Cost Prediction Model", mae: "12.50", rmse: "18.20", r2: "0.94", status: "ACTIVE" },
    { name: "Strategy Recommendation Model", mae: "0.05", rmse: "0.08", r2: "0.92", status: "ACTIVE" },
    { name: "Carbon Optimization Model", mae: "8.40", rmse: "11.20", r2: "0.87", status: "ACTIVE" },
    { name: "Market Opportunity Detection", mae: "0.12", rmse: "0.18", r2: "0.88", status: "ACTIVE" }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Agent cycle Latency</span>
          <h3 className="text-2xl font-extrabold text-white custom-font-mono mt-2">
            {metrics.agent_latency_ms.toFixed(1)} ms
          </h3>
          <span className="text-[10px] text-slate-400">Average complete loop execution time</span>
        </div>

        <div className="glass-panel p-6 rounded glow-ai">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Gemini API clearing speed</span>
          <h3 className="text-2xl font-extrabold text-gridAI custom-font-mono mt-2">
            {metrics.gemini_response_time_ms.toFixed(1)} ms
          </h3>
          <span className="text-[10px] text-slate-400">AI reasoning endpoint response speed</span>
        </div>

        <div className="glass-panel p-6 rounded">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Optimization clearing time</span>
          <h3 className="text-2xl font-extrabold text-gridProfit custom-font-mono mt-2">
            {metrics.optimization_execution_time_ms.toFixed(1)} ms
          </h3>
          <span className="text-[10px] text-slate-400">Mathematical dispatch solve speed</span>
        </div>
      </div>

      {/* Visual State Machine Flow */}
      <div className="glass-panel p-6 rounded">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
          Agent State Machine Node Flow
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-center">
          {stateFlow.map((s) => {
            const isActive = telemetry.state === s || (telemetry.state === 'Idle' && s === 'Idle');
            return (
              <div 
                key={s} 
                className={`p-3.5 rounded border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive 
                    ? 'bg-gridAI bg-opacity-25 border-gridAI text-white font-extrabold shadow-[0_0_12px_rgba(124,77,255,0.4)]' 
                    : 'bg-slate-900 border-borderMuted text-slate-500'
                }`}
              >
                {s}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Collaboration Network Graph */}
      <div className="glass-panel p-6 rounded">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
          FluxCore Agent Collaboration Network (Live)
        </h4>
        <div className="flex items-center justify-center p-6 bg-slate-950 bg-opacity-35 rounded border border-borderMuted relative min-h-[300px]">
          <svg className="w-full max-w-[600px] h-[240px]" viewBox="0 0 600 240">
            {/* Connection Lines with Animated Floating Data Particles */}
            {/* Node 1 to 6 */}
            <path d="M 300 40 L 300 120" stroke="#1a2e40" strokeWidth="2" />
            <circle r="4" fill="#7C4DFF">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 300 40 L 300 120" />
            </circle>

            {/* Node 2 to 6 */}
            <path d="M 120 120 L 300 120" stroke="#1a2e40" strokeWidth="2" />
            <circle r="4" fill="#00C8FF">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 120 120 L 300 120" />
            </circle>

            {/* Node 3 to 6 */}
            <path d="M 480 120 L 300 120" stroke="#1a2e40" strokeWidth="2" />
            <circle r="4" fill="#FF9800">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 480 120 L 300 120" />
            </circle>

            {/* Node 4 to 6 */}
            <path d="M 300 200 L 300 120" stroke="#1a2e40" strokeWidth="2" />
            <circle r="4" fill="#F44336">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M 300 200 L 300 120" />
            </circle>

            {/* Agent Nodes */}
            {/* Center: Agent 6 (Economy) */}
            <circle cx="300" cy="120" r="30" fill="#081018" stroke="#7C4DFF" strokeWidth="3" className="glow-ai" />
            <text x="300" y="123" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AGT-6</text>
            <text x="300" y="140" fill="#7C4DFF" fontSize="7" fontWeight="bold" textAnchor="middle">ECONOMY</text>

            {/* Top: Agent 1 (Demand) */}
            <circle cx="300" cy="40" r="22" fill="#081018" stroke="#1a2e40" strokeWidth="2" />
            <text x="300" y="43" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AGT-1</text>
            <text x="300" y="55" fill="#94a3b8" fontSize="6" textAnchor="middle">DEMAND</text>

            {/* Left: Agent 2 (Renewables) */}
            <circle cx="120" cy="120" r="22" fill="#081018" stroke="#1a2e40" strokeWidth="2" />
            <text x="120" y="123" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AGT-2</text>
            <text x="120" y="135" fill="#00C8FF" fontSize="6" textAnchor="middle">RENEWABLE</text>

            {/* Right: Agent 3 (Battery) */}
            <circle cx="480" cy="120" r="22" fill="#081018" stroke="#1a2e40" strokeWidth="2" />
            <text x="480" y="123" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AGT-3</text>
            <text x="480" y="135" fill="#FF9800" fontSize="6" textAnchor="middle">BATTERY</text>

            {/* Bottom: Agent 4 (Grid Risk) */}
            <circle cx="300" cy="200" r="22" fill="#081018" stroke="#1a2e40" strokeWidth="2" />
            <text x="300" y="203" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AGT-4</text>
            <text x="300" y="215" fill="#F44336" fontSize="6" textAnchor="middle">RELIABILITY</text>
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML models validation metrics */}
        <div className="glass-panel p-6 rounded">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
            Machine Learning Registry & Drift Monitor
          </h4>
          <div className="space-y-4">
            {mlModels.map((model) => (
              <div key={model.name} className="p-3 bg-slate-900 border border-borderMuted rounded flex justify-between items-center text-xs">
                <div>
                  <strong className="text-slate-300 block">{model.name}</strong>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    MAE: {model.mae} | RMSE: {model.rmse} | R²: {model.r2}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-gridProfit bg-opacity-10 text-gridProfit font-bold text-[9px] uppercase tracking-wider">
                  {model.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Event bus console stream */}
        <div className="glass-panel p-6 rounded flex flex-col h-[350px]">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-gridAI" /> Event Bus Terminal Stream
          </h4>
          <div className="flex-1 bg-slate-900 p-4 border border-borderMuted rounded font-mono text-[10px] text-slate-400 overflow-y-auto space-y-2">
            {eventLogs.length === 0 ? (
              <div className="text-slate-600">Awaiting multi-agent events from broker...</div>
            ) : (
              eventLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 hover:bg-slate-800 hover:bg-opacity-25 p-1 rounded">
                  <span className="text-slate-600">[{log.timestamp.split("T")[1]?.substring(0,8) || "00:00:00"}]</span>
                  <span className="text-gridEnergy font-bold">{log.source_agent.toUpperCase()}:</span>
                  <span className="text-slate-300 font-semibold">{log.event_type}</span>
                  <span className="text-slate-500 font-bold ml-auto">v1.0</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
