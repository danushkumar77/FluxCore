import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Database, Brain, Zap, Clock, Bell, Sparkles } from 'lucide-react';
import { getHealth } from '../../services/api';
import { HealthStatus } from '../../types';

export default function Header() {
  const [time, setTime] = useState(new Date());
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const fetchHealth = async () => {
      const data = await getHealth();
      setHealth(data);
    };
    fetchHealth();
    const healthTimer = setInterval(fetchHealth, 15000);
    return () => {
      clearInterval(timer);
      clearInterval(healthTimer);
    };
  }, []);

  const formatUtc = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#070b19]/80 backdrop-blur-md border-b border-[#00f0ff]/15 z-50 px-6 flex items-center justify-between">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded border border-[#00f0ff]/40 bg-[#0e1628] shadow-[0_0_10px_rgba(0,240,255,0.2)]">
          <Zap className="w-4 h-4 text-[#00f0ff] animate-pulse" />
          <div className="absolute -inset-0.5 bg-[#00f0ff]/10 rounded blur opacity-30"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-white text-sm">FLUXCORE</span>
            <span className="text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-1.5 py-0.5 rounded font-mono">DFA-V1.0</span>
          </div>
          <h1 className="text-xs text-muted-foreground font-mono tracking-widest uppercase">Demand Forecast Agent</h1>
        </div>
      </div>

      {/* Futuristic Tabs Navigation */}
      <nav className="hidden md:flex items-center gap-1.5 bg-[#050816]/60 border border-[#00f0ff]/10 p-1 rounded-lg">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-all duration-200 ${
              isActive 
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.15)] font-bold' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
            }`
          }
        >
          COMMAND HUD
        </NavLink>
        <NavLink 
          to="/predict" 
          className={({ isActive }) => 
            `px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-all duration-200 ${
              isActive 
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.15)] font-bold' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
            }`
          }
        >
          AI WORKSPACE
        </NavLink>
        <NavLink 
          to="/history" 
          className={({ isActive }) => 
            `px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-all duration-200 ${
              isActive 
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.15)] font-bold' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
            }`
          }
        >
          TELEMETRY ARCHIVE
        </NavLink>
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => 
            `px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-all duration-200 ${
              isActive 
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.15)] font-bold' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
            }`
          }
        >
          ENGINE DIAGNOSTICS
        </NavLink>
      </nav>

      {/* Grid Status Header Details */}
      <div className="flex items-center gap-6">
        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono border-r border-[#00f0ff]/15 pr-6">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${health?.status === 'ok' ? 'text-[#00ff88] animate-pulse' : 'text-[#ef4444]'}`} />
            <span className="text-white font-bold">API:</span>
            <span className={health?.status === 'ok' ? 'text-[#00ff88] font-bold glow-emerald' : 'text-[#ef4444] font-bold'}>
              {health?.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="text-white font-bold">DB:</span>
            <span className={health?.database_connected ? 'text-[#00ff88] font-bold glow-emerald' : 'text-[#ef4444] font-bold'}>
              {health?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-white font-bold">ML:</span>
            <span className="text-[#00f0ff] font-bold glow-cyan">
              {health?.model_loaded ? 'XGBOOST' : 'HEURISTIC'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 ${health?.gemini_available ? 'text-[#c084fc]' : 'text-amber-400'}`} />
            <span className="text-white font-bold">GEMINI:</span>
            <span className={health?.gemini_available ? 'text-[#c084fc] font-bold glow-purple' : 'text-amber-400 font-bold'}>
              {health?.gemini_available ? 'ACTIVE' : 'FALLBACK'}
            </span>
          </div>
        </div>

        {/* Live Date Time */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#00f0ff] bg-[#050816] px-3 py-1.5 rounded border border-[#00f0ff]/15 shadow-[0_0_8px_rgba(0,240,255,0.08)]">
          <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="font-bold">{formatUtc(time)}</span>
        </div>
      </div>
    </header>
  );
}
