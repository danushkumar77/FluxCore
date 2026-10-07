import React, { useState, useEffect } from "react";
import { Zap, Server, Database, ShieldAlert, Cpu, Heart, Activity, Play, HelpCircle, FileText, CheckCircle2, TrendingUp, Presentation, Clock, HelpCircle as HelpIcon, ArrowRight } from "lucide-react";
import type { TelemetryMeasurement, Alert } from "./types";
import { getSystemHealth, triggerSimulation, FluxCoreWebSocketClient } from "./services/api";

// Core Components
import { Sidebar } from "./components/Sidebar";
import { DigitalTwinCanvas } from "./digital_twin/DigitalTwinCanvas";
import { AgentGraph } from "./components/AgentGraph";
import { CopilotPanel } from "./components/CopilotPanel";
import { TelemetryCharts } from "./components/TelemetryCharts";

// Page Components (Level 0 & 1)
import { Overview } from "./components/pages/Overview";
import { AIAgents } from "./components/pages/AIAgents";
import { EventBusCenter } from "./components/pages/EventBusCenter";
import { AIDecisionCenter } from "./components/pages/AIDecisionCenter";
import { MLInfra } from "./components/pages/MLInfra";
import { KnowledgeBase } from "./components/pages/KnowledgeBase";
import { MemoryEngine } from "./components/pages/MemoryEngine";
import { WorkflowCenter } from "./components/pages/WorkflowCenter";
import { Workers } from "./components/pages/Workers";
import { SystemHealth } from "./components/pages/SystemHealth";
import { ConfigSettings } from "./components/pages/ConfigSettings";
import { LiveTelemetryPage } from "./components/pages/LiveTelemetryPage";
import { LogsPage } from "./components/pages/LogsPage";
import { GlobalGridMap } from "./components/pages/GlobalGridMap";
import { WeatherIntel } from "./components/pages/WeatherIntel";
import { ForecastCompare } from "./components/pages/ForecastCompare";
import { AssetInventory } from "./components/pages/AssetInventory";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { IncidentManagement } from "./components/pages/IncidentManagement";

// Advanced Page Components (Level 2 & 3)
import { EnergyMarket } from "./components/pages/EnergyMarket";
import { XAICenter } from "./components/pages/XAICenter";
import { HistoryPlayback } from "./components/pages/HistoryPlayback";
import { AlarmManager } from "./components/pages/AlarmManager";
import { EnterpriseReporting } from "./components/pages/EnterpriseReporting";
import { SimulationLibrary } from "./components/pages/SimulationLibrary";
import { ScenarioComparison } from "./components/pages/ScenarioComparison";
import { ExecutiveDashboard } from "./components/pages/ExecutiveDashboard";
import { OperatorWorkspace } from "./components/pages/OperatorWorkspace";
import { CarbonIntel } from "./components/pages/CarbonIntel";
import { LearningCenter } from "./components/pages/LearningCenter";
import { ConversationViewer } from "./components/pages/ConversationViewer";
import { CopilotTimeline } from "./components/pages/CopilotTimeline";
import { MissionTimeline } from "./components/pages/MissionTimeline";

export default function App() {
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [subTabs, setSubTabs] = useState<{ [key: string]: string }>({
    ai_ops: "agents",
    grid_ops: "twin",
    analytics: "telemetry",
    ai_intel: "xai",
    event_bus: "eventbus",
    incidents: "incidents_list",
    assets: "inventory",
    reports: "reports_list",
    sustainability: "carbon",
    platform: "workers"
  });

  const [telemetry, setTelemetry] = useState<TelemetryMeasurement | null>(null);
  const [history, setHistory] = useState<TelemetryMeasurement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<string>("healthy");
  const [dbStatus, setDbStatus] = useState<string>("Synced");
  const [latency, setLatency] = useState<number>(14);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Handle Command Palette triggers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleExecuteCommand = async (action: string) => {
    if (action.startsWith("page:")) {
      const pageId = action.split(":")[1];
      setActivePage(pageId);
    } else if (action.startsWith("sim:")) {
      const simId = action.split(":")[1];
      try {
        await triggerSimulation(simId, "substation_1", "medium");
        setAlerts((prev) => [
          {
            alert_id: Date.now().toString(),
            asset_id: "substation_1",
            source_agent: "Orchestrator",
            severity: "medium" as const,
            description: `Simulation '${simId}' dispatched to event bus successfully.`,
            status: "active" as const,
            timestamp: new Date().toISOString()
          },
          ...prev
        ].slice(0, 10));
      } catch (err) {
        console.error("Simulation dispatch failed:", err);
      }
    }
  };

  useEffect(() => {
    // 1. Fetch initial health check
    const checkHealth = async () => {
      try {
        const res = await getSystemHealth();
        if (res.status === "success") {
          setSystemStatus(res.data.status);
        }
      } catch (err) {
        console.error("Health query failed:", err);
      }
    };
    checkHealth();

    // 2. Connect real-time WebSockets
    const client = new FluxCoreWebSocketClient(
      (newTelemetry) => {
        setTelemetry(newTelemetry);
        setHistory((prev) => {
          const next = [...prev, newTelemetry];
          if (next.length > 20) next.shift();
          return next;
        });
      },
      (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev].slice(0, 10));
        setSystemStatus("degraded");
      },
      (newTransition) => {
        setTransitions((prev) => [...prev, newTransition].slice(-10));
      }
    );

    return () => {
      client.disconnect();
    };
  }, []);

  const handleSubTabChange = (page: string, tab: string) => {
    setSubTabs(prev => ({ ...prev, [page]: tab }));
  };

  // Switch between pages based on sidebar selection
  const renderActivePage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[calc(100vh-130px)] overflow-hidden font-mono text-xs">
            
            {/* Left 3 Columns: Grid Twin + Telemetry */}
            <div className="xl:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
              
              {/* Top row: KPI Widgets */}
              <div className="grid grid-cols-2 lg:grid-cols-8 gap-2.5 shrink-0">
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Grid Health</span>
                  <p className="text-xs font-bold text-brand-emerald mt-1">98.2%</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Renewable %</span>
                  <p className="text-xs font-bold text-brand-cyan mt-1">42.5%</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Battery SOC</span>
                  <p className="text-xs font-bold text-brand-purple mt-1">{telemetry?.battery_soc_pct || 75}%</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Demand Load</span>
                  <p className="text-xs font-bold text-white mt-1">{telemetry?.active_power_mw || 80.4} MW</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Reliability</span>
                  <p className="text-xs font-bold text-brand-cyan mt-1">99.98%</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Carbon Saved</span>
                  <p className="text-xs font-bold text-brand-emerald mt-1">39.2 T</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">AI Decisions</span>
                  <p className="text-xs font-bold text-brand-purple mt-1">Active</p>
                </div>
                <div className="p-3.5 glass-panel rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase text-slate-500 block font-bold">Agents Run</span>
                  <p className="text-xs font-bold text-brand-cyan mt-1">9 Active</p>
                </div>
              </div>

              {/* Center: 3D Digital Twin operations deck (60% height) */}
              <div className="flex-1 min-h-[300px] h-[55%] relative rounded-2xl overflow-hidden">
                <DigitalTwinCanvas telemetry={telemetry} />
              </div>

              {/* Bottom: Draggable/resizable SCADA graphs (45% height) */}
              <div className="p-4 glass-panel rounded-2xl border border-white/5 h-[35%] overflow-y-auto scrollbar-thin shrink-0">
                <h4 className="font-bold text-white uppercase text-[10px] mb-2.5 tracking-wider flex items-center">
                  <Activity className="w-4 h-4 mr-1 text-brand-cyan" /> SCADA Telemetry Streams
                </h4>
                <TelemetryCharts history={history} />
              </div>

            </div>

            {/* Right Column: AI Command Center (1 column wide) */}
            <div className="p-5 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between h-full overflow-y-auto scrollbar-thin space-y-4">
              <div>
                <h4 className="font-bold text-white uppercase text-[10px] pb-2 border-b border-white/5 tracking-wider flex items-center">
                  <Cpu className="w-4 h-4 mr-1.5 text-brand-cyan" /> AI Operations Control
                </h4>
                
                {/* Status info details */}
                <div className="space-y-3 mt-4 text-[10px] leading-relaxed">
                  <div className="p-2.5 bg-slate-900/60 rounded border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">Active Agent Pipeline</span>
                    <span className="text-white font-bold block mt-1">GridReliabilityAgent</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block font-bold">AI Reasoning Logs</span>
                    <p className="text-slate-300 font-sans mt-1">
                      Voltage profile is nominal (114.8 kV). Overcurrent protection limits verified against IEEE-1547 parameters.
                    </p>
                  </div>

                  <div className="p-2.5 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald rounded">
                    <span className="text-[8px] uppercase block font-bold">Mitigation Command</span>
                    <p className="text-slate-200 mt-1 font-sans">BESS battery discharge of 4.0 MW executed successfully.</p>
                  </div>

                  <div className="p-2.5 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded">
                    <span className="text-[8px] uppercase block font-bold">Model Confidence</span>
                    <span className="text-xs font-bold block mt-1">98.2%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 text-[9px] text-slate-500 flex justify-between">
                <span>Inference: 14ms</span>
                <span>Rule check: PASS</span>
              </div>
            </div>

          </div>
        );

      case "ai_ops":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "agents", label: "AI Agents" },
                { id: "collaboration", label: "Agent Collaboration" },
                { id: "decision", label: "AI Decision Center" },
                { id: "workflow", label: "Workflow Center" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("ai_ops", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.ai_ops === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.ai_ops === "agents" && <AIAgents />}
            {subTabs.ai_ops === "collaboration" && <ConversationViewer />}
            {subTabs.ai_ops === "decision" && <AIDecisionCenter />}
            {subTabs.ai_ops === "workflow" && <WorkflowCenter />}
          </div>
        );

      case "grid_ops":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "twin", label: "Digital Twin" },
                { id: "topology", label: "Grid Topology" },
                { id: "map", label: "Global Grid Map" },
                { id: "weather", label: "Weather Intelligence" },
                { id: "scenario", label: "Scenario Comparison" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("grid_ops", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.grid_ops === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.grid_ops === "twin" && (
              <div className="h-[480px]">
                <DigitalTwinCanvas telemetry={telemetry} />
              </div>
            )}
            {subTabs.grid_ops === "topology" && (
              <div className="h-[480px]">
                <AgentGraph activeTransitions={transitions} />
              </div>
            )}
            {subTabs.grid_ops === "map" && <GlobalGridMap />}
            {subTabs.grid_ops === "weather" && <WeatherIntel />}
            {subTabs.grid_ops === "scenario" && <ScenarioComparison />}
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "telemetry", label: "Live Telemetry" },
                { id: "trends", label: "Historical Trends" },
                { id: "forecast", label: "Forecast Comparison" },
                { id: "ml", label: "ML Models" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("analytics", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.analytics === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.analytics === "telemetry" && <LiveTelemetryPage telemetry={telemetry} />}
            {subTabs.analytics === "trends" && <HistoryPlayback />}
            {subTabs.analytics === "forecast" && <ForecastCompare />}
            {subTabs.analytics === "ml" && <MLInfra />}
          </div>
        );

      case "ai_intel":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "xai", label: "Explainable AI" },
                { id: "learning", label: "AI Learning Center" },
                { id: "rules", label: "Rule Engine & Knowledge Graph" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("ai_intel", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.ai_intel === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.ai_intel === "xai" && <XAICenter />}
            {subTabs.ai_intel === "learning" && <LearningCenter />}
            {subTabs.ai_intel === "rules" && <KnowledgeBase />}
          </div>
        );

      case "event_bus":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "eventbus", label: "Event Bus" },
                { id: "flow", label: "Live Event Flow" },
                { id: "playback", label: "Historical Playback" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("event_bus", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.event_bus === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.event_bus === "eventbus" && <EventBusCenter />}
            {subTabs.event_bus === "flow" && <CopilotTimeline />}
            {subTabs.event_bus === "playback" && <HistoryPlayback />}
          </div>
        );

      case "incidents":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "incidents_list", label: "Incident Management" },
                { id: "alarms", label: "Alarm Manager" },
                { id: "logs", label: "System Logs" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("incidents", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.incidents === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.incidents === "incidents_list" && <IncidentManagement />}
            {subTabs.incidents === "alarms" && <AlarmManager />}
            {subTabs.incidents === "logs" && <LogsPage />}
          </div>
        );

      case "assets":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "inventory", label: "Asset Inventory" },
                { id: "kb", label: "Knowledge Base" },
                { id: "memory", label: "Memory Engine" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("assets", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.assets === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.assets === "inventory" && <AssetInventory />}
            {subTabs.assets === "kb" && <KnowledgeBase />}
            {subTabs.assets === "memory" && <MemoryEngine />}
          </div>
        );

      case "reports":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "reports_list", label: "Enterprise Reports" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("reports", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.reports === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.reports === "reports_list" && <EnterpriseReporting />}
          </div>
        );

      case "sustainability":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "carbon", label: "Carbon Dashboard" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("sustainability", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.sustainability === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.sustainability === "carbon" && <CarbonIntel />}
          </div>
        );

      case "platform":
        return (
          <div className="space-y-4">
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 self-start space-x-1 font-mono text-[10px]">
              {[
                { id: "workers", label: "Background Workers" },
                { id: "health", label: "System Health" },
                { id: "settings", label: "Platform Settings" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange("platform", tab.id)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    subTabs.platform === tab.id ? "bg-brand-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {subTabs.platform === "workers" && <Workers />}
            {subTabs.platform === "health" && <SystemHealth />}
            {subTabs.platform === "settings" && <ConfigSettings />}
          </div>
        );

      default:
        return <div className="text-center text-slate-500 font-mono py-8">Section under development</div>;
    }
  };

  return (
    <div className="h-screen bg-[#05070B] flex flex-col text-slate-200 overflow-hidden font-sans relative">
      {/* Animated Aurora background mesh */}
      <div className="aurora-bg" />

      {/* 1. Top Enterprise Header */}
      <header className="w-full py-2.5 px-5 bg-slate-950/80 border-b border-white/5 flex justify-between items-center shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-brand-cyan/15 rounded-lg border border-brand-cyan/30 text-brand-cyan shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center font-mono">
              FLUXCORE <span className="text-[9px] bg-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-widest">Grid Control</span>
            </h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono">Autonomous Multi-Agent Smart Grid Intelligence Platform</p>
          </div>
        </div>

        {/* Global state indicator badge */}
        <div className="flex items-center space-x-3">
          <span className="text-[10px] text-slate-400 font-mono">SYS STATUS:</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono border ${
            systemStatus === "healthy" 
              ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-pulse" 
              : "bg-brand-amber/10 text-brand-amber border-brand-amber/20 animate-pulse"
          }`}>
            {systemStatus}
          </span>
        </div>
      </header>

      {/* 2. Central Sidebar + Workspace Layout */}
      <div className="flex-1 flex overflow-hidden z-10">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        
        {/* Main page content area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950/20 scrollbar-thin">
          {renderActivePage()}
        </main>

        {/* AI GRID OPERATOR COPILOT DRAWER */}
        <CopilotPanel telemetry={telemetry} />
      </div>

      {/* 3. Sticky Diagnostic Footer Status Bar */}
      <footer className="w-full py-1.5 px-4 bg-slate-950/90 border-t border-white/5 flex flex-wrap justify-between items-center text-[9px] font-mono text-slate-500 shrink-0 select-none z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <Server className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-slate-400">Gateway:</span>
            <span className="text-brand-emerald font-bold uppercase">Online</span>
          </div>
          
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-slate-400">Database:</span>
            <span className="text-brand-emerald font-bold uppercase">{dbStatus}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-slate-400">Gemini:</span>
            <span className="text-brand-emerald font-bold uppercase">Connected</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span>WebSocket Latency: <span className="text-brand-cyan font-bold">{latency}ms</span></span>
          <span>System Version: <span className="text-slate-400">v1.2.0</span></span>
        </div>
      </footer>

      {/* 4. Global command center search overlay (Ctrl + K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onExecuteCommand={handleExecuteCommand} 
      />

    </div>
  );
}
