import React, { useState, useEffect } from "react";
import { Workflow, Play, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const WorkflowCenter = () => {
  const steps = [
    { id: 1, label: "Observe", desc: "Ingest live grid SCADA metrics", latency: "12ms" },
    { id: 2, label: "Analyze", desc: "Run outlier & cleaning filters", latency: "4ms" },
    { id: 3, label: "Predict", desc: "Forecast load and wind capacities", latency: "145ms" },
    { id: 4, label: "Reason", desc: "Consult rules and Gemini AI model", latency: "1120ms" },
    { id: 5, label: "Plan", desc: "Map physical constraints", latency: "3ms" },
    { id: 6, label: "Optimize", desc: "Solve charge/load dispatch", latency: "85ms" },
    { id: 7, label: "Execute", desc: "Publish command to Event Bus", latency: "18ms" },
    { id: 8, label: "Reflect", desc: "Audit grid response stability", latency: "150ms" },
    { id: 9, label: "Learn", desc: "Save vector context memory", latency: "8ms" }
  ];

  const [activeStep, setActiveStep] = useState(1);

  // Auto loop workflow for visualization
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev === 9 ? 1 : prev + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header description */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2">
        <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
          <Workflow className="w-4 h-4 mr-1.5 animate-spin" /> Workflow Execution Center
        </h3>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          FluxCore AI agents execute this unified loop for every telemetry ingestion epoch. Green glow denotes the active stage of the current grid evaluation thread.
        </p>
      </div>

      {/* 2. Linear Process visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          const isPassed = activeStep > step.id;
          return (
            <motion.div 
              key={step.id}
              animate={{ 
                scale: isActive ? 1.05 : 1.0,
                borderColor: isActive ? "rgba(6, 182, 212, 0.4)" : "rgba(255, 255, 255, 0.05)"
              }}
              className={`p-3 glass-panel rounded-xl border flex flex-col justify-between h-36 ${
                isActive 
                  ? "bg-brand-cyan/10 border-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                  : "bg-slate-900/30"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1 text-[9px] text-slate-500 font-bold">
                  <span>STEP 0{step.id}</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />
                  ) : (
                    isActive && <Activity className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
                  )}
                </div>
                <h4 className={`font-bold uppercase ${isActive ? "text-brand-cyan" : "text-white"}`}>
                  {step.label}
                </h4>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal font-sans">{step.desc}</p>
              </div>
              
              <div className="text-[9px] text-slate-500 font-bold text-right pt-2 border-t border-white/5">
                {step.latency}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Global parameters summary */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2">
        <h4 className="font-bold text-white uppercase text-[10px]">Active Loop Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
          <p className="text-slate-400">Loop Status: <span className="text-brand-emerald font-semibold uppercase">ACTIVE PROCESSING</span></p>
          <p className="text-slate-400">Total Loop Latency: <span className="text-white">1,542 ms</span></p>
          <p className="text-slate-400">Rule Checks: <span className="text-brand-emerald">9 / 9 PASSED</span></p>
          <p className="text-slate-400">Reflection Outcome: <span className="text-brand-emerald">98.5% STABILITY RATING</span></p>
        </div>
      </div>

    </div>
  );
};
