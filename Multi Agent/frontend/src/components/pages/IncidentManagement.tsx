import React, { useState } from "react";
import { ShieldAlert, CheckCircle, Clock, Search, HelpCircle, Activity } from "lucide-react";
import { MOCK_INCIDENTS } from "../../services/mockData";
import { MockIncident } from "../../services/mockData";

export const IncidentManagement = () => {
  const [incidents, setIncidents] = useState<MockIncident[]>(MOCK_INCIDENTS);
  const [searchTerm, setSearchTerm] = useState("");

  const handleResolve = (id: string) => {
    setIncidents(prev =>
      prev.map(inc => 
        inc.id === id 
          ? { 
              ...inc, 
              status: "resolved", 
              timeline: [...inc.timeline, { step: "Resolved", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
            } 
          : inc
      )
    );
  };

  const handleTransition = (id: string, nextStatus: typeof MOCK_INCIDENTS[0]["status"]) => {
    setIncidents(prev =>
      prev.map(inc => 
        inc.id === id 
          ? { 
              ...inc, 
              status: nextStatus, 
              timeline: [...inc.timeline, { step: nextStatus.replace("_", " "), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
            } 
          : inc
      )
    );
  };

  const filtered = incidents.filter(inc => 
    inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lifecycleStages = [
    "fault",
    "incident_created",
    "investigating",
    "root_cause_identified",
    "recommended_action_issued",
    "operator_review",
    "resolved"
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Toolbar */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search incidents by ID, title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded py-2 pl-9 pr-4 text-xs text-white outline-none transition"
          />
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Unresolved Tickets</span>
          <span className="text-brand-rose font-bold">
            {incidents.filter(i => i.status !== "resolved").length} Active
          </span>
        </div>
      </div>

      {/* 2. Incidents List & Lifecycle flow */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-semibold">
            No incidents found in log history.
          </div>
        ) : (
          filtered.map((inc) => {
            const currentStageIdx = lifecycleStages.indexOf(inc.status);
            return (
              <div key={inc.id} className="p-5 glass-panel rounded-xl border border-white/5 space-y-4">
                
                {/* Header title */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-white/5 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] bg-brand-rose/15 text-brand-rose border border-brand-rose/30 px-2 py-0.5 rounded font-bold uppercase">
                        {inc.severity}
                      </span>
                      <span className="text-slate-400 font-bold">ID: {inc.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5">{inc.title}</h3>
                  </div>

                  <div className="flex space-x-2">
                    {inc.status !== "resolved" && (
                      <>
                        {inc.status === "recommended_action_issued" && (
                          <button 
                            onClick={() => handleTransition(inc.id, "operator_review")}
                            className="bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan border border-brand-cyan/30 px-3 py-1.5 rounded transition text-[10px]"
                          >
                            SUBMIT FOR REVIEW
                          </button>
                        )}
                        {inc.status === "operator_review" && (
                          <button 
                            onClick={() => handleResolve(inc.id)}
                            className="bg-brand-emerald/15 hover:bg-brand-emerald/25 text-brand-emerald border border-brand-emerald/30 px-3 py-1.5 rounded transition text-[10px]"
                          >
                            RESOLVE INCIDENT
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Lifecycle Pipeline Flow Bar */}
                <div className="space-y-2">
                  <span className="text-[8px] text-slate-500 uppercase block font-bold">Incident Lifecycle Progress</span>
                  <div className="flex items-center justify-between overflow-x-auto gap-4 py-2 border-y border-white/5">
                    {lifecycleStages.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIdx;
                      const isActive = idx === currentStageIdx;
                      return (
                        <div key={stage} className="flex items-center space-x-2 shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                            isActive 
                              ? "bg-brand-cyan text-slate-950 border-brand-cyan shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse" 
                              : isCompleted 
                                ? "bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40" 
                                : "bg-transparent text-slate-600 border-slate-700"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[9px] uppercase font-bold tracking-wider ${
                            isActive ? "text-brand-cyan font-bold" : isCompleted ? "text-slate-400" : "text-slate-600"
                          }`}>
                            {stage.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details layout grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] pt-2">
                  <div className="space-y-1 bg-slate-900/40 p-3 rounded border border-white/5">
                    <span className="text-slate-500 uppercase block font-bold text-[8px]">Incident Parameters</span>
                    <p className="text-slate-300"><strong>Assigned Engineer:</strong> {inc.assignedEngineer}</p>
                    <p className="text-slate-300"><strong>Affected Asset:</strong> {inc.assetId}</p>
                    <p className="text-slate-300"><strong>Incident Time:</strong> {new Date(inc.timestamp).toLocaleTimeString()}</p>
                  </div>
                  
                  <div className="space-y-1 bg-slate-900/40 p-3 rounded border border-white/5">
                    <span className="text-slate-500 uppercase block font-bold text-[8px]">Root Cause Analysis</span>
                    <p className="text-slate-300 leading-normal">{inc.rootCause}</p>
                  </div>

                  <div className="space-y-1 bg-slate-900/40 p-3 rounded border border-white/5">
                    <span className="text-slate-500 uppercase block font-bold text-[8px]">Emergency Recovery Plan</span>
                    <p className="text-slate-300 leading-normal">{inc.recoveryPlan}</p>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
