import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Zap, HelpCircle, Shield, AlertTriangle, 
  ArrowUpRight, Battery, ArrowDownLeft 
} from 'lucide-react';

interface CommandCenterProps {
  telemetry: any;
}

export default function CommandCenter({ telemetry }: CommandCenterProps) {
  const steps = [
    { label: "Observe Grid Telemetry", key: "Monitoring" },
    { label: "Analyze Market Prices", key: "Market Analysis" },
    { label: "Predict Hourly Costs", key: "Economic Forecasting" },
    { label: "Evaluate Strategies A-E", key: "Strategy Planning" },
    { label: "Solve Multi-Objective Weights", key: "Optimization" },
    { label: "Generate Economic Reasoning Report", key: "AI Reasoning" },
    { label: "Execute Battery Dispatch & Energy Trades", key: "Execution" },
    { label: "Reflect on Savings Yield", key: "Reflection" }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === telemetry.state);

  return (
    <div className="p-8 space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel glow-profit p-6 rounded relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 text-gridProfit bg-gridProfit bg-opacity-10 rounded-bl">
            <TrendingUp className="w-5 h-5 animate-bounce" />
          </div>
          <span className="block text-xs uppercase font-extrabold text-slate-400 tracking-wider">Daily Operating Savings</span>
          <motion.h3 
            key={telemetry.savings_today}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-extrabold text-gridProfit mt-2 custom-font-mono"
          >
            ${telemetry.savings_today.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </motion.h3>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-3">
            <span className="text-gridProfit flex items-center"><ArrowUpRight className="w-3 h-3" /> +14.2%</span> vs un-optimized
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel glow-energy p-6 rounded relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 text-gridEnergy bg-gridEnergy bg-opacity-10 rounded-bl">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <span className="block text-xs uppercase font-extrabold text-slate-400 tracking-wider">Current Grid Price</span>
          <h3 className="text-3xl font-extrabold text-gridEnergy mt-2 custom-font-mono">
            ${telemetry.market.buying_price.toFixed(3)}/kWh
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-3">
            TOU Tier: <span className="text-gridEnergy font-bold">{telemetry.market.buying_price > 0.3 ? 'PEAK' : 'SHOULDER'}</span>
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel glow-warning p-6 rounded relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 text-gridWarning bg-gridWarning bg-opacity-10 rounded-bl">
            <Battery className="w-5 h-5" />
          </div>
          <span className="block text-xs uppercase font-extrabold text-slate-400 tracking-wider">Battery Reserve</span>
          <h3 className="text-3xl font-extrabold text-gridWarning mt-2 custom-font-mono">
            {(telemetry.battery.soc * 100).toFixed(1)}%
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-3">
            Dispatch rate: <span className="text-gridWarning font-bold">{telemetry.battery.dispatch_kw} kW</span>
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel glow-ai p-6 rounded relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 text-gridAI bg-gridAI bg-opacity-10 rounded-bl">
            <Shield className="w-5 h-5" />
          </div>
          <span className="block text-xs uppercase font-extrabold text-slate-400 tracking-wider">Decision Accuracy</span>
          <h3 className="text-3xl font-extrabold text-gridAI mt-2 custom-font-mono">
            {telemetry.accuracy.toFixed(1)}%
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-3">
            Confidence status: <span className="text-gridProfit font-bold">EXCELLENT</span>
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: AI Strategy details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded">
            <div className="flex items-center justify-between border-b border-borderMuted pb-4 mb-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Active Strategy Overview</h4>
              <span className="text-xs bg-gridAI bg-opacity-20 text-gridAI border border-gridAI border-opacity-35 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(124,77,255,0.3)]">
                {telemetry.chosen_strategy.split(':')[0]}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted">
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Strategy Designation</span>
                <span className="font-extrabold text-slate-200 block mt-1">{telemetry.chosen_strategy}</span>
              </div>
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted">
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Estimated Hourly Yield</span>
                <span className="font-extrabold text-gridProfit block mt-1 custom-font-mono">+$24.50/hr</span>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-2">Gemini Economic Evaluation Summary</span>
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted min-h-[140px] max-h-[300px] overflow-y-auto text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line border-l-4 border-gridAI">
                {telemetry.ai_reasoning}
              </div>
            </div>
          </div>

          {/* Live Action/Execution Log */}
          <div className="glass-panel p-6 rounded">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">Active Operations Monitor</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs bg-slate-900 p-3.5 rounded border border-borderMuted glow-profit">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gridProfit animate-ping" />
                  <span className="font-bold text-slate-300">DISCHARGE_BATTERY</span>
                </div>
                <span className="text-slate-400">Rate: <strong className="text-gridProfit custom-font-mono">120.0 kW</strong></span>
                <span className="text-slate-400">Savings: <strong className="text-gridProfit custom-font-mono">+$33.60</strong></span>
                <span className="text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">90% Conf</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-900 p-3.5 rounded border border-borderMuted opacity-60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gridEnergy" />
                  <span className="font-bold text-slate-300">SOLAR_DIRECT_CONSUMPTION</span>
                </div>
                <span className="text-slate-400">Rate: <strong className="text-gridEnergy custom-font-mono">320.0 kW</strong></span>
                <span className="text-slate-400">Savings: <strong className="text-gridProfit custom-font-mono">+$89.60</strong></span>
                <span className="text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">98% Conf</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: AI Thinking cycle steps */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
              AI Autonomous Thinking Lifecycle
            </h4>
            <div className="relative border-l border-borderMuted ml-3 mt-4 space-y-5">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                
                let dotColor = "bg-slate-700";
                let textColor = "text-slate-500";
                if (isCompleted) {
                  dotColor = "bg-gridProfit";
                  textColor = "text-slate-300";
                } else if (isActive) {
                  dotColor = "bg-gridAI ring-4 ring-gridAI ring-opacity-35";
                  textColor = "text-gridAI font-extrabold";
                }
                
                return (
                  <div key={step.key} className="flex items-start gap-4 relative pl-5">
                    <span className={`absolute left-0 -translate-x-[5.5px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} transition-colors duration-300`} />
                    <div>
                      <span className={`text-xs ${textColor} block transition-colors duration-300`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <motion.span 
                          className="text-[10px] text-gridAI bg-gridAI bg-opacity-10 px-2 py-0.5 rounded font-mono uppercase tracking-widest mt-1 block"
                          animate={{ opacity: [0.4, 1.0, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          ACTIVE CYCLE RUNNING
                        </motion.span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Operator Warnings */}
          <div className="glass-panel p-6 rounded">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">Operator Notification Desk</h4>
            <div className="p-4 bg-gridWarning bg-opacity-10 border border-gridWarning border-opacity-35 rounded flex gap-3 text-xs glow-warning">
              <AlertTriangle className="w-5 h-5 text-gridWarning shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-extrabold text-gridWarning uppercase tracking-wider block">Peak Demand Threshold Alert</span>
                <p className="text-slate-300 leading-normal mt-1">
                  Demand load predicted to exceed 750 kW during hours 17:00-19:00. Optimizer pre-scheduling battery load-shaving dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
