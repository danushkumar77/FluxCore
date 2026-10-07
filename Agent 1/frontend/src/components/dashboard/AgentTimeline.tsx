import { CheckCircle2, Clock } from 'lucide-react';

interface TimelineEvent {
  time: string;
  label: string;
  status: 'completed' | 'pending';
}

const EVENTS: TimelineEvent[] = [
  { time: "09:20", label: "Telemetry Received", status: "completed" },
  { time: "09:21", label: "Validation Completed", status: "completed" },
  { time: "09:22", label: "Features Engineered", status: "completed" },
  { time: "09:23", label: "Prediction Completed", status: "completed" },
  { time: "09:24", label: "Risk Levels Calculated", status: "completed" },
  { time: "09:25", label: "Decision Paths Ranked", status: "completed" },
  { time: "09:26", label: "Actuator Tools Dispatched", status: "completed" }
];

export default function AgentTimeline() {
  return (
    <div className="hud-panel p-4 rounded-xl flex flex-col h-full bg-[#0e1628]/60 font-sans select-none">
      <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-3">
        <span className="text-xs font-mono font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#00f0ff]" /> Real-Time Agent Timeline
        </span>
        <span className="text-[9px] font-mono text-slate-400">GMT</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin text-[11px] font-mono">
        {EVENTS.map((event, index) => (
          <div key={index} className="flex items-center gap-3 relative">
            <span className="text-slate-400 w-10 shrink-0 text-right">{event.time}</span>
            <div className="relative flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border border-[#00f0ff]/30 bg-[#050816] flex items-center justify-center z-10 shadow-[0_0_8px_rgba(0,240,255,0.15)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
              </div>
              {index < EVENTS.length - 1 && (
                <div className="absolute top-4 bottom-[-16px] left-[7.5px] w-0.5 bg-[#00f0ff]/15 z-0" />
              )}
            </div>
            <span className="text-slate-200 font-bold">{event.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
