import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";

// Sub-pages/Tabs
import OperationsCenter from "./components/OperationsCenter";
import DigitalTwinView from "./components/DigitalTwinView";
import AssetIntelligence from "./components/AssetIntelligence";
import DecisionTimeline from "./components/DecisionTimeline";
import AICopilot from "./components/AICopilot";
import ScenarioSimulator from "./components/ScenarioSimulator";
import ModelMonitoring from "./components/ModelMonitoring";
import AlertCenter from "./components/AlertCenter";
import MemoryExplorer from "./components/MemoryExplorer";
import KnowledgeCenter from "./components/KnowledgeCenter";
import SystemHealth from "./components/SystemHealth";

export default function App() {
  const [activeTab, setActiveTab] = useState("ops");
  
  // Data states
  const [summary, setSummary] = useState(null);
  const [agentState, setAgentState] = useState("Idle");
  const [streamLog, setStreamLog] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // List records
  const [historyList, setHistoryList] = useState([]);
  const [toolLogs, setToolLogs] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [decisionTraces, setDecisionTraces] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  
  // Copilot History
  const [chatLog, setChatLog] = useState([
    { sender: "copilot", text: "Welcome to FluxCore smart grid dispatch room. I am your AI Copilot. Ask me any grid telemetry questions." }
  ]);
  const [isWaitingCopilot, setIsWaitingCopilot] = useState(false);

  const API_BASE = "http://127.0.0.1:8001";

  // Refresh DB lists
  const refreshData = async () => {
    try {
      // 1. History list
      const histRes = await fetch(`${API_BASE}/history?limit=30`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistoryList(histData);
        if (histData.length > 0 && !summary) {
          // Construct default summary if none received yet
          const latest = histData[0];
          setSummary({
            solar_generation: latest.solar_forecast,
            wind_generation: latest.wind_forecast,
            hydro_generation: latest.hydro_forecast,
            renewable_generation: latest.solar_forecast + latest.wind_forecast + latest.hydro_forecast,
            renewable_score: latest.renewable_score,
            confidence: latest.confidence,
            carbon_reduction: latest.carbon_reduction,
            risk: latest.risk,
            reasoning: latest.reasoning,
            weather: {
              solar_irradiance: latest.solar_irradiance,
              cloud_cover: latest.cloud_cover,
              wind_speed: latest.wind_speed,
              wind_direction: latest.wind_direction,
              temperature: latest.temperature,
              humidity: latest.humidity,
              rainfall: latest.rainfall,
              atmospheric_pressure: latest.atmospheric_pressure,
              reservoir_level: latest.reservoir_level,
              grid_demand: latest.grid_demand,
              battery_soc: latest.battery_soc,
              electricity_price: latest.electricity_price,
              season: latest.season
            },
            decision: { name: latest.selected_plan || "Plan A (Prioritize Solar)" }
          });
        }
      }

      // 2. Pending approvals
      const pendRes = await fetch(`${API_BASE}/actions/pending`);
      if (pendRes.ok) {
        setPendingActions(await pendRes.json());
      }

      // 3. Decision traces
      const traceRes = await fetch(`${API_BASE}/decision-traces?limit=30`);
      if (traceRes.ok) {
        setDecisionTraces(await traceRes.json());
      }

      // 4. Active alarms
      const activeAlertsRes = await fetch(`${API_BASE}/alerts/active`);
      if (activeAlertsRes.ok) {
        setActiveAlerts(await activeAlertsRes.json());
      }

      // 5. Alarm history
      const alertsHistoryRes = await fetch(`${API_BASE}/alerts/history?limit=50`);
      if (alertsHistoryRes.ok) {
        setAlertHistory(await alertsHistoryRes.json());
      }

      // 6. Tools log
      const toolsRes = await fetch(`${API_BASE}/tool-logs?limit=30`);
      if (toolsRes.ok) {
        setToolLogs(await toolsRes.json());
      }

      // 7. Reflections log
      const reflectRes = await fetch(`${API_BASE}/reflections?limit=20`);
      if (reflectRes.ok) {
        setReflections(await reflectRes.json());
      }
    } catch (e) {
      console.warn("FastAPI offline or booting... retrying fetch loops.");
    }
  };

  // Connect WebSockets
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);

    const ws = new WebSocket(`ws://127.0.0.1:8001/agent/ws`);
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "connection_established") {
          setAgentState(event.data.current_state || "Idle");
          if (event.data.last_run && Object.keys(event.data.last_run).length > 0) {
            setSummary(event.data.last_run);
          }
        } else if (event.type === "state_update") {
          setAgentState(event.data.state);
          setIsRunning(event.data.state !== "Idle");
        } else if (event.type === "step_update") {
          setStreamLog(event.data);
          setIsRunning(event.data.status === "active");
          if (event.data.status === "done" && event.data.summary) {
            setSummary(event.data.summary);
            setIsRunning(false);
            refreshData();
          }
          if (event.data.status === "error") {
            setIsRunning(false);
          }
        }
      } catch (err) {
        console.error("Error parsing WS event data:", err);
      }
    };

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  // Trigger manual forecasts
  const triggerAgentRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStreamLog({ step: "Initializing manual agent cycle...", progress: 5, status: "active" });
    try {
      const res = await fetch(`${API_BASE}/forecast`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        refreshData();
      }
    } catch (e) {
      console.error("Error triggering forecast:", e);
      setIsRunning(false);
    }
  };

  // Human approval routes
  const handleApprove = async (id, comment) => {
    try {
      const res = await fetch(`${API_BASE}/actions/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comment })
      });
      if (res.ok) {
        refreshData();
      }
    } catch (e) {
      console.error("Error approving action:", e);
    }
  };

  const handleReject = async (id, comment) => {
    try {
      const res = await fetch(`${API_BASE}/actions/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comment })
      });
      if (res.ok) {
        refreshData();
      }
    } catch (e) {
      console.error("Error rejecting action:", e);
    }
  };

  // Acknowledge Alerts
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const res = await fetch(`${API_BASE}/alerts/acknowledge/${alertId}`, { method: "POST" });
      if (res.ok) {
        refreshData();
      }
    } catch (e) {
      console.error("Error acknowledging alert:", e);
    }
  };

  // AI Copilot chats
  const handleSendMessage = async (msg) => {
    const updatedHistory = [...chatLog, { sender: "operator", text: msg }];
    setChatLog(updatedHistory);
    setIsWaitingCopilot(true);
    try {
      const res = await fetch(`${API_BASE}/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: updatedHistory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatLog(prev => [...prev, { sender: "copilot", text: data.reply }]);
      }
    } catch (e) {
      console.error("Error asking Copilot:", e);
    } finally {
      setIsWaitingCopilot(false);
    }
  };

  // Render Page Content based on tab
  const renderContent = () => {
    switch (activeTab) {
      case "ops":
        return (
          <OperationsCenter 
            summary={summary} 
            historyList={historyList} 
            pendingActions={pendingActions} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            isRunning={isRunning} 
            onTriggerRun={triggerAgentRun} 
          />
        );
      case "twin":
        return <DigitalTwinView summary={summary} />;
      case "assets":
        return <AssetIntelligence summary={summary} />;
      case "traces":
        return <DecisionTimeline traces={decisionTraces} />;
      case "copilot":
        return <AICopilot chatLog={chatLog} onSendMessage={handleSendMessage} isWaiting={isWaitingCopilot} />;
      case "scenario":
        return <ScenarioSimulator summary={summary} />;
      case "model":
        return <ModelMonitoring />;
      case "alerts":
        return (
          <AlertCenter 
            alerts={activeAlerts} 
            alertHistory={alertHistory} 
            onAcknowledge={handleAcknowledgeAlert} 
          />
        );
      case "memory":
        return <MemoryExplorer historyList={historyList} />;
      case "knowledge":
        return <KnowledgeCenter />;
      case "health":
        return <SystemHealth state={agentState} summary={summary} />;
      default:
        return <OperationsCenter summary={summary} historyList={historyList} pendingActions={pendingActions} onApprove={handleApprove} onReject={handleReject} isRunning={isRunning} onTriggerRun={triggerAgentRun} />;
    }
  };

  return (
    <div style={{ display: "flex", background: "var(--bg-main)", color: "var(--text-primary)", minHeight: "100vh" }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingCount={pendingActions.length} 
        alertCount={activeAlerts.length} 
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderContent()}
      </div>
    </div>
  );
}
