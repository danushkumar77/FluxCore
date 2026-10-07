import React from "react";
import { 
  Activity, Cpu, Database, FileText, AlertTriangle, 
  BookOpen, History, Terminal, LineChart, Play, ShieldAlert 
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, pendingCount, alertCount }) {
  const menuItems = [
    { id: "ops", label: "Operations Center", icon: Activity },
    { id: "twin", label: "Digital Twin Sim", icon: Cpu },
    { id: "assets", label: "Asset Intelligence", icon: Play },
    { id: "traces", label: "Decision Timeline", icon: History },
    { id: "copilot", label: "AI Copilot", icon: Terminal },
    { id: "scenario", label: "Scenario Simulator", icon: LineChart },
    { id: "model", label: "Model Monitor", icon: FileText },
    { id: "alerts", label: "Alert Center", icon: AlertTriangle, badge: alertCount },
    { id: "memory", label: "Memory Explorer", icon: Database },
    { id: "knowledge", label: "Knowledge Center", icon: BookOpen },
    { id: "health", label: "System Brain & Health", icon: ShieldAlert }
  ];

  return (
    <div style={{
      width: "260px",
      background: "var(--card-bg-solid)",
      borderRight: "1px solid var(--card-border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0
    }}>
      {/* Platform Title */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #00C8FF, #7C4DFF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "16px",
          color: "#FFF"
        }}>
          FC
        </div>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", fontFamily: "var(--font-title)" }}>FluxCore</h2>
          <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Smart Grid Agent</span>
        </div>
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        padding: "20px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        overflowY: "auto"
      }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "none",
                background: isActive ? "rgba(0, 200, 255, 0.1)" : "none",
                color: isActive ? "var(--color-wind)" : "var(--text-primary)",
                fontWeight: isActive ? "600" : "400",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon size={16} style={{ color: isActive ? "var(--color-wind)" : "var(--text-secondary)" }} />
                <span>{item.label}</span>
              </div>
              
              {/* Badges for Alerts/Pending approvals */}
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  background: item.id === "alerts" ? "#FF5722" : "var(--color-ai)",
                  color: "#FFF",
                  fontSize: "9px",
                  fontWeight: "bold",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  boxShadow: "0 0 6px rgba(0,0,0,0.5)"
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div style={{
        padding: "20px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        fontSize: "11px",
        color: "var(--text-secondary)",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
        <span>System Version: v2.1.0</span>
        <span>Developer ID: Antigravity AI</span>
      </div>
    </div>
  );
}
