import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ShieldCheck, Info, ChevronRight, Check } from 'lucide-react';

interface StrategyCenterProps {
  telemetry: any;
}

export default function StrategyCenter({ telemetry }: StrategyCenterProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('Plan B');

  const plans = telemetry.plans && telemetry.plans.length > 0 ? telemetry.plans : [
    { plan_name: "Plan A: Renewable First Strategy", expected_cost: 110.20, expected_profit: 0.0, battery_impact: 1.20, carbon_impact: 0.0, grid_risk: 0.15, confidence_score: 94.0, rollback_plan: "Disconnect battery dispatch, fallback to local solar tracking.", selected: false },
    { plan_name: "Plan B: Battery Arbitrage Strategy", expected_cost: 72.50, expected_profit: 45.0, battery_impact: 5.50, carbon_impact: 24.5, grid_risk: 0.25, confidence_score: 90.0, rollback_plan: "Suspend trading bids; lock battery charge until price stabilizes.", selected: true },
    { plan_name: "Plan C: Peak Demand Reduction Strategy", expected_cost: 95.80, expected_profit: 15.0, battery_impact: 3.20, carbon_impact: 12.0, grid_risk: 0.10, confidence_score: 95.0, rollback_plan: "Shed non-critical grid loads; lock battery for backup dispatch.", selected: false },
    { plan_name: "Plan D: Carbon Minimization Strategy", expected_cost: 125.00, expected_profit: 0.0, battery_impact: 1.80, carbon_impact: -42.0, grid_risk: 0.20, confidence_score: 88.0, rollback_plan: "Revert to default tariff; cancel carbon offset bidding.", selected: false },
    { plan_name: "Plan E: Emergency Economic Reserve Strategy", expected_cost: 140.00, expected_profit: 0.0, battery_impact: 0.20, carbon_impact: 8.0, grid_risk: 0.02, confidence_score: 99.0, rollback_plan: "Isolate microgrid; trigger generator backup if grid voltage collapses.", selected: false }
  ];

  const graphData = plans.map((p: any) => ({
    name: p.plan_name.split(':')[0],
    'Cost ($)': p.expected_cost,
    'Profit ($)': p.expected_profit,
    'Battery Wear ($)': p.battery_impact * 5,
    'Carbon Impact (kg)': p.carbon_impact
  }));

  const activePlanDetails = plans.find((p: any) => p.plan_name.includes(selectedPlan)) || plans[0];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Overview header */}
      <div className="glass-panel p-6 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Autonomous Multi-Objective Strategy Planner</h2>
          <p className="text-slate-400 text-xs mt-1">Generates and compares operational strategies under current grid conditions.</p>
        </div>
        <div className="bg-slate-900 border border-borderMuted px-4 py-2 rounded text-xs flex items-center gap-2 glow-ai">
          <ShieldCheck className="w-4 h-4 text-gridAI" />
          <span className="text-slate-300">Selected Heuristics: <strong className="text-gridAI">{telemetry.chosen_strategy.split(':')[0]}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Plan selector cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {plans.map((p: any) => {
            const shortName = p.plan_name.split(':')[0];
            const isSelected = activePlanDetails.plan_name === p.plan_name;
            const isWinner = telemetry.chosen_strategy.includes(shortName);
            
            return (
              <motion.button
                variants={item}
                key={p.plan_name}
                onClick={() => setSelectedPlan(shortName)}
                className={`w-full text-left p-4 rounded border transition-all duration-200 relative overflow-hidden ${
                  isSelected 
                    ? 'bg-gridAI bg-opacity-10 border-gridAI text-white shadow-[0_0_12px_rgba(124,77,255,0.25)]' 
                    : 'glass-panel border-borderMuted text-slate-400 hover:border-slate-700'
                }`}
              >
                {isWinner && (
                  <div className="absolute top-0 right-0 bg-gridProfit text-slate-900 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-0.5 rounded-bl">
                    <Check className="w-2.5 h-2.5" /> AI Recommended
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs uppercase ${isSelected ? 'text-gridAI' : 'text-slate-300'}`}>{shortName}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isSelected ? 'rotate-95 text-gridAI' : 'text-slate-500'}`} />
                </div>
                <span className="block text-sm font-semibold mt-1">{p.plan_name.split(':')[1]}</span>
                
                <div className="flex justify-between items-center text-[10px] uppercase font-bold mt-4 text-slate-500">
                  <span>Confidence: <strong className="text-slate-300">{p.confidence_score}%</strong></span>
                  <span>Est Cost: <strong className="text-slate-300">${p.expected_cost}</strong></span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Middle/Right: Detailed view and compare chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Plan Details Panel */}
          <div className="glass-panel p-6 rounded">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
              Strategy Evaluation Details: {selectedPlan}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cost Projection</span>
                <span className="text-lg font-extrabold text-slate-300 block mt-1 custom-font-mono">${activePlanDetails.expected_cost}</span>
              </div>
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Est Profit Yield</span>
                <span className="text-lg font-extrabold text-gridProfit block mt-1 custom-font-mono">${activePlanDetails.expected_profit}</span>
              </div>
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Battery Wear cost</span>
                <span className="text-lg font-extrabold text-gridWarning block mt-1 custom-font-mono">${activePlanDetails.battery_impact}</span>
              </div>
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Carbon Impact</span>
                <span className="text-lg font-extrabold text-gridEnergy block mt-1 custom-font-mono">{activePlanDetails.carbon_impact} kg</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 text-xs bg-slate-900 bg-opacity-40 p-4 rounded border border-borderMuted glow-ai">
              <Info className="w-5 h-5 text-gridAI shrink-0" />
              <div>
                <span className="font-bold text-slate-300 block uppercase tracking-wider">Dynamic Rollback Protection Policy</span>
                <p className="text-slate-400 mt-1 leading-normal">
                  {activePlanDetails.rollback_plan}
                </p>
              </div>
            </div>
          </div>

          {/* Bar Chart comparing plans */}
          <div className="glass-panel p-6 rounded">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
              Strategic Multi-Objective Tradeoffs
            </h4>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2e40" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0e1b29', borderColor: '#1a2e40', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Cost ($)" fill="#F44336" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Profit ($)" fill="#00E676" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Battery Wear ($)" fill="#FF9800" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
