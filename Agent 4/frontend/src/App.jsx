import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, ShieldCheck, Cpu, Database, Network, Clock, 
  Map, Terminal, Settings, FileText, Compass, AlertCircle
} from 'lucide-react';

import GridTwin from './components/GridTwin';
import FaultTopologyMap from './components/FaultTopologyMap';
import RelayDashboard from './components/RelayDashboard';
import AICopilot from './components/AICopilot';
import OperatorConsole from './components/OperatorConsole';
import IncidentTimeline from './components/IncidentTimeline';
import RiskDashboard from './components/RiskDashboard';
import RestorationPlanner from './components/RestorationPlanner';
import ModelPerformance from './components/ModelPerformance';
import SystemHealth from './components/SystemHealth';

class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("LocalErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '25px', 
          color: '#FF9500', 
          fontSize: '11px', 
          textAlign: 'center', 
          background: '#111A2E', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '10px' 
        }}>
          <div>3D Digital Twin WebGL Context is not supported or failed to initialize on this browser.</div>
          <div style={{ color: '#64748B', fontSize: '9px', fontFamily: 'monospace' }}>{this.state.error?.toString()}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('operations');
  const [gridData, setGridData] = useState(null);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  
  const socketRef = useRef(null);

  // Connect to backend WebSocket
  useEffect(() => {
    const connectWS = () => {
      const socket = new WebSocket('ws://localhost:8000/ws/grid');
      socketRef.current = socket;

      socket.onopen = () => {
        setWebsocketConnected(true);
        console.log("WebSocket connection established to FluxCore grid bus.");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'grid_update') {
            setGridData(payload.data);
          }
        } catch (err) {
          console.error("Error parsing WebSocket packet:", err);
        }
      };

      socket.onclose = () => {
        setWebsocketConnected(false);
        console.warn("WebSocket closed. Attempting reconnect in 2s...");
        setTimeout(connectWS, 2000);
      };
      
      socket.onerror = (err) => {
        console.error("WebSocket socket error:", err);
        socket.close();
      };
    };

    connectWS();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Post methods
  const handleToggleBreaker = (breakerId, isClosed) => {
    if (socketRef.current && websocketConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'toggle_breaker',
        breaker_id: breakerId,
        is_closed: !isClosed // Toggle value
      }));
    }
  };

  const handleInjectFault = (equipmentId, faultType) => {
    fetch('http://localhost:8000/grid/fault-simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipment_id: equipmentId, fault_type: faultType })
    })
    .then(res => res.json())
    .then(data => console.log("Fault simulated successfully:", data))
    .catch(err => console.error("Error injecting fault:", err));
  };

  const handleClearFaults = (equipmentId) => {
    fetch(`http://localhost:8000/grid/fault-clear?equipment_id=${equipmentId}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => console.log("Fault cleared successfully:", data))
    .catch(err => console.error("Error clearing fault:", err));
  };

  const handleExecutePlan = (planId) => {
    fetch('http://localhost:8000/grid/restoration-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId })
    })
    .then(res => res.json())
    .then(data => console.log("Plan restoration triggered:", data))
    .catch(err => console.error("Error executing restoration plan:", err));
  };

  const handleSetMode = (mode) => {
    fetch(`http://localhost:8000/grid/mode?mode=${mode}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => console.log("Operator mode updated:", data))
    .catch(err => console.error("Error changing mode:", err));
  };

  const handleSendChatMessage = (text) => {
    setChatHistory(prev => [...prev, { sender: 'operator', text }]);
    fetch('http://localhost:8000/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    })
    .then(res => res.json())
    .then(data => {
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.response }]);
    })
    .catch(err => {
      console.error("Error sending copilot message:", err);
      setChatHistory(prev => [...prev, { sender: 'ai', text: "Liaison link lost. Check backend status." }]);
    });
  };

  // Mock telemetry data in case backend is loading/offline
  const activeTwinData = gridData?.digital_twin || {
    nodes: [
      { id: "S1", label: "Substation 1", status: "HEALTHY", voltage_level_kv: 230, latitude: 40.7128, longitude: -74.0060 },
      { id: "S2", label: "Substation 2", status: "HEALTHY", voltage_level_kv: 230, latitude: 40.7589, longitude: -73.9851 },
      { id: "S5", label: "Central Substation", status: "HEALTHY", voltage_level_kv: 230, latitude: 40.7829, longitude: -73.9654 }
    ],
    edges: []
  };

  // Renders the correct viewport panel depending on active Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'operations':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', height: '100%' }}>
            <div className="viewport-panel">
              <div className="panel-header">
                <div className="panel-title"><Compass size={14} color="#0096FF" /> Interactive 3D Digital Twin</div>
              </div>
              <LocalErrorBoundary>
                <GridTwin twinData={activeTwinData} />
              </LocalErrorBoundary>
            </div>
            <div className="viewport-panel">
              <div className="panel-header">
                <div className="panel-title"><Settings size={14} color="#FF9500" /> Operator Command Console</div>
              </div>
              <OperatorConsole 
                operatorMode={gridData?.operator_mode || "AUTONOMOUS"} 
                onSetMode={handleSetMode} 
                onInjectFault={handleInjectFault} 
                onClearFaults={handleClearFaults} 
                activeFaults={gridData?.active_faults || {}} 
              />
            </div>
          </div>
        );
      case 'topology':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><Network size={14} color="#0096FF" /> Network Topology Fault Map</div>
            </div>
            <FaultTopologyMap 
              twinData={activeTwinData} 
              onToggleBreaker={handleToggleBreaker} 
            />
          </div>
        );
      case 'relay':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><ShieldAlert size={14} color="#FF3B30" /> Protection Relay & Waveform Diagnostics</div>
            </div>
            <RelayDashboard 
              relayData={gridData?.relays}
              activeIncident={gridData?.active_incident} 
            />
          </div>
        );
      case 'restoration':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><Clock size={14} color="#34C759" /> restoration path Planner</div>
            </div>
            <RestorationPlanner 
              activeIncident={gridData?.active_incident} 
              onExecutePlan={handleExecutePlan} 
              operatorMode={gridData?.operator_mode || "AUTONOMOUS"} 
            />
          </div>
        );
      case 'copilot':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><Terminal size={14} color="#7C4DFF" /> AI Copilot Engineer Advisor</div>
            </div>
            <AICopilot 
              currentState={gridData?.current_state || "Idle"} 
              activeIncident={gridData?.active_incident} 
              onSendMessage={handleSendChatMessage} 
              chatHistory={chatHistory} 
            />
          </div>
        );
      case 'risk':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><Activity size={14} color="#FF9500" /> Grid Risk & Outage Predictions</div>
            </div>
            <RiskDashboard gridMetrics={gridData?.grid_metrics} />
          </div>
        );
      case 'models':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><ShieldCheck size={14} color="#34C759" /> ML Models Training Performance</div>
            </div>
            <ModelPerformance />
          </div>
        );
      case 'health':
        return (
          <div className="viewport-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <div className="panel-title"><Cpu size={14} color="#0096FF" /> Agent System Operations Audit</div>
            </div>
            <SystemHealth 
              currentState={gridData?.current_state || "Idle"} 
              operatorMode={gridData?.operator_mode || "AUTONOMOUS"} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  const systemStatusClass = gridData?.active_faults && Object.keys(gridData.active_faults).length > 0 ? "critical" : "";

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div>
          <div className="brand">
            <Activity className="brand-logo" size={24} />
            <span className="brand-text">FLUXCORE</span>
          </div>
          <ul className="nav-links">
            <li onClick={() => setActiveTab('operations')} className={`nav-item ${activeTab === 'operations' ? 'active' : ''}`}><Compass size={16} /> Operations Center</li>
            <li onClick={() => setActiveTab('topology')} className={`nav-item ${activeTab === 'topology' ? 'active' : ''}`}><Network size={16} /> Topology Map</li>
            <li onClick={() => setActiveTab('relay')} className={`nav-item ${activeTab === 'relay' ? 'active' : ''}`}><ShieldAlert size={16} /> Relay Scope</li>
            <li onClick={() => setActiveTab('restoration')} className={`nav-item ${activeTab === 'restoration' ? 'active' : ''}`}><Clock size={16} /> Action Planner</li>
            <li onClick={() => setActiveTab('copilot')} className={`nav-item ${activeTab === 'copilot' ? 'active' : ''}`}><Terminal size={16} /> AI Copilot</li>
            <li onClick={() => setActiveTab('risk')} className={`nav-item ${activeTab === 'risk' ? 'active' : ''}`}><Activity size={16} /> Outage Predictions</li>
            <li onClick={() => setActiveTab('models')} className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}><ShieldCheck size={16} /> Model Stats</li>
            <li onClick={() => setActiveTab('health')} className={`nav-item ${activeTab === 'health' ? 'active' : ''}`}><Cpu size={16} /> System Health</li>
          </ul>
        </div>
        
        {/* Connection status footer */}
        <div style={{ borderTop: '1px solid #1E2E4A', paddingTop: '15px', fontSize: '10px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div>DATABASE: SQLite/JSON</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: websocketConnected ? '#34C759' : '#FF3B30' }} />
            SCADA BUS: {websocketConnected ? 'LINKED' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Main Command Operations Screen */}
      <div className="command-center">
        <div className="header">
          <div className="header-title">Grid Reliability & Fault Intelligence Center</div>
          <div className={`status-indicator ${systemStatusClass}`}>
            STATUS: {systemStatusClass === "critical" ? "CRITICAL OUTAGE DETECTED" : "GRID STABLE"}
          </div>
        </div>

        <div className="main-display">
          {renderTabContent()}
        </div>
      </div>

    </div>
  );
}
