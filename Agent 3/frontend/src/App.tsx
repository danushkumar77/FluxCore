import React, { useState, useEffect, createContext, useContext } from "react";
import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { 
  Activity, Cpu, ShieldAlert, BookOpen, Database, 
  History, Shield, BarChart3, Settings, DollarSign, 
  Compass, MessageSquare, AlertTriangle, RefreshCw,
  Clock, Radio, Power, Eye, Flame, ShieldCheck, Thermometer
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Import pages
import OperationsCenter from "./pages/OperationsCenter";
import DigitalTwin from "./pages/DigitalTwin";
import AssetManagement from "./pages/AssetManagement";
import AiCopilot from "./pages/AiCopilot";
import HealthMonitor from "./pages/HealthMonitor";
import RulDashboard from "./pages/RulDashboard";
import StrategyCenter from "./pages/StrategyCenter";
import TradingSimulator from "./pages/TradingSimulator";
import AlertCenter from "./pages/AlertCenter";
import DecisionTimeline from "./pages/DecisionTimeline";
import MemoryExplorer from "./pages/MemoryExplorer";
import KnowledgeCenter from "./pages/KnowledgeCenter";
import SystemHealth from "./pages/SystemHealth";

// Shared BESS data context
interface BessContextType {
  telemetry: any;
  agentState: string;
  policy: string;
  alerts: any[];
  latency: any;
  autonomousMode: boolean;
  setAutonomousMode: (val: boolean) => void;
  coolingOverride: number;
  setCoolingOverride: (val: number) => void;
  breakerTripped: boolean;
  setBreakerTripped: (val: boolean) => void;
  changePolicy: (newPolicy: string) => void;
  triggerRefresh: () => void;
}

export const BessContext = createContext<BessContextType>({
  telemetry: null,
  agentState: "Idle",
  policy: "MIN_COST",
  alerts: [],
  latency: {},
  autonomousMode: true,
  setAutonomousMode: () => {},
  coolingOverride: 40,
  setCoolingOverride: () => {},
  breakerTripped: false,
  setBreakerTripped: () => {},
  changePolicy: () => {},
  triggerRefresh: () => {}
});

export const useBess = () => useContext(BessContext);

export default function App() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [agentState, setAgentState] = useState<string>("Idle");
  const [policy, setPolicy] = useState<string>("MIN_COST");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [latency, setLatency] = useState<any>({});
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [time, setTime] = useState<string>("");
  
  // Interactive command center switches
  const [autonomousMode, setAutonomousMode] = useState<boolean>(true);
  const [coolingOverride, setCoolingOverride] = useState<number>(40); // 40% fan speed manual
  const [breakerTripped, setBreakerTripped] = useState<boolean>(false);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      console.log("Connecting BESS WebSocket feed...");
      socket = new WebSocket("ws://127.0.0.1:8000/ws");
      
      socket.onopen = () => {
        console.log("BESS WebSocket connected.");
        setWs(socket);
        setWsStatus("CONNECTED");
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === "agent_state_changed") {
            setAgentState(data.state);
            setPolicy(data.policy);
          } else if (data.event === "cycle_completed") {
            setLatency(data.latency_ms || {});
            triggerRefresh(); // Refresh historical logs dynamically
          } else if (data.event === "battery.telemetry.updated") {
            setTelemetry(data.payload);
          } else if (data.event === "battery.alert.created") {
            setAlerts(prev => [data.payload, ...prev].slice(0, 100));
          }
        } catch (e) {
          console.error("Error parsing WS packet:", e);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket Error:", err);
        setWsStatus("DISCONNECTED");
      };

      socket.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting in 3s...");
        setWsStatus("DISCONNECTED");
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    // Load active alerts
    fetch("http://127.0.0.1:8000/alerts?active_only=true")
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error("Error loading alerts:", err));

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [refreshTrigger]);

  const changePolicy = (newPolicy: string) => {
    setPolicy(newPolicy);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "change_policy", policy: newPolicy }));
    }
  };

  // Nav items configuration
  const navItems = [
    { name: "Operations Center", path: "/", icon: Activity },
    { name: "3D Digital Twin", path: "/twin", icon: Compass },
    { name: "Fleet Management", path: "/assets", icon: Radio },
    { name: "AI Copilot Center", path: "/copilot", icon: MessageSquare },
    { name: "Battery Health Center", path: "/health", icon: Shield },
    { name: "Useful Life (RUL)", path: "/rul", icon: BarChart3 },
    { name: "Strategy Center", path: "/strategy", icon: Settings },
    { name: "Trading Simulator", path: "/trading", icon: DollarSign },
    { name: "Safety Center", path: "/alerts", icon: ShieldAlert },
    { name: "Decision Timeline", path: "/timeline", icon: History },
    { name: "Memory Explorer", path: "/memory", icon: Database },
    { name: "Knowledge Center", path: "/knowledge", icon: BookOpen },
    { name: "System Health", path: "/system", icon: Cpu }
  ];

  return (
    <BessContext.Provider value={{ 
      telemetry, agentState, policy, alerts, latency, 
      autonomousMode, setAutonomousMode, coolingOverride, setCoolingOverride, 
      breakerTripped, setBreakerTripped, changePolicy, triggerRefresh 
    }}>
      <Router>
        <div className="control-deck">
          
          {/* Top Bar Header */}
          <header className="mission-panel" style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: wsStatus === "CONNECTED" ? "var(--energy-cyan)" : "var(--critical-red)", boxShadow: wsStatus === "CONNECTED" ? "var(--glow-cyan)" : "var(--glow-red)" }} />
                <h1 className="tech-font" style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "1px" }}>FLUXCORE BESS OPS</h1>
              </div>
              <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
                Agent 3
              </span>
            </div>

            {/* State indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={14} style={{ color: "var(--text-secondary)" }} />
                <span className="tech-font" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{time}</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Auto Control</span>
                <button 
                  onClick={() => setAutonomousMode(!autonomousMode)}
                  style={{
                    width: "44px",
                    height: "22px",
                    borderRadius: "11px",
                    backgroundColor: autonomousMode ? "var(--battery-green)" : "rgba(255,255,255,0.1)",
                    border: "none",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    position: "absolute",
                    top: "2px",
                    left: autonomousMode ? "24px" : "2px",
                    transition: "left 0.2s"
                  }} />
                </button>
              </div>

              {!autonomousMode && (
                <div className="status-badge badge-critical" style={{ animation: "pulse 1s infinite alternate", fontSize: "0.7rem", padding: "3px 8px" }}>
                  Human override
                </div>
              )}

              {breakerTripped && (
                <div className="status-badge badge-critical" style={{ animation: "pulse 0.8s infinite alternate", fontSize: "0.7rem", padding: "3px 8px" }}>
                  Breaker Trip
                </div>
              )}
            </div>
          </header>

          {/* Lower layout wrapper */}
          <div style={{ display: "flex", flex: 1, minHeight: 0, gap: "12px" }}>
            
            {/* Sidebar Navigation */}
            <aside className="mission-panel" style={{ width: "240px", padding: "12px", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0 }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px", paddingLeft: "8px", fontWeight: 600 }}>Command Deck</div>
              
              <nav style={{ display: "flex", flexDirection: "column", gap: "3px", overflowY: "auto", flex: 1 }}>
                <SidebarNavItems items={navItems} />
              </nav>

              {/* Loop ticker */}
              <div className="mission-panel" style={{ padding: "10px", border: "1px dashed var(--glass-border)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Loop Status</span>
                  <span className="status-badge badge-nominal" style={{ fontSize: "0.6rem", padding: "1px 6px" }}>{wsStatus}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <RefreshCw size={12} className={agentState !== "Idle" ? "fan-rotating-fast" : ""} style={{ color: "var(--energy-cyan)" }} />
                  <span className="tech-font" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{agentState.toUpperCase()}</span>
                </div>
              </div>
            </aside>

            {/* Page Router View Wrapper */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<PageWrapper><OperationsCenter /></PageWrapper>} />
                  <Route path="/twin" element={<PageWrapper><DigitalTwin /></PageWrapper>} />
                  <Route path="/assets" element={<PageWrapper><AssetManagement /></PageWrapper>} />
                  <Route path="/copilot" element={<PageWrapper><AiCopilot /></PageWrapper>} />
                  <Route path="/health" element={<PageWrapper><HealthMonitor /></PageWrapper>} />
                  <Route path="/rul" element={<PageWrapper><RulDashboard /></PageWrapper>} />
                  <Route path="/strategy" element={<PageWrapper><StrategyCenter /></PageWrapper>} />
                  <Route path="/trading" element={<PageWrapper><TradingSimulator /></PageWrapper>} />
                  <Route path="/alerts" element={<PageWrapper><AlertCenter /></PageWrapper>} />
                  <Route path="/timeline" element={<PageWrapper><DecisionTimeline /></PageWrapper>} />
                  <Route path="/memory" element={<PageWrapper><MemoryExplorer /></PageWrapper>} />
                  <Route path="/knowledge" element={<PageWrapper><KnowledgeCenter /></PageWrapper>} />
                  <Route path="/system" element={<PageWrapper><SystemHealth /></PageWrapper>} />
                </Routes>
              </AnimatePresence>
            </div>

          </div>

        </div>
      </Router>
    </BessContext.Provider>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ width: "100%", height: "100%", overflowY: "auto", paddingRight: "4px" }}
    >
      {children}
    </motion.div>
  );
}

function SidebarNavItems({ items }: { items: any[] }) {
  const location = useLocation();
  return (
    <>
      {items.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              padding: "8px 12px", 
              borderRadius: "6px", 
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)", 
              backgroundColor: isActive ? "rgba(0, 200, 255, 0.12)" : "transparent",
              borderLeft: isActive ? "2.5px solid var(--energy-cyan)" : "2.5px solid transparent",
              textDecoration: "none",
              fontSize: "0.82rem",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s"
            }}
            className={isActive ? "" : "sidebar-link-hover"}
          >
            <Icon size={16} style={{ color: isActive ? "var(--energy-cyan)" : "var(--text-secondary)", flexShrink: 0 }} />
            <span className="tech-font" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}
