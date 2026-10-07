import { Activity, Server, Cpu, HardDrive, ShieldCheck } from 'lucide-react';
import { HealthStatus } from '../../types';

export default function AgentHealthPanel({ health }: { health: HealthStatus | null }) {
  return (
    <div className="hud-panel p-4 rounded-xl flex flex-col h-full bg-[#0e1628]/60 font-sans select-none">
      <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-3">
        <span className="text-xs font-mono font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
          <Server className="w-4 h-4 text-[#00f0ff]" /> Host Diagnostics
        </span>
        <span className="text-[9px] font-mono bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 px-2 py-0.5 rounded font-bold">
          HEALTH: 98.6%
        </span>
      </div>

      <div className="flex-1 space-y-3 font-mono text-[11px] text-slate-300">
        <div className="flex justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> CPU Load</span>
          <span className="text-[#00ff88] font-bold">4.2%</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> RAM Alloc</span>
          <span className="text-white font-bold">182 MB</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Latency</span>
          <span className="text-[#00f0ff] font-bold">42 ms</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Scheduler</span>
          <span className="text-[#00ff88] font-bold">ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
