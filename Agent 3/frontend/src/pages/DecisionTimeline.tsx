import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { History, Award, CheckCircle, HelpCircle } from "lucide-react";

export default function DecisionTimeline() {
  const { telemetry } = useBess();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/battery/history?limit=30")
      .then(res => res.json())
      .then(data => {
        if (data.decisions) {
          setDecisions(data.decisions);
        }
      })
      .catch(err => console.error("Error loading timeline:", err))
      .finally(() => setLoading(false));
  }, [telemetry]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Overview Header */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><History style={{ color: "var(--energy-cyan)" }} /> BESS Decision Registry Timeline</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
          Chronological record of BESS optimizer selections. Audit actions, pricing offsets, and the LLM's physical cell rationale.
        </p>
      </div>

      {/* Timeline Layout */}
      <div className="glass-panel" style={{ padding: "30px 24px", position: "relative" }}>
        {decisions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
            
            {/* Center line */}
            <div style={{ position: "absolute", left: "19px", top: "10px", bottom: "10px", width: "2px", backgroundColor: "rgba(255,255,255,0.06)" }} />

            {decisions.map((dec, idx) => {
              const date = new Date(dec.timestamp);
              const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              
              const isProfit = (dec.expected_revenue - dec.expected_cost) >= 0;
              const profitText = isProfit ? `+$${(dec.expected_revenue - dec.expected_cost).toFixed(2)}` : `-$${Math.abs(dec.expected_revenue - dec.expected_cost).toFixed(2)}`;

              return (
                <div key={dec.decision_id} style={{ display: "flex", gap: "20px", position: "relative", zIndex: 1 }}>
                  
                  {/* Bullet Node */}
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--bg-secondary)", 
                    border: "2px solid var(--energy-cyan)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 0 8px rgba(0, 200, 255, 0.2)"
                  }}>
                    <Award size={18} style={{ color: "var(--energy-cyan)" }} />
                  </div>

                  {/* Body Content card */}
                  <div className="glass-panel" style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                      <div>
                        <h4 style={{ color: "var(--energy-cyan)", fontSize: "0.95rem" }}>{dec.selected_plan}</h4>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Date: {formattedDate} | Time: {formattedTime} | CID: {dec.decision_id.slice(0, 8)}</span>
                      </div>
                      
                      <div style={{ textAlign: "right" }}>
                        <span className="status-badge badge-nominal" style={{ fontSize: "0.65rem" }}>{dec.status}</span>
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: isProfit ? "var(--battery-green)" : "var(--text-primary)", marginTop: "4px" }}>
                          {profitText}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600 }}>Gemini Physics reasoning:</span>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.4" }}>
                        {dec.explanation}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <span>Grid Impact: <strong>{(dec.grid_impact * 100).toFixed(0)}%</strong></span>
                      <span>Wear Impact: <strong>{(dec.degradation_estimate * 100).toFixed(5)}% SOH</strong></span>
                      <span>Decision Confidence: <strong>{(dec.confidence * 100).toFixed(0)}%</strong></span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No decisions logged in current cycles database.
          </div>
        )}
      </div>

    </div>
  );
}
