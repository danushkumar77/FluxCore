import React from "react";
import { Heart, Activity, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export const SystemHealth = () => {
  const subsystems = [
    { name: "API Gateway (FastAPI)", status: "online", latency: "14ms", details: "Zero dropped connections." },
    { name: "SQLite Database", status: "online", latency: "3ms", details: "Connection pool healthy." },
    { name: "Gemini Reasoning Engine", status: "online", latency: "1,120ms", details: "Google GenerativeAI model active." },
    { name: "Deterministic Rule Engine", status: "online", latency: "1ms", details: "IEC/IEEE parameters loaded." },
    { name: "Redis Cache Layer", status: "degraded", latency: "42ms", details: "Connection timeout warning: Using local in-memory fallback." },
    { name: "RabbitMQ Event Queue", status: "online", latency: "8ms", details: "Priority broker active." },
    { name: "Apache Kafka Stream", status: "online", latency: "12ms", details: "Telemetry logs pipeline active." },
    { name: "Background Workers", status: "online", latency: "2ms", details: "8 / 8 threads active." }
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Health Summary banner */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <Heart className="w-5 h-5 text-brand-emerald animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Overall Platform Health</h3>
            <p className="text-[10px] text-slate-400">Diagnostic sweep completed 1.2s ago.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-1 rounded font-bold">
            98.5% STABILITY RATING
          </span>
        </div>
      </div>

      {/* 2. Subsystems Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {subsystems.map((sub, i) => (
          <div key={i} className={`p-4 glass-panel rounded-xl border flex flex-col justify-between h-36 ${
            sub.status === "online" 
              ? "border-white/5 hover:border-brand-cyan/20" 
              : "border-brand-amber/25 bg-brand-amber/5"
          }`}>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="font-bold text-white uppercase text-[10px]">{sub.name}</h4>
                {sub.status === "online" ? (
                  <CheckCircle className="w-4 h-4 text-brand-emerald shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0 animate-pulse" />
                )}
              </div>
              <p className="text-[9px] text-slate-400 font-sans leading-normal">{sub.details}</p>
            </div>
            
            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-500 uppercase text-[9px]">Latency</span>
              <span className={sub.status === "online" ? "text-brand-cyan" : "text-brand-amber"}>
                {sub.latency}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
