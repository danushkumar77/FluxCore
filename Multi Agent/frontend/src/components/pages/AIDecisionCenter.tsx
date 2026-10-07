import React, { useState } from "react";
import { Brain, ShieldCheck, AlertCircle, Play, CheckCircle2, History } from "lucide-react";
import { ExplainableDecision } from "../../types";

export const AIDecisionCenter = () => {
  const [overrideActive, setOverrideActive] = useState(false);

  const mockDecision: ExplainableDecision = {
    decision_id: "d-87f-92",
    agent_name: "BatteryEnergyAgent",
    timestamp: new Date().toISOString(),
    confidence_score: 0.94,
    engineering_explanation: "Substation A load transformer core temp is high (82C) and feeder load reached 80.4 MW (95% rating). To prevent core oil oxidation and transient relay trips, BESS unit 1 must inject active power. Charge schedule is curtailed and discharge initiated at 4.0 MW to offset localized peak loading.",
    influencing_factors: {
      "transformer_temperature": 0.85,
      "active_load_mw": 0.92,
      "market_price": 0.15
    },
    risk_assessment: {
      hazard: "Overheating & Thermal Sag",
      probability: "High",
      impact: "High",
      description: "Transformer damage leading to localized blackouts if cooling systems fail."
    },
    recommended_corrective_actions: [
      "Discharge BESS 1 at 4.0 MW for 30 minutes.",
      "Initiate transformer auxiliary cooling fan systems.",
      "Standby for industrial load shed command."
    ],
    decision_trace: [
      "Rule Check: IEEE-1547 compliant.",
      "Model Inference: Random Forest predicts overload probability at 92.4%.",
      "Safety Verification: Approved. Battery SOC is sufficient (75.0%)."
    ],
    justification: "Stabilizing localized load profile takes physical priority over economic wholesale energy sell margins."
  };

  const handleOverride = () => {
    setOverrideActive(!overrideActive);
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header State */}
      <div className="flex justify-between items-center p-4 glass-panel rounded-xl border border-white/5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-purple/15 rounded-lg border border-brand-purple/30 text-brand-purple animate-pulse">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Active Decision Loop</h3>
            <p className="text-[10px] text-slate-400">Agent: {mockDecision.agent_name} | Latency: 1.12 sec</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleOverride}
            className={`px-3 py-1.5 rounded text-[10px] font-semibold transition border ${
              overrideActive 
                ? "bg-brand-rose/15 text-brand-rose border-brand-rose/30" 
                : "bg-white/5 text-slate-300 border-white/10 hover:border-brand-amber/30"
            }`}
          >
            {overrideActive ? "● OPERATOR OVERRIDE ACTIVE" : "MANUAL OVERRIDE"}
          </button>
        </div>
      </div>

      {/* 2. Decision Card and Audit Splitted panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Card 1 & 2: Explanation & Variables (Double Column Width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="font-bold text-brand-cyan uppercase">Engineering Justification</h4>
              <span className="text-[10px] bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded font-bold">
                CONFIDENCE: {Math.round(mockDecision.confidence_score * 100)}%
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{mockDecision.engineering_explanation}</p>
            <p className="text-slate-400 italic text-[10px]">Justification: {mockDecision.justification}</p>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Recommended Corrective Actions</span>
              <div className="space-y-1">
                {mockDecision.recommended_corrective_actions.map((act, i) => (
                  <div key={i} className="flex items-center space-x-2 text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Safety & Rule Engine Audit */}
        <div className="space-y-4">
          <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
            <h4 className="font-bold text-brand-cyan uppercase flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-emerald" /> Rule Engine Validation
            </h4>
            <div className="p-2.5 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald rounded text-[10px] font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>SAFETY SYSTEM CHECKS PASSED</span>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[9px] text-slate-500 uppercase block">Trace Audits</span>
              {mockDecision.decision_trace.map((tr, i) => (
                <div key={i} className="p-1.5 bg-slate-900/40 rounded border border-white/5 text-[10px] text-slate-300">
                  {tr}
                </div>
              ))}
            </div>
          </div>

          {/* Risk assessment */}
          <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2">
            <h4 className="font-bold text-brand-rose uppercase flex items-center text-[11px]">
              <AlertCircle className="w-4 h-4 mr-1.5 text-brand-rose animate-pulse" /> Risk Rating: {mockDecision.risk_assessment.impact}
            </h4>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              <strong>Hazard:</strong> {mockDecision.risk_assessment.hazard} <br />
              <strong>Details:</strong> {mockDecision.risk_assessment.description}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
