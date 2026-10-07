import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../hooks/useDashboard';
import { useAgentState } from '../hooks/useAgentState';
import { 
  Zap, Activity, Sparkles, Cpu, Battery, Globe, ShieldCheck, 
  ArrowUpRight, RefreshCw, AlertTriangle, ShieldAlert, ListChecks, Play, Layers
} from 'lucide-react';
import InteractiveGridMap from '../components/dashboard/InteractiveGridMap';
import AgentConsole from '../components/dashboard/AgentConsole';
import DemandLineChart from '../components/charts/DemandLineChart';
import HistoryTable from '../components/dashboard/HistoryTable';
import LearningDashboard from '../components/dashboard/LearningDashboard';
import AgentTimeline from '../components/dashboard/AgentTimeline';
import AgentHealthPanel from '../components/dashboard/AgentHealthPanel';
import { Button } from '../components/ui/button';

function Sparkline({ color, points }: { color: string, points: number[] }) {
  const width = 80;
  const height = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const strokePoints = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={strokePoints} />
    </svg>
  );
}

export default function Dashboard() {
  const { data, refresh } = useDashboard();
  const { agentState } = useAgentState();
  const [triggerCount, setTriggerCount] = useState(0);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  const handlePredictTrigger = () => {
    setTriggerCount(prev => prev + 1);
    refresh();
  };

  if (!data) return null;

  const summary = data.recent_predictions?.[0] || {
    prediction: 31420,
    confidence: 98.4,
    risk: 'Medium',
    category: 'Normal',
    trend: 'Stable',
    grid_stress_index: 62.8,
    reserve_margin: 37.2,
    reasoning: 'Demand remains moderate. High solar offset recorded.',
    recommendations: ['Standby battery backup', 'Maintain standard base loading']
  };

  return (
    <div className="flex-1 flex flex-col gap-6 text-slate-200">
      {/* Top Status Banner */}
      <div className="w-full bg-[#0e1628]/45 border border-[#00f0ff]/10 rounded-lg p-2 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <span className="text-[#00ff88] font-bold shrink-0 flex items-center gap-1.5 glow-emerald animate-pulse">
            <Activity className="w-3.5 h-3.5" /> COMMAND CENTER HUD:
          </span>
          <div className="ticker-wrap flex-1">
            <div className="ticker-content space-x-8 text-slate-300">
              <span>STATE: {agentState?.state || 'IDLE'}</span>
              <span>FREQUENCY: 50.01 HZ (NOMINAL)</span>
              <span className="text-[#00ff88]">RENEWABLES: 42.6% ACTIVE</span>
              <span className="text-[#00f0ff]">BATTERY STATE: Float / Standby</span>
              <span className="text-[#fbbf24]">WARNING: METRO HVAC loading high</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-[#00f0ff]/15 pl-4 ml-4 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
          <span className="text-[10px] text-[#00ff88] font-bold uppercase tracking-widest">
            {agentState?.state || 'Idle'}
          </span>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 select-none">
        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Current Load</span>
            <Zap className="w-4 h-4 text-[#00f0ff]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">{data.current_load.toLocaleString()}</span>
              <span className="text-[9px] text-muted-foreground ml-1">MW</span>
            </div>
            <Sparkline color="#00f0ff" points={[28000, 29500, 31000, 32450]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Pred Demand</span>
            <Activity className="w-4 h-4 text-[#3b82f6]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">{summary.prediction.toLocaleString()}</span>
              <span className="text-[9px] text-muted-foreground ml-1">MW</span>
            </div>
            <Sparkline color="#3b82f6" points={[29000, 30100, 31200, 31420]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Renewable %</span>
            <Globe className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">42.6%</span>
              <span className="text-[9px] text-[#10b981] ml-1 flex items-center font-mono">
                <ArrowUpRight className="w-3 h-3 inline" /> 3.1%
              </span>
            </div>
            <Sparkline color="#10b981" points={[38, 40, 41, 42.6]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Battery SOC</span>
            <Battery className="w-4 h-4 text-[#a855f7]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">68.2%</span>
              <span className="text-[9px] text-muted-foreground ml-1">CHARGE</span>
            </div>
            <Sparkline color="#a855f7" points={[62, 64, 66, 68.2]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Grid Frequency</span>
            <Cpu className="w-4 h-4 text-[#00f0ff]" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">50.01</span>
              <span className="text-[9px] text-muted-foreground ml-1">Hz</span>
            </div>
            <Sparkline color="#00f0ff" points={[50.0, 50.02, 49.99, 50.01]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Elect. Price</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">$74.50</span>
              <span className="text-[9px] text-muted-foreground ml-1">/MWh</span>
            </div>
            <Sparkline color="#10b981" points={[68, 71, 73, 74.5]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Carbon Saved</span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">1,248</span>
              <span className="text-[9px] text-muted-foreground ml-1">TONS</span>
            </div>
            <Sparkline color="#10b981" points={[1120, 1180, 1210, 1248]} />
          </div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Peak Probability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-white tracking-tight">12%</span>
              <span className="text-[9px] text-emerald-400 ml-1">LOW RISK</span>
            </div>
            <Sparkline color="#10b981" points={[25, 20, 16, 12]} />
          </div>
        </div>
      </div>

      {/* Unified Widescreen 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        {/* Left Column (30% width) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          {/* Agent Console */}
          <div className="h-64">
            <AgentConsole triggerCount={triggerCount} />
          </div>

          {/* Device Tool Call Logs */}
          <div className="hud-panel p-4 rounded-xl flex flex-col h-44">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">Device Tool Call Logs</span>
              <span className="text-[9px] font-mono text-muted-foreground">RTU COMMANDS</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 text-[11px] font-mono pr-2 scrollbar-thin">
              {agentState?.tool_logs && agentState.tool_logs.length > 0 ? (
                agentState.tool_logs.map((log, index) => (
                  <div key={index} className="flex flex-col border-b border-white/5 pb-1.5 last:border-b-0">
                    <div className="flex items-center justify-between text-slate-300 font-bold mb-0.5">
                      <span className="text-[#00f0ff]">{log.name}()</span>
                      <span className="text-[9px] text-[#00ff88]">{log.duration_sec}s</span>
                    </div>
                    <p className="text-slate-400 leading-normal">{log.log}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">No tool calls dispatched.</p>
              )}
            </div>
          </div>

          {/* Learning Dashboard widget */}
          <div className="h-44">
            <LearningDashboard reflections={agentState?.reflections || []} />
          </div>

          {/* Diagnostics Health widget */}
          <div className="h-44">
            <AgentHealthPanel health={null} />
          </div>
        </div>

        {/* Center Column (40% width) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {/* Grid Twin SVG map */}
          <div className="flex-1 min-h-[300px]">
            <InteractiveGridMap currentLoad={data.current_load} />
          </div>

          {/* Action Directives Plan Checklist */}
          <div className="hud-panel p-4 rounded-xl flex flex-col h-44">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-[#00f0ff]" /> Action Plan Directives
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">MITIGATION SEQUENCE</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-[11px] font-mono pr-1 scrollbar-thin">
              {agentState?.current_plan && agentState.current_plan.length > 0 ? (
                agentState.current_plan.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#050816]/60 border border-[#00f0ff]/10 p-2 rounded">
                    <span className="text-white font-bold">{idx + 1}. {step.action}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] border ${
                      step.status === 'Success' ? 'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30' :
                      step.status === 'Executing' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                      'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">Waiting for plan generation...</p>
              )}
            </div>
          </div>

          {/* Forecasting Area Chart */}
          <div className="hud-panel p-4 rounded-xl flex flex-col h-[230px]">
            <div className="flex-1 min-h-0">
              <DemandLineChart data={data.hourly_forecast} />
            </div>
          </div>
        </div>

        {/* Right Column (30% width) */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          {/* Executive AI Summary Report Card */}
          <div className="hud-panel p-4 rounded-xl flex flex-col gap-3 justify-between h-52">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2">
              <span className="text-xs font-mono font-bold text-white tracking-widest">EXECUTIVE BRIEFING</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">Forecasted load</span>
                <p className="text-lg font-bold text-white">{summary.prediction.toLocaleString()} MW</p>
              </div>
              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">Confidence</span>
                <p className="text-lg font-bold text-[#00ff88]">{summary.confidence.toFixed(1)}%</p>
              </div>
            </div>

            <div className="border-t border-[#00f0ff]/10 pt-2.5">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Logical Reasoning Statement</span>
              <p className="text-[10px] text-slate-300 font-mono mt-1 leading-normal italic">
                "{summary.reasoning}"
              </p>
            </div>
          </div>

          {/* Grid Goals Progress */}
          <div className="hud-panel p-4 rounded-xl flex flex-col h-44">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">Active Grid Goals</span>
              <span className="text-[9px] font-mono text-muted-foreground">PRIORITY ORDER</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin font-mono text-[11px]">
              {agentState?.active_goals && agentState.active_goals.length > 0 ? (
                agentState.active_goals.map((goal, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-200 font-bold">{goal.label}</span>
                      <span className="text-[#00f0ff]">{goal.progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00f0ff]" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">No goals active.</p>
              )}
            </div>
          </div>

          {/* Expandable Decision Strategy Options */}
          <div className="hud-panel p-4 rounded-xl flex flex-col h-48">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-2">
              <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">AI Decision Analysis</span>
              <Sparkles className="w-4 h-4 text-[#c084fc]" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-[10px] font-mono pr-1 scrollbar-thin">
              {agentState?.decision_runs?.strategies ? (
                agentState.decision_runs.strategies.map((strat: any, i: number) => (
                  <div key={i} className="border-b border-white/5 pb-2 last:border-b-0">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span>{strat.name}</span>
                      <span className="text-[#00ff88]">{strat.overall}%</span>
                    </div>
                    <p className="text-slate-400 leading-normal">{strat.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">Waiting for prediction sweep...</p>
              )}
            </div>
          </div>

          {/* Action Trigger Box */}
          <div className="hud-panel p-4 rounded-xl flex flex-col gap-3 justify-end h-[100px]">
            <Button 
              onClick={handlePredictTrigger}
              className="w-full bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_12px_rgba(0,240,255,0.1)] py-2 rounded-lg font-mono text-xs uppercase"
            >
              RUN COMPUTE CYCLE
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Timeline & Historical predictions table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch select-none">
        {/* Glowing Timeline (4 cols) */}
        <div className="lg:col-span-4 h-72">
          <AgentTimeline />
        </div>

        {/* SQLite Telemetry Grid (8 cols) */}
        <div className="lg:col-span-8 hud-panel p-4 rounded-xl h-72 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-4">
            <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">Recent Prediction Telemetry Archive</span>
            <span className="text-[9px] font-mono text-muted-foreground">SQLITE PERSISTENCE</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <HistoryTable predictions={data.recent_predictions} />
          </div>
        </div>
      </div>
    </div>
  );
}
