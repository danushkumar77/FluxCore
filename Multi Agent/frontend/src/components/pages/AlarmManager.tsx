import React, { useState } from "react";
import { AlertOctagon, Search, HelpCircle, Activity, ShieldAlert, Check, EyeOff, Volume2 } from "lucide-react";
import { MOCK_ALERTS } from "../../services/mockData";
import { Alert } from "../../types";

export const AlarmManager = () => {
  const [alarms, setAlarms] = useState<any[]>([
    ...MOCK_ALERTS.map(a => ({ ...a, state: "active" })),
    { alert_id: "a-104", asset_id: "ast-tr-001", source_agent: "GridReliabilityAgent", description: "Feeder 4 voltage sag transient below nominal 0.88 pu.", severity: "critical", state: "escalated", timestamp: new Date(Date.now() - 100000).toISOString(), suggested_action: "Initiate battery active discharge." },
    { alert_id: "a-105", asset_id: "ast-wf-001", source_agent: "PredictiveMaintenanceAgent", description: "Vibration telemetry spike on Wind turbine WT-12 core generator.", severity: "low", state: "suppressed", timestamp: new Date(Date.now() - 400000).toISOString(), suggested_action: "Bypass non-critical alerts queue." }
  ]);
  const [filterState, setFilterState] = useState("all");
  const [search, setSearch] = useState("");

  const handleStateChange = (id: string, newState: string) => {
    setAlarms(prev =>
      prev.map(al => al.alert_id === id ? { ...al, state: newState } : al)
    );
  };

  const filtered = alarms.filter(al => {
    const matchesSearch = al.description.toLowerCase().includes(search.toLowerCase()) || 
                          al.source_agent.toLowerCase().includes(search.toLowerCase());
    const matchesState = filterState === "all" || al.state === filterState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Filter States tabs */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1 overflow-x-auto max-w-full">
          {["all", "active", "acknowledged", "suppressed", "escalated"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition ${
                filterState === st 
                  ? "bg-brand-cyan text-slate-950" 
                  : "bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search active alarms..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded py-2 pl-9 pr-4 text-xs text-white outline-none transition"
          />
        </div>
      </div>

      {/* 2. Alarms list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-semibold">
            No alarms registered in database.
          </div>
        ) : (
          filtered.map((al) => {
            const isCritical = al.severity === "critical" || al.severity === "high";
            return (
              <div key={al.alert_id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                isCritical 
                  ? "bg-brand-rose/5 border-brand-rose/25" 
                  : "bg-brand-amber/5 border-brand-amber/25"
              }`}>
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${
                        isCritical 
                          ? "bg-brand-rose/15 text-brand-rose border border-brand-rose/30 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse" 
                          : "bg-brand-amber/15 text-brand-amber border border-brand-amber/30"
                      }`}>
                        {al.severity}
                      </span>
                      <span className="text-slate-400 font-semibold">{al.source_agent}</span>
                      <span className="text-slate-500">[{al.state.toUpperCase()}]</span>
                    </div>
                    <p className="text-white font-sans text-xs mt-2 leading-relaxed">{al.description}</p>
                  </div>

                  <div className="flex space-x-1.5 shrink-0">
                    {al.state === "active" && (
                      <>
                        <button 
                          onClick={() => handleStateChange(al.alert_id, "acknowledged")}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded border border-white/10 text-[9px] font-bold transition flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ACK</span>
                        </button>
                        <button 
                          onClick={() => handleStateChange(al.alert_id, "escalated")}
                          className="bg-brand-rose/15 hover:bg-brand-rose/25 text-brand-rose px-2 py-1 rounded border border-brand-rose/20 text-[9px] font-bold transition flex items-center space-x-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>ESCALATE</span>
                        </button>
                        <button 
                          onClick={() => handleStateChange(al.alert_id, "suppressed")}
                          className="bg-white/5 hover:bg-white/10 text-slate-400 px-2 py-1 rounded border border-white/10 text-[9px] transition flex items-center space-x-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>SUPPRESS</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {al.suggested_action && (
                  <div className="bg-black/35 p-2 rounded text-[10px] italic text-slate-300">
                    Mitigation Advice: {al.suggested_action}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
