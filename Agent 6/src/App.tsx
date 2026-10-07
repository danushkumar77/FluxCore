import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, TrendingUp, Cpu, Landmark, Network, 
  Bot, History, Leaf, Database, Activity, Radio, AlertTriangle 
} from 'lucide-react';

// Import panels
import CommandCenter from './components/CommandCenter';
import MarketIntel from './components/MarketIntel';
import StrategyCenter from './components/StrategyCenter';
import TradingFloor from './components/TradingFloor';
import DigitalTwin from './components/DigitalTwin';
import AICopilot from './components/AICopilot';
import DecisionTimeline from './components/DecisionTimeline';
import CarbonIntel from './components/CarbonIntel';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import SystemHealthView from './components/SystemHealthView';

export default function App() {
  const [activeTab, setActiveTab] = useState('command');
  const [connected, setConnected] = useState(false);
  // Grid telemetry data the value b
  // Grid telemetry data
  const [telemetry, setTelemetry] = useState<any>({
    timestamp: new Date().toISOString(),
    state: "Idle",
    market: {
      buying_price: 0.28,
      selling_price: 0.08,
      price_forecast_1h: 0.32,
      price_forecast_24h: 0.25,
      demand_forecast: 450.0,
      solar_forecast: 320.0,
      volatility_score: 0.2
    },
    battery: {
      soc: 0.55,
      capacity_kwh: 600.0,
      soh: 98.4,
      temperature_c: 28.5,
      dispatch_kw: -25.0
    },
    chosen_strategy: "Plan A: Renewable First Strategy",
    plans: [],
    ai_reasoning: "Awaiting execution loop updates...",
    savings_today: 142.80,
    green_score: 88.0,
    co2_avoided: 345.5,
    accuracy: 94.2,
    opportunity_score: 55.0
  });

  const [metrics, setMetrics] = useState<any>({
    agent_latency_ms: 125,
    gemini_response_time_ms: 820,
    optimization_execution_time_ms: 18,
    websocket_connections_count: 1,
    total_api_requests: 48,
    active_workers_health: "NOMINAL"
  });

  const [eventLogs, setEventLogs] = useState<any[]>([]);

  // Establish WebSocket connection
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${proto}://${window.location.host}/api/ws/economy`;
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected successfully.");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.telemetry) setTelemetry(payload.telemetry);
          if (payload.metrics) setMetrics(payload.metrics);
          if (payload.event_bus_logs) setEventLogs(payload.event_bus_logs);
        } catch (err) {
          console.error("Error parsing websocket frame:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WebSocket disconnected. Retrying in 3 seconds...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Simulate local data updates if not connected to backend
  useEffect(() => {
    if (connected) return;

    const interval = setInterval(() => {
      setTelemetry((prev: any) => {
        const stateList = ["Idle", "Monitoring", "Market Analysis", "Economic Forecasting", "AI Reasoning", "Strategy Planning", "Optimization", "Execution", "Reflection", "Learning"];
        const currentIndex = stateList.indexOf(prev.state);
        const nextState = stateList[(currentIndex + 1) % stateList.length];
        
        const buying = Math.max(0.1, prev.market.buying_price + (Math.random() - 0.5) * 0.04);
        const selling = Math.max(0.02, buying * 0.3);
        const demand = Math.max(200, prev.market.demand_forecast + (Math.random() - 0.5) * 35);
        const solar = Math.max(0, prev.market.solar_forecast + (Math.random() - 0.5) * 45);
        const socChange = (prev.battery.dispatch_kw / 600.0) * 0.01;
        const nextSoc = Math.max(0.15, Math.min(0.95, prev.battery.soc - socChange));
        
        let action = "Plan A: Renewable First Strategy";
        let dispatch = 0.0;
        if (buying > 0.34) {
          action = "Plan B: Battery Arbitrage Strategy";
          dispatch = 120.0;
        } else if (buying < 0.16) {
          action = "Plan B: Battery Arbitrage Strategy";
          dispatch = -100.0;
        } else if (demand > 700) {
          action = "Plan C: Peak Demand Reduction Strategy";
          dispatch = 80.0;
        }

        return {
          ...prev,
          state: nextState,
          market: {
            buying_price: buying,
            selling_price: selling,
            price_forecast_1h: buying * 1.05,
            price_forecast_24h: buying * 0.98,
            demand_forecast: demand,
            solar_forecast: solar,
            volatility_score: Math.random()
          },
          battery: {
            ...prev.battery,
            soc: nextSoc,
            dispatch_kw: dispatch,
            temperature_c: 25.0 + Math.abs(dispatch) * 0.08
          },
          chosen_strategy: action,
          savings_today: prev.savings_today + Math.max(0.0, dispatch * buying * 0.005),
          green_score: Math.min(100.0, Math.max(40.0, (solar / (demand + 1.0)) * 100.0)),
          co2_avoided: prev.co2_avoided + (solar * 0.000385)
        };
      });

      setEventLogs((prev) => {
        const mockEvents = [
          { event_type: "market.price.updated", source_agent: "agent_6", timestamp: new Date().toISOString() },
          { event_type: "demand.forecast.updated", source_agent: "agent_1", timestamp: new Date().toISOString() },
          { event_type: "renewable.prediction.updated", source_agent: "agent_2", timestamp: new Date().toISOString() }
        ];
        const nextLog = [...prev, mockEvents[Math.floor(Math.random() * mockEvents.length)]];
        return nextLog.slice(-15);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [connected]);

  const menuItems = [
    { id: 'command', label: 'Command Center', icon: LayoutDashboard },
    { id: 'market', label: 'Market Intelligence', icon: TrendingUp },
    { id: 'strategy', label: 'Strategy Planner', icon: Cpu },
    { id: 'trading', label: 'Trading Floor', icon: Landmark },
    { id: 'twin', label: 'Digital Grid Twin', icon: Network },
    { id: 'copilot', label: 'AI Economist Copilot', icon: Bot },
    { id: 'timeline', label: 'Decision Timeline', icon: History },
    { id: 'carbon', label: 'Carbon Intelligence', icon: Leaf },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'health', label: 'System Health', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-gridDark text-white overflow-hidden animated-grid-bg relative">
      {/* Side Navigation Menu */}
      <aside className="w-64 bg-gridLightDark border-r border-borderMuted flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Platform Branding */}
          <div className="p-6 border-b border-borderMuted flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gridAI flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(124,77,255,0.4)]">
              FC
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wider uppercase">FluxCore</h1>
              <span className="text-xs text-gridEnergy font-semibold uppercase tracking-widest">Agent 6 Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-gridAI bg-opacity-20 text-gridAI border-l-4 border-gridAI shadow-[0_0_15px_rgba(124,77,255,0.1)]' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* WebSocket Status Indicator */}
        <div className="p-4 border-t border-borderMuted">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-gridProfit animate-pulse' : 'bg-gridCritical'}`} />
              {connected ? 'CONNECTED (FastAPI)' : 'OFFLINE (LOCAL SIMULATION)'}
            </span>
            <Radio className="w-3.5 h-3.5" />
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        {/* Top Control Bar */}
        <header className="h-16 border-b border-borderMuted bg-gridLightDark flex items-center justify-between px-8 shrink-0 glass-panel">
          {/* Agent State machine representation */}
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Agent State:</span>
            <div className="flex items-center gap-2 bg-slate-900 border border-borderMuted px-3 py-1.5 rounded glow-ai">
              <div className="w-2 h-2 rounded-full bg-gridAI animate-ping" />
              <span className="text-xs custom-font-mono font-bold text-gridAI uppercase tracking-wider">
                {telemetry.state}
              </span>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Savings Today</span>
              <span className="text-sm font-extrabold text-gridProfit custom-font-mono">
                ${telemetry.savings_today.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
              </span>
            </div>
            <div className="w-px h-6 bg-borderMuted" />
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">CO₂ Saved</span>
              <span className="text-sm font-extrabold text-gridEnergy custom-font-mono">
                {telemetry.co2_avoided.toFixed(1)} kg
              </span>
            </div>
            <div className="w-px h-6 bg-borderMuted" />
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Green mix rating</span>
              <span className="text-sm font-extrabold text-gridWarning custom-font-mono">
                {telemetry.green_score.toFixed(1)}%
              </span>
            </div>
          </div>
        </header>

        {/* Tab Pages Router with Framer Motion slide transition */}
        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {activeTab === 'command' && <CommandCenter telemetry={telemetry} />}
              {activeTab === 'market' && <MarketIntel telemetry={telemetry} />}
              {activeTab === 'strategy' && <StrategyCenter telemetry={telemetry} />}
              {activeTab === 'trading' && <TradingFloor telemetry={telemetry} />}
              {activeTab === 'twin' && <DigitalTwin telemetry={telemetry} />}
              {activeTab === 'copilot' && <AICopilot telemetry={telemetry} />}
              {activeTab === 'timeline' && <DecisionTimeline telemetry={telemetry} />}
              {activeTab === 'carbon' && <CarbonIntel telemetry={telemetry} />}
              {activeTab === 'knowledge' && <KnowledgeBaseView />}
              {activeTab === 'health' && (
                <SystemHealthView 
                  telemetry={telemetry} 
                  metrics={metrics} 
                  eventLogs={eventLogs} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
