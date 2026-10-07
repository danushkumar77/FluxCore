import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { Settings, Shield, Award, HelpCircle, CheckCircle } from "lucide-react";

export default function StrategyCenter() {
  const { policy, changePolicy, telemetry } = useBess();
  const [optResult, setOptResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const policiesList = [
    { id: "MIN_COST", name: "Minimum Cost", desc: "Prioritizes charging when pricing is negative/cheap; discharges to cut grid costs." },
    { id: "MAX_LIFETIME", name: "Max Battery Lifetime", desc: "Throttles C-rates to minimize SEI layer growth and thermal stress." },
    { id: "MAX_RENEWABLES", name: "Max Renewable Util.", desc: "Coordinates charging cycles strictly with solar surplus peaks." },
    { id: "PEAK_SHAVING", name: "Peak Shaving", desc: "Discharges BESS during high peak local transformer demands." },
    { id: "CARBON_REDUCTION", name: "Carbon Reduction", desc: "Captures zero-emission energy; offsets grid peaker fossil fuels." },
    { id: "EMERGENCY_RESILIENCE", name: "Emergency Resilience", desc: "Locks capacity at 90% SOC reserve for unexpected outages." },
    { id: "ENERGY_TRADING", name: "Energy Arbitrage", desc: "High-frequency battery trading on volatile day-ahead spreads." },
    { id: "GRID_STABILITY", name: "Grid Frequency Support", desc: "Responds to grid frequency and voltage deviations." }
  ];

  const fetchOptimization = async (selectedPolicy: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/battery/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container_id: "BESS-001", policy: selectedPolicy })
      });
      const data = await res.json();
      setOptResult(data);
    } catch (e) {
      console.error("Optimization query failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimization(policy);
  }, [policy, telemetry]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Policy Selector Section */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Settings size={18} /> Global BESS Optimization Policies</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {policiesList.map(p => (
            <div 
              key={p.id} 
              onClick={() => changePolicy(p.id)}
              style={{ 
                padding: "14px", 
                borderRadius: "8px", 
                cursor: "pointer", 
                backgroundColor: policy === p.id ? "rgba(0, 200, 255, 0.15)" : "rgba(255,255,255,0.02)", 
                border: policy === p.id ? "1px solid var(--energy-cyan)" : "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                transition: "all 0.2s"
              }}
              className="sidebar-link-hover"
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: policy === p.id ? "var(--energy-cyan)" : "var(--text-primary)" }}>{p.name}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Action Strategy & Plan comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        
        {/* Selected Plan Details */}
        <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Award size={18} style={{ color: "var(--battery-green)" }} /> Selected Plan: {optResult?.best_plan?.name || "Evaluating..."}</h3>
          
          {optResult?.best_plan ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Charge Power Target</span>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--energy-cyan)" }}>{optResult.best_plan.power_kw.toFixed(1)} kW</p>
              </div>

              <div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Engineering Reasoning (Gemini)</span>
                <p style={{ color: "var(--text-primary)", fontStyle: "italic", marginTop: "4px" }}>
                  "{optResult.gemini_reasoning?.explanation || optResult.best_plan.engineering_explanation}"
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Confidence</span>
                  <p style={{ fontWeight: 600, color: "var(--battery-green)" }}>{(optResult.gemini_reasoning?.confidence_score || optResult.best_plan.confidence_score * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Expected Cost</span>
                  <p style={{ fontWeight: 600 }}>${optResult.best_plan.expected_cost.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Revenue</span>
                  <p style={{ fontWeight: 600, color: "var(--battery-green)" }}>${optResult.best_plan.expected_revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading optimal plan details...</div>
          )}
        </div>

        {/* All Plans Scores & Metrics Comparison */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3>Multi-Objective Strategy Evaluations</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Candidate plans scored against active multi-criteria optimization weights.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {optResult?.all_plans?.map((plan: any) => {
              const isSelected = optResult.best_plan?.plan_id === plan.plan_id;
              const score = optResult.optimization_scores?.[plan.plan_id] || 0.0;
              
              return (
                <div 
                  key={plan.plan_id} 
                  style={{ 
                    border: isSelected ? "1px solid var(--energy-cyan)" : "1px solid rgba(255,255,255,0.05)", 
                    borderRadius: "8px", 
                    padding: "12px 16px",
                    backgroundColor: isSelected ? "rgba(0, 200, 255, 0.02)" : "rgba(255,255,255,0.01)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {isSelected ? <CheckCircle size={18} style={{ color: "var(--energy-cyan)" }} /> : <HelpCircle size={18} style={{ color: "var(--text-muted)" }} />}
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{plan.name}</span>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>{plan.action} | Wear: {plan.battery_degradation.toFixed(5)}% | Carbon offset: {plan.carbon_reduction.toFixed(0)} kg</p>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Weighted Score</span>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, color: isSelected ? "var(--energy-cyan)" : "var(--text-primary)" }}>
                      {score.toFixed(3)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
