import React, { useState } from "react";
import { AlertTriangle, Bell, Mail, MessageSquare, Check, ShieldAlert } from "lucide-react";
import { MOCK_ALERTS, MOCK_NOTIFICATIONS } from "../../services/mockData";
import { Alert } from "../../types";

export const AlertsCenter = () => {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>(MOCK_ALERTS);

  const handleAcknowledge = (id: string) => {
    setActiveAlerts((prev) => 
      prev.map((al) => al.alert_id === id ? { ...al, status: "acknowledged" } : al)
    );
  };

  const handleClear = (id: string) => {
    setActiveAlerts((prev) => prev.filter((al) => al.alert_id !== id));
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Alerts split and notification routing panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Left Double Column: Active alert grid */}
        <div className="xl:col-span-2 space-y-3">
          <div className="p-4 glass-panel rounded-xl border border-white/5">
            <h3 className="text-xs font-bold uppercase text-brand-rose tracking-wider flex items-center mb-4">
              <ShieldAlert className="w-4 h-4 mr-1.5 text-brand-rose animate-pulse" /> Active Operator Alarms
            </h3>
            
            {activeAlerts.length === 0 ? (
              <div className="py-6 text-center text-slate-500 font-semibold">
                No active alarm triggers. Grid operating normally.
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((al) => (
                  <div key={al.alert_id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    al.severity === "high" || al.severity === "critical"
                      ? "bg-brand-rose/5 border-brand-rose/25" 
                      : "bg-brand-amber/5 border-brand-amber/25"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${
                            al.severity === "high" || al.severity === "critical"
                              ? "bg-brand-rose/15 text-brand-rose border border-brand-rose/30" 
                              : "bg-brand-amber/15 text-brand-amber border border-brand-amber/30"
                          }`}>
                            {al.severity}
                          </span>
                          <span className="text-slate-400 font-semibold">{al.source_agent}</span>
                        </div>
                        <p className="text-white font-sans text-xs mt-2 leading-relaxed">{al.description}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        {al.status === "active" ? (
                          <button 
                            onClick={() => handleAcknowledge(al.alert_id)}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-white/10 transition text-[9px]"
                          >
                            ACKNOWLEDGE
                          </button>
                        ) : (
                          <span className="text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-1 rounded text-[9px] font-bold">
                            ACKNOWLEDGED
                          </span>
                        )}
                        <button 
                          onClick={() => handleClear(al.alert_id)}
                          className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 rounded border border-white/10 transition text-[9px]"
                        >
                          CLEAR
                        </button>
                      </div>
                    </div>
                    
                    {al.suggested_action && (
                      <div className="bg-black/35 p-2 rounded text-[10px] italic text-slate-300">
                        Suggested Action: {al.suggested_action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dispatch Queues */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <Bell className="w-4 h-4 mr-1.5" /> Dispatch Queues
          </h3>
          <p className="text-[10px] text-slate-400">Verifying webhook routing channels...</p>

          <div className="space-y-3 pt-2">
            {MOCK_NOTIFICATIONS.map((notif, idx) => (
              <div key={idx} className="p-3 bg-slate-900/40 rounded border border-white/5 text-[10px] space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span className="uppercase text-slate-300 flex items-center space-x-1.5">
                    {notif.channel === "slack" ? (
                      <MessageSquare className="w-3.5 h-3.5 text-brand-purple" />
                    ) : notif.channel === "email" ? (
                      <Mail className="w-3.5 h-3.5 text-brand-cyan" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-brand-emerald" />
                    )}
                    <span>{notif.channel}</span>
                  </span>
                  <span className="text-slate-500 font-semibold">{notif.sentAt}</span>
                </div>
                <p className="text-slate-400 font-sans leading-normal">{notif.msg}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
