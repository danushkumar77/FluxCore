import { useEffect, useState, useRef } from 'react';
import { Cpu, Terminal, Play, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Stage {
  id: number;
  label: string;
  logText: string;
}

const STAGES: Stage[] = [
  { id: 0, label: 'Telemetry Ingest', logText: 'Ingesting smart meters feeder logs, voltage vectors, frequency samples...' },
  { id: 1, label: 'Input Validation', logText: 'Validating boundary constraints. Temperature: ok. Grid Frequency: 50.01Hz.' },
  { id: 2, label: 'Data Cleaning', logText: 'Running outlier filtration. Cleaning nulls and zero loads. Scaling data matrix.' },
  { id: 3, label: 'Feature Engineering', logText: 'Computing rolling averages, temporal sinusoids, and solar impact ratio...' },
  { id: 4, label: 'XGBoost Execution', logText: 'Loading trained XGBoost ensemble model. Predicting target load vector...' },
  { id: 5, label: 'Uncertainty Scan', logText: 'Calculating target deviations and standard error confidence boundaries.' },
  { id: 6, label: 'Risk Assessment', logText: 'Calculating reserve margins. Warning: metropolitan HVAC loading high.' },
  { id: 7, label: 'Gemini Context Parsing', logText: 'Connecting to Gemini grid planner. Parsing weather and pricing indices...' },
  { id: 8, label: 'Recommendation Output', logText: 'Compiling actionable responses. Dispatching Battery reserves...' },
  { id: 9, label: 'Memory Retention', logText: 'Saving forecasting vectors and reasoning response to SQLite database.' },
  { id: 10, label: 'Forecast Finalized', logText: 'Grid stability report generated. Command terminal idling.' }
];

export default function AgentConsole({ triggerCount }: { triggerCount: number }) {
  const [currentStage, setCurrentStage] = useState(10);
  const [stageStatus, setStageStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [logs, setLogs] = useState<string[]>([
    '10:14:02 - System initialized. Listening for grid telemetry...',
    '10:14:03 - Current Load: 32,450 MW. Grid frequency: 50.01Hz. Storage: Float.',
    '10:14:04 - Standby mode active. Waiting for model execution trigger.'
  ]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerCount === 0) return;

    // Start execution simulation
    setCurrentStage(0);
    setStageStatus('running');
    setLogs(prev => [...prev, `[INFO] ${new Date().toLocaleTimeString()} - Triggering prediction sequence...`]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < STAGES.length - 1) {
        setLogs(prev => [...prev, `[PROCESS] ${STAGES[step].logText}`]);
        step += 1;
        setCurrentStage(step);
      } else {
        clearInterval(interval);
        setStageStatus('completed');
        setLogs(prev => [...prev, `[SUCCESS] Prediction fully complete. History snapshot written.`]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [triggerCount]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="hud-panel p-4 rounded-xl flex flex-col h-full select-none">
      <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/15 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">AI Command Terminal Console</span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          stageStatus === 'running' 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {stageStatus === 'running' ? 'COMPUTATIONAL SWEEP ACTIVE' : 'DIAGNOSTIC CORE STANDBY'}
        </span>
      </div>

      {/* Stepper Steps UI */}
      <div className="grid grid-cols-6 gap-1.5 mb-4">
        {STAGES.slice(0, 6).map((stage, idx) => {
          const isActive = currentStage === idx;
          const isDone = currentStage > idx;
          return (
            <div key={stage.label} className="flex flex-col gap-1 text-center">
              <div className={`h-1 rounded transition-all duration-300 ${
                isActive 
                  ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]' 
                  : isDone 
                    ? 'bg-[#10b981]' 
                    : 'bg-white/10'
              }`} />
              <span className={`text-[8px] font-mono tracking-tighter truncate ${
                isActive ? 'text-[#00f0ff]' : isDone ? 'text-[#10b981]' : 'text-muted-foreground'
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Log Console Output */}
      <div className="flex-1 flex flex-col bg-[#050816]/75 border border-[#00f0ff]/10 rounded-lg p-3 overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-[#00f0ff]/10 pb-1.5 mb-2">
          <div className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse"></div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Live Telemetry Pipeline log</span>
        </div>

        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto text-[10.5px] font-terminal space-y-1.5 text-slate-300 leading-normal scrollbar-thin"
        >
          {logs.map((log, index) => {
            const isSuccess = log.includes('[SUCCESS]');
            const isProcess = log.includes('[PROCESS]');
            const isInfo = log.includes('[INFO]');
            return (
              <div 
                key={index} 
                className={`transition-all duration-200 ${
                  isSuccess 
                    ? 'text-[#10b981]' 
                    : isProcess 
                      ? 'text-[#00f0ff]/80' 
                      : isInfo 
                        ? 'text-amber-400' 
                        : 'text-[#94a3b8]'
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
