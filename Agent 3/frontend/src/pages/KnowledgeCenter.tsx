import React, { useState } from "react";
import { BookOpen, AlertTriangle, ShieldCheck, Cpu, Clipboard } from "lucide-react";

export default function KnowledgeCenter() {
  const [activeTab, setActiveTab] = useState<string>("limits");

  const categories = [
    { id: "limits", name: "Operating Limits", icon: Clipboard },
    { id: "charging", name: "Charging Rules", icon: Cpu },
    { id: "thermal", name: "Thermal Safety", icon: AlertTriangle },
    { id: "emergency", name: "Emergency SOPs", icon: ShieldCheck }
  ];

  const content: Record<string, any[]> = {
    limits: [
      { code: "LIMIT-VOLT-MAX", name: "Maximum Cell Voltage Limit", value: "4.25 V", desc: "Exceeding this value risks lithium plating on the anode, raising short-circuit probabilities and SOH decay rates." },
      { code: "LIMIT-VOLT-MIN", name: "Minimum Cell Voltage Limit", value: "2.75 V", desc: "Dropping below this boundary initiates copper current-collector dissolution, creating dendrites during recharge." },
      { code: "LIMIT-SOC-MAX", name: "Maximum State of Charge Target", value: "100.0 %", desc: "High SoC states lead to elevated anode potential, accelerating SEI layer calendar degradation." },
      { code: "LIMIT-SOC-MIN", name: "Minimum State of Charge Target", value: "5.0 %", desc: "Prevents voltage collapse under transient load spikes." }
    ],
    charging: [
      { code: "CHARGE-RATE-MAX", name: "Standard Max Charge C-Rate", value: "1.0 C", desc: "Nominal grid power transfer rate." },
      { code: "CHARGE-TEMP-LIMIT", name: "Cold Temperature Limit", value: "0.1 C below 0°C", desc: "Cold conditions restrict lithium diffusion. Charge rates are throttled to prevent metallic lithium plating." },
      { code: "CHARGE-SOC-TAPER", name: "Voltage Taper Regulation", value: "0.25 C above 80% SOC", desc: "Throttling active power charging past 80% prevents overpotential issues." }
    ],
    thermal: [
      { code: "THERMAL-WARM-COOLING", name: "Active Cooling Trigger", value: "32.0 °C", desc: "Activates liquid loop pump flow to regulate internal container temperatures." },
      { code: "THERMAL-HOT-THROTTLE", name: "Protective Rate Throttle", value: "45.0 °C (0.2C limit)", desc: "Restricts electrical load transfer to allow natural heat dissipation." },
      { code: "THERMAL-CRITICAL-SHUTDOWN", name: "Critical Safety Trip", value: "55.0 °C", desc: "Initiates emergency array disconnection to mitigate thermal runaway." }
    ],
    emergency: [
      { code: "EMERGENCY-OVERVOLT", name: "High Voltage Circuit Trip", value: "4.35 V", desc: "Disconnect BESS if cell voltage exceeds safety margin." },
      { code: "EMERGENCY-UNDERVOLT", name: "Low Voltage Circuit Trip", value: "2.50 V", desc: "Disconnect BESS if cell voltage collapses." },
      { code: "EMERGENCY-THERMAL-RUNAWAY", name: "Fire Suppression Active", value: "65.0 °C", desc: "Deploys container clean-agent gas suppressor and isolates primary microgrid connection." }
    ]
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Overview Block */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><BookOpen style={{ color: "var(--energy-cyan)" }} /> BESS Engineering Knowledge Repository</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
          Reference library of operating parameters, thermal safety limits, and standard operating procedures (SOPs).
        </p>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "20px" }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSel = activeTab === cat.id;
            return (
              <div 
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px", 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  cursor: "pointer",
                  backgroundColor: isSel ? "rgba(0, 200, 255, 0.15)" : "rgba(255,255,255,0.02)",
                  border: isSel ? "1px solid var(--energy-cyan)" : "1px solid rgba(255,255,255,0.05)",
                  transition: "all 0.2s"
                }}
                className="sidebar-link-hover"
              >
                <Icon size={18} style={{ color: isSel ? "var(--energy-cyan)" : "var(--text-secondary)" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: isSel ? 600 : 400 }}>{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h4 style={{ textTransform: "capitalize", marginBottom: "16px" }}>{activeTab.replace("_", " ")} Specifications</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {content[activeTab]?.map(rule => (
              <div key={rule.code} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--ai-purple)", fontFamily: "Roboto Mono", fontWeight: 600 }}>{rule.code}</span>
                    <h5 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginTop: "2px" }}>{rule.name}</h5>
                  </div>
                  <span className="status-badge badge-nominal" style={{ fontSize: "0.75rem", fontFamily: "Roboto Mono", backgroundColor: "rgba(0, 200, 255, 0.1)", color: "var(--energy-cyan)", borderColor: "rgba(0, 200, 255, 0.2)" }}>
                    {rule.value}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "6px" }}>{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
