import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Shield, ShieldAlert, Cpu, Database, ClipboardList, 
  HelpCircle, BarChart3, Clock, TrendingDown, Thermometer, 
  Settings, Network, MessageSquare, Terminal, Eye, CheckCircle2,
  FileSpreadsheet, AlertTriangle, AlertCircle
} from 'lucide-react';
import DigitalTwinViewer from './components/DigitalTwinViewer';

const API_BASE = 'http://127.0.0.1:8001';
const WS_URL = 'ws://127.0.0.1:8001/ws/assets';

export default function App() {
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('T-101');
  const [activeTab, setActiveTab] = useState('command-center');
  const [wsStatus, setWsStatus] = useState('Disconnected');
  
  // Agent State Machine State
  const [agentState, setAgentState] = useState('Idle');
  const [agentLogs, setAgentLogs] = useState([]);
  const [modelMetrics, setModelMetrics] = useState({});
  const [fleetRankings, setFleetRankings] = useState([]);
  
  // Copilot Chat
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: 'Agent 5 Reliability Copilot online. Query grid asset anomalies, FMEA status, or safety protocols.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Maintenance / Work Orders
  const [maintenancePackages, setMaintenancePackages] = useState([]);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  
  // Local Telemetry Feed
  const [recentTelemetryEvents, setRecentTelemetryEvents] = useState([]);

  const logEndRef = useRef(null);

  // Fetch initial REST data
  const fetchData = async () => {
    try {
      // 1. Assets
      const resAssets = await fetch(`${API_BASE}/assets`);
      if (resAssets.ok) {
        const data = await resAssets.json();
        setAssets(data);
      }
      
      // 2. Rankings
      const resRankings = await fetch(`${API_BASE}/asset/criticality`);
      if (resRankings.ok) {
        const data = await resRankings.json();
        setFleetRankings(data);
      }

      // 3. Maintenance Packages
      const resMaint = await fetch(`${API_BASE}/maintenance/plans`);
      if (resMaint.ok) {
        const data = await resMaint.json();
        setMaintenancePackages(data);
      }

      // 4. Model Info
      const resModels = await fetch(`${API_BASE}/model-info`);
      if (resModels.ok) {
        const data = await resModels.json();
        setModelMetrics(data);
      }
    } catch (e) {
      console.error("Error fetching REST initial data:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll every 8s to sync changes
    return () => clearInterval(interval);
  }, []);

  // WebSockets setup
  useEffect(() => {
    let ws = null;
    const connect = () => {
      ws = new WebSocket(WS_URL);
      setWsStatus('Connecting');
      
      ws.onopen = () => {
        setWsStatus('Connected');
        console.log("WebSocket connected to Agent 5");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'agent_state_update') {
            setAgentState(data.state);
            if (data.log) {
              setAgentLogs(prev => [...prev, data.log].slice(-40));
            }
          } 
          else if (data.type === 'asset_health_update') {
            // Update individual asset metrics in state
            setAssets(prev => prev.map(a => {
              if (a.id === data.asset_id) {
                return {
                  ...a,
                  health_index: data.health_index,
                  status: data.status,
                  risk_score: data.risk_index
                };
              }
              return a;
            }));

            // Record local telemetry logging
            setRecentTelemetryEvents(prev => [
              {
                timestamp: new Date().toLocaleTimeString(),
                asset_id: data.asset_id,
                health: data.health_index,
                status: data.status,
                prob: data.failure_probability
              },
              ...prev
            ].slice(0, 15));
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WS connection error:", e);
        setWsStatus('Disconnected');
      };

      ws.onclose = () => {
        setWsStatus('Disconnected');
        console.log("WS connection closed. Reconnecting...");
        setTimeout(connect, 4000); // Reconnect in 4s
      };
    };

    connect();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentLogs]);

  // Selected asset object helper
  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  // AI Copilot Query Submission
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    const query = chatInput;
    setChatInput('');

    try {
      const res = await fetch(`${API_BASE}/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, asset_id: selectedAssetId })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection timed out.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Run diagnostics trigger
  const runDiagnostics = async (assetId) => {
    try {
      const res = await fetch(`${API_BASE}/asset/run-diagnostics/${assetId}`, { method: 'POST' });
      if (res.ok) {
        fetchData();
        alert(`Diagnostics cycle completed successfully for ${assetId}. Check the terminal logs.`);
      }
    } catch (e) {
      alert(`Diagnostics failed: ${e.message}`);
    }
  };

  // Optimization options fetcher
  const loadOptimizationOptions = async (assetId) => {
    try {
      const res = await fetch(`${API_BASE}/maintenance/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPlanDetails(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Schedule Plan trigger
  const schedulePlan = async (assetId, planName) => {
    try {
      const res = await fetch(`${API_BASE}/maintenance/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, plan_name: planName })
      });
      if (res.ok) {
        fetchData();
        alert(`Successfully scheduled ${planName} for ${assetId}. Outage package generated.`);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Approve Work Order
  const approveWorkOrder = async (pkgId) => {
    try {
      const res = await fetch(`${API_BASE}/maintenance/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkgId, approved_by: 'Control Station Operator' })
      });
      if (res.ok) {
        fetchData();
        alert(`Work order ${pkgId} approved. Clearance verified.`);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Execute Work Order
  const executeWorkOrder = async (pkgId) => {
    try {
      const res = await fetch(`${API_BASE}/maintenance/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkgId })
      });
      if (res.ok) {
        fetchData();
        alert(`Work order ${pkgId} executed. Asset health restored.`);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Calculations for Command Center KPIs
  const totalAssets = assets.length;
  const criticalCount = assets.filter(a => a.status === 'Critical').length;
  const warningCount = assets.filter(a => a.status === 'Warning').length;
  const averageHealth = assets.reduce((sum, a) => sum + a.health_index, 0) / (totalAssets || 1);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <div style={{ width: '280px', background: 'rgba(5, 10, 18, 0.95)', borderRight: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Title Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(0, 150, 255, 0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} style={{ color: 'var(--color-blue)', filter: 'drop-shadow(0 0 8px var(--color-blue))' }} />
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.5px' }}>FLUXCORE</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-ai)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Reliability Agent 5</p>
          </div>
        </div>

        {/* State Machine Status Panel */}
        <div style={{ padding: '16px 20px', background: 'rgba(0,150,255,0.03)', borderBottom: '1px solid rgba(0, 150, 255, 0.1)' }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Agent State Machine</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span className="status-dot warning" style={{
              width: 10, height: 10,
              animation: 'pulse 1.5s infinite',
              backgroundColor: agentState !== 'Idle' ? 'var(--color-ai)' : 'var(--color-healthy)',
              boxShadow: agentState !== 'Idle' ? '0 0 10px var(--color-ai)' : '0 0 8px var(--color-healthy)'
            }}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{agentState}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ flex: 1, padding: '15px 10px', overflowY: 'auto' }}>
          {[
            { id: 'command-center', label: 'Command Center', icon: Cpu },
            { id: 'digital-twin', label: '3D Digital Twin', icon: Eye },
            { id: 'fleet-mgmt', label: 'Fleet Management', icon: Network },
            { id: 'failure-predict', label: 'Failure Prediction', icon: ShieldAlert },
            { id: 'rul-dashboard', label: 'Remaining Useful Life', icon: Clock },
            { id: 'planner', label: 'Maintenance Planner', icon: FileSpreadsheet },
            { id: 'copilot', label: 'AI Reliability Copilot', icon: MessageSquare },
            { id: 'anomaly-detection', label: 'Anomaly Center', icon: AlertTriangle },
            { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
            { id: 'asset-history', label: 'Asset History Explorer', icon: Database },
            { id: 'knowledge-center', label: 'Knowledge Base', icon: HelpCircle },
            { id: 'system-health', label: 'System Diagnostics', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <div 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'planner') loadOptimizationOptions(selectedAssetId);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  background: active ? 'rgba(0, 150, 255, 0.12)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-blue)' : '3px solid transparent',
                  marginBottom: '4px',
                  fontSize: '0.88rem',
                  fontWeight: active ? 600 : 400,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Icon size={18} style={{ color: active ? 'var(--color-blue)' : 'inherit' }} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0, 150, 255, 0.15)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div>WebSocket: <span style={{ color: wsStatus === 'Connected' ? 'var(--color-healthy)' : 'var(--color-critical)' }}>{wsStatus}</span></div>
          <div style={{ marginTop: '4px' }}>Server Address: localhost:8001</div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflow: 'hidden' }}>
        
        {/* Top Control Bar */}
        <div style={{ height: '70px', background: 'rgba(10, 18, 30, 0.8)', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Asset:</span>
            <select 
              value={selectedAssetId} 
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                if (activeTab === 'planner') loadOptimizationOptions(e.target.value);
              }}
              style={{
                background: '#0c1622',
                color: '#fff',
                border: '1px solid var(--panel-border)',
                padding: '6px 12px',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'Outfit',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.id} – {a.name} ({a.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => runDiagnostics(selectedAssetId)}>Force Diagnostics</button>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
              <div>SYS DATE: 2026-07-28</div>
              <div>LOC TIME: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

        </div>

        {/* Tab View Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* TAB 1: Asset Health Command Center */}
          {activeTab === 'command-center' && (
            <div>
              {/* KPI Header Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fleet Health Index</span>
                    <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: averageHealth > 80 ? 'var(--color-healthy)' : 'var(--color-warning)' }}>{averageHealth.toFixed(1)}%</h2>
                  </div>
                  <Shield size={28} style={{ color: 'var(--color-blue)' }} />
                </div>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Warnings</span>
                    <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--color-warning)' }}>{warningCount}</h2>
                  </div>
                  <AlertTriangle size={28} style={{ color: 'var(--color-warning)' }} />
                </div>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Critical Faults</span>
                    <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--color-critical)' }}>{criticalCount}</h2>
                  </div>
                  <AlertCircle size={28} style={{ color: 'var(--color-critical)' }} />
                </div>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monitoring Assets</span>
                    <h2 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{totalAssets}</h2>
                  </div>
                  <Activity size={28} style={{ color: 'var(--color-healthy)' }} />
                </div>
              </div>

              {/* Main Content Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* Visual Grid Map Grid */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3>Smart Grid Physical Substation Mapping</h3>
                  
                  {/* Grid topology diagram drawn using CSS/SVG */}
                  <div style={{ height: '320px', background: '#04080f', border: '1px solid rgba(0, 150, 255, 0.1)', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {/* SVG Connections */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <line x1="20%" y1="50%" x2="50%" y2="25%" stroke="rgba(0,150,255,0.4)" strokeWidth="2" strokeDasharray="5" />
                      <line x1="50%" y1="25%" x2="80%" y2="50%" stroke="rgba(0,150,255,0.4)" strokeWidth="2" />
                      <line x1="20%" y1="50%" x2="50%" y2="75%" stroke="rgba(0,150,255,0.4)" strokeWidth="2" />
                      <line x1="50%" y1="75%" x2="80%" y2="50%" stroke="rgba(0,150,255,0.4)" strokeWidth="2" strokeDasharray="5" />
                      <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="rgba(0,150,255,0.4)" strokeWidth="2" />
                    </svg>

                    {/* Nodes */}
                    <div style={{ position: 'absolute', left: '15%', top: '45%', cursor: 'pointer', textAlign: 'center' }} onClick={() => setSelectedAssetId('T-101')}>
                      <div style={{ width: '40px', height: '40px', background: '#0a1622', border: '2px solid var(--color-healthy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(52,199,89,0.3)' }}>T-101</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Substation Alpha</span>
                    </div>

                    <div style={{ position: 'absolute', left: '46%', top: '20%', cursor: 'pointer', textAlign: 'center' }} onClick={() => setSelectedAssetId('L-301')}>
                      <div style={{ width: '40px', height: '40px', background: '#0a1622', border: '2px solid var(--color-warning)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(255,149,0,0.3)' }}>L-301</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Alpha-Beta Line</span>
                    </div>

                    <div style={{ position: 'absolute', left: '46%', top: '70%', cursor: 'pointer', textAlign: 'center' }} onClick={() => setSelectedAssetId('B-601')}>
                      <div style={{ width: '40px', height: '40px', background: '#0a1622', border: '2px solid var(--color-healthy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>B-601</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Alpha Storage</span>
                    </div>

                    <div style={{ position: 'absolute', left: '75%', top: '45%', cursor: 'pointer', textAlign: 'center' }} onClick={() => setSelectedAssetId('T-102')}>
                      <div style={{ width: '40px', height: '40px', background: '#0a1622', border: '2px solid var(--color-healthy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>T-102</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Substation Beta</span>
                    </div>
                  </div>

                  {/* scrolling logs */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><Terminal size={16} /> Live Real-time Telemetry Updates</h4>
                    <div className="terminal-output">
                      {recentTelemetryEvents.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)' }}>Awaiting telemetry streams from gateway...</div>
                      ) : (
                        recentTelemetryEvents.map((evt, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>[{evt.timestamp}]</span> Asset <span style={{ color: '#fff', fontWeight: 600 }}>{evt.asset_id}</span> updated: Health=<span style={{ color: evt.health > 75 ? 'var(--color-healthy)' : 'var(--color-warning)' }}>{evt.health.toFixed(1)}%</span> | Status=<span style={{ color: evt.status === 'Healthy' ? 'var(--color-healthy)' : 'var(--color-warning)' }}>{evt.status}</span> | Failure Prob=<span style={{ color: '#ec4899' }}>{(evt.prob*100).toFixed(1)}%</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Fleet Health List */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3>Fleet Risk Hierarchy</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {fleetRankings.map((item, idx) => {
                      const color = item.health_index > 75 ? 'var(--color-healthy)' : item.health_index > 40 ? 'var(--color-warning)' : 'var(--color-critical)';
                      return (
                        <div 
                          key={item.asset_id} 
                          onClick={() => setSelectedAssetId(item.asset_id)}
                          style={{
                            background: selectedAssetId === item.asset_id ? 'rgba(0,150,255,0.1)' : 'rgba(255,255,255,0.02)',
                            border: selectedAssetId === item.asset_id ? '1px solid var(--color-blue)' : '1px solid rgba(255,255,255,0.05)',
                            padding: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{item.asset_id}</span>
                            <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: color }}>{item.health_index.toFixed(0)}%</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '4px' }}>
                            <span>Criticality: {item.criticality_score.toFixed(0)}</span>
                            <span style={{ color: item.priority === 'Critical' ? 'var(--color-critical)' : 'var(--text-secondary)' }}>Priority: {item.priority}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Digital Twin Center */}
          {activeTab === 'digital-twin' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div>
                  <DigitalTwinViewer asset={selectedAsset} />
                </div>
                
                {/* Telemetry Panel */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3>Real-time Diagnostics</h3>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asset Type</span>
                    <h4 style={{ fontSize: '1.1rem', marginTop: '2px' }}>{selectedAsset?.type}</h4>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Sensors:</span>
                    {selectedAsset?.telemetry && Object.entries(selectedAsset.telemetry).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,150,255,0.02)', border: '1px solid rgba(0,150,255,0.06)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}>{typeof val === 'number' ? val.toFixed(2) : val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Fleet Asset Management */}
          {activeTab === 'fleet-mgmt' && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '15px' }}>Grid Asset Fleet Registry</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,150,255,0.2)', paddingBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px' }}>Asset ID</th>
                    <th>Name</th>
                    <th>Substation</th>
                    <th>Type</th>
                    <th>Health Index</th>
                    <th>Status</th>
                    <th>Outage Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const statusColor = asset.status === 'Healthy' ? 'var(--color-healthy)' : asset.status === 'Warning' ? 'var(--color-warning)' : 'var(--color-critical)';
                    return (
                      <tr 
                        key={asset.id} 
                        onClick={() => setSelectedAssetId(asset.id)}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)', 
                          cursor: 'pointer',
                          background: selectedAssetId === asset.id ? 'rgba(0,150,255,0.05)' : 'transparent',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <td style={{ padding: '16px 12px', fontWeight: 600 }}>{asset.id}</td>
                        <td>{asset.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{asset.station}</td>
                        <td>{asset.type}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${asset.health_index}%`, height: '100%', background: statusColor }}></div>
                            </div>
                            <span style={{ fontSize: '0.8rem' }}>{asset.health_index.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ color: statusColor, fontWeight: 500 }}>{asset.status}</td>
                        <td style={{ color: asset.risk_score > 50 ? 'var(--color-critical)' : 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{asset.risk_score.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Failure Prediction Center */}
          {activeTab === 'failure-predict' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Predictive Diagnostics: {selectedAssetId}</h3>
                
                {/* SVG Failure Gauge */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                  <svg width="200" height="200" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke={selectedAsset?.risk_score > 60 ? 'var(--color-critical)' : 'var(--color-warning)'} 
                      strokeWidth="8" 
                      strokeDasharray="251" 
                      strokeDashoffset={251 - (251 * (selectedAsset?.risk_score || 0)) / 100}
                      transform="rotate(-90 50 50)" 
                    />
                    <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{(selectedAsset?.risk_score || 0).toFixed(0)}%</text>
                    <text x="50" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="6" letterSpacing="0.5">FAILURE PROB</text>
                  </svg>
                </div>

                <div style={{ padding: '15px', background: 'rgba(0,150,255,0.03)', borderRadius: '6px', border: '1px solid rgba(0,150,255,0.1)' }}>
                  <h4>FMEA Threat Analysis:</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                    Asset displays degradation parameters. Insulation breakdown calculations indicate low oil breakdown strength. Scheduled thermal mitigation advised.
                  </p>
                </div>
              </div>

              {/* Contributing Features importance chart */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>ML Feature Importance Coefficients</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  {[
                    { feature: 'Oil Temperature Index', weight: 88 },
                    { feature: 'Acetylene (C2H2) Gas Level', weight: 79 },
                    { feature: 'Dielectric Breakdown Strength', weight: 65 },
                    { feature: 'Core Mechanical Vibration', weight: 42 },
                    { feature: 'Ambient Climate Factor', weight: 24 }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>{item.feature}</span>
                        <span style={{ color: 'var(--color-blue)', fontFamily: 'JetBrains Mono' }}>{item.weight}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.weight}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-blue), var(--color-ai))' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Remaining Useful Life Dashboard */}
          {activeTab === 'rul-dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3>End-of-Life Forecast</h3>
                
                <div style={{ textAlign: 'center', padding: '30px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remaining Useful Life (Est.)</span>
                  <h1 style={{ fontSize: '3rem', margin: '10px 0', color: 'var(--color-blue)' }}>~42</h1>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>OPERATIONAL DAYS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Install Date:</span>
                    <span>{selectedAsset?.installation_date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cycles Logged:</span>
                    <span>{selectedAsset?.telemetry?.switching_operations || selectedAsset?.telemetry?.charge_cycles || 120}</span>
                  </div>
                </div>
              </div>

              {/* Degradation Chart */}
              <div className="glass-panel">
                <h3>Linear Asset Degradation Curve</h3>
                
                {/* SVG Graph rendering a decreasing degradation slope */}
                <div style={{ width: '100%', height: '250px', position: 'relative', marginTop: '20px' }}>
                  <svg style={{ width: '100%', height: '100%' }}>
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="100%" y2="50" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="150" x2="100%" y2="150" stroke="rgba(255,255,255,0.05)" />
                    
                    {/* Slope */}
                    <path 
                      d="M 50 40 Q 200 60 400 180 T 600 220" 
                      fill="none" 
                      stroke="var(--color-critical)" 
                      strokeWidth="3" 
                      strokeDasharray="4"
                    />
                    
                    <circle cx="400" cy="180" r="6" fill="var(--color-critical)" />
                  </svg>
                  <div style={{ position: 'absolute', left: '420px', top: '165px', fontSize: '0.75rem', background: '#081018', border: '1px solid var(--color-critical)', padding: '2px 6px', borderRadius: '3px' }}>
                    Current State
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: Maintenance Planner */}
          {activeTab === 'planner' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel">
                <h3>AI Maintenance Option Matrix: {selectedAssetId}</h3>
                
                {selectedPlanDetails?.plans_comparison ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginTop: '15px' }}>
                    {selectedPlanDetails.plans_comparison.map((p) => {
                      const isOptimal = selectedPlanDetails.optimal_selection.name === p.name;
                      return (
                        <div 
                          key={p.name} 
                          style={{
                            background: isOptimal ? 'rgba(0,150,255,0.08)' : 'rgba(255,255,255,0.02)',
                            border: isOptimal ? '2px solid var(--color-blue)' : '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            position: 'relative'
                          }}
                        >
                          {isOptimal && (
                            <span style={{ position: 'absolute', top: '-10px', right: '10px', background: 'var(--color-blue)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Optimal</span>
                          )}
                          <h4 style={{ color: isOptimal ? 'var(--color-blue)' : '#fff' }}>{p.name} – {p.title}</h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.action}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', marginTop: 'auto' }}>
                            <div>Cost: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>${p.cost.toFixed(0)}</span></div>
                            <div>Downtime: <span style={{ fontFamily: 'JetBrains Mono' }}>{p.downtime_hours} hrs</span></div>
                            <div>Safety Rating: <span style={{ color: 'var(--color-healthy)' }}>{p.safety_rating}%</span></div>
                          </div>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '6px 0', fontSize: '0.75rem', width: '100%', marginTop: '5px' }}
                            onClick={() => schedulePlan(selectedAssetId, p.name)}
                          >
                            Schedule Plan
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '20px 0', color: 'var(--text-secondary)' }}>Generating optimization scenarios from database...</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: AI Reliability Copilot */}
          {activeTab === 'copilot' && (
            <div className="glass-panel" style={{ height: '550px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <h3>AI Reliability Engineering Copilot</h3>
                <span style={{ fontSize: '0.75rem', background: 'rgba(124, 77, 255, 0.1)', border: '1px solid var(--color-ai)', color: 'var(--color-ai)', padding: '3px 8px', borderRadius: '4px' }}>Gemini 1.5 Flash Active</span>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(4, 8, 15, 0.5)', padding: '15px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'rgba(0,150,255,0.1)' : 'rgba(255,255,255,0.03)',
                      border: msg.role === 'user' ? '1px solid var(--color-blue)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      maxWidth: '80%',
                      fontSize: '0.88rem',
                      lineHeight: '1.4'
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: msg.role === 'user' ? 'var(--color-blue)' : 'var(--color-ai)', marginBottom: '4px', fontWeight: 'bold' }}>
                      {msg.role === 'user' ? 'Operator' : 'Senior Reliability AI'}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Thinking...</div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Enter diagnostic queries (e.g. explain failure modes on T-101)..."
                  style={{
                    flex: 1,
                    background: '#0c1622',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '6px',
                    padding: '0 15px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                <button type="submit" className="btn-ai" style={{ flexShrink: 0 }}>Query AI</button>
              </form>
            </div>
          )}

          {/* TAB 8: Anomaly Detection Center */}
          {activeTab === 'anomaly-detection' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Isolation Forest Outliers Space</h3>
                
                {/* Outliers chart */}
                <div style={{ height: '300px', background: '#04080f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Grid scatter points */}
                  <div style={{ position: 'absolute', left: '20%', top: '30%', width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></div>
                  <div style={{ position: 'absolute', left: '40%', top: '60%', width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></div>
                  <div style={{ position: 'absolute', left: '70%', top: '40%', width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></div>
                  <div style={{ position: 'absolute', left: '30%', top: '80%', width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></div>
                  <div style={{ position: 'absolute', left: '80%', top: '20%', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-critical)', boxShadow: '0 0 10px var(--color-critical)' }}></div>
                  
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Component Feature Projection (PCA 1 / PCA 2)</div>
                </div>
              </div>

              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Outlier Alerts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ borderLeft: '3px solid var(--color-critical)', padding: '10px 12px', background: 'rgba(255,59,48,0.03)' }}>
                    <div style={{ fontWeight: 600 }}>T-101: Vibration outlier detected</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Isolation Forest reports score 0.62. Readings differ from seasonal training margins.</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 9: Work Order Manager */}
          {activeTab === 'work-orders' && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '15px' }}>Maintenance Work Orders</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {maintenancePackages.map((pkg) => {
                  return (
                    <div 
                      key={pkg.package_id} 
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{pkg.package_id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>Asset: {pkg.asset_id}</span>
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: pkg.status === 'Completed' ? 'rgba(52,199,89,0.1)' : 'rgba(255,149,0,0.1)',
                          color: pkg.status === 'Completed' ? 'var(--color-healthy)' : 'var(--color-warning)'
                        }}>{pkg.status}</span>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        <strong>Reasoning:</strong> {pkg.reasoning}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', fontSize: '0.8rem' }}>
                        <div><strong>Plan Option:</strong> {pkg.selected_plan}</div>
                        <div><strong>Estimated Cost:</strong> ${pkg.estimated_cost}</div>
                        <div><strong>Downtime:</strong> {pkg.estimated_downtime_hours} hours</div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        {pkg.status === 'Pending' && (
                          <button className="btn-primary" onClick={() => approveWorkOrder(pkg.package_id)}>Approve Outage Schedule</button>
                        )}
                        {pkg.status === 'Approved' && (
                          <button className="btn-primary" onClick={() => executeWorkOrder(pkg.package_id)}>Mark Work Completed</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 10: Asset History Explorer */}
          {activeTab === 'asset-history' && (
            <div className="glass-panel">
              <h3>Incident Log Directory</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                {[
                  { id: 'INC-001', date: '2025-10-15', asset: 'T-101', desc: 'High temperature alarm winding 112°C.', action: 'Oil filtration, core insulation refurbished.' },
                  { id: 'INC-002', date: '2025-12-04', asset: 'WT-401', desc: 'Nacelle structural resonance spike.', action: 'Rotor bearing replaced.' }
                ].map((item) => (
                  <div key={item.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '16px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>{item.id} | {item.date}</span>
                      <span>Asset: {item.asset}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.desc}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-blue)', marginTop: '4px' }}>Resolution: {item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: Knowledge Center */}
          {activeTab === 'knowledge-center' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
              
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>IEEE standards guidelines</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <strong>IEEE C57.104</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Dissolved gas analysis oil parameters thresholds.</p>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <strong>IEEE C57.91</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Thermal limits for transformer cellulose core insulation paper.</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Engineering operating limits</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span>Transformer Top Oil Temp Limit</span>
                    <span style={{ color: 'var(--color-critical)' }}>&gt; 90°C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span>Acetylene (C2H2) Gas Limit</span>
                    <span style={{ color: 'var(--color-critical)' }}>&gt; 15 ppm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span>Circuit Breaker Contact Wear Limit</span>
                    <span style={{ color: 'var(--color-warning)' }}>&gt; 45%</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 12: System Health */}
          {activeTab === 'system-health' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
              
              {/* Agent Flow chart */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Agent State Machine Execution Flow</h3>
                
                {/* Draw state boxes representing state transitions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {[
                    'Idle', 'Monitoring', 'Asset Analysis', 'Health Assessment', 
                    'Failure Prediction', 'Reasoning', 'Planning', 
                    'Maintenance Scheduling', 'Execution', 'Reflection', 'Learn'
                  ].map((s) => {
                    const isActive = agentState === s;
                    return (
                      <div 
                        key={s}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: isActive ? '2px solid var(--color-blue)' : '1px solid rgba(255,255,255,0.05)',
                          background: isActive ? 'rgba(0,150,255,0.1)' : 'rgba(255,255,255,0.02)',
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 600 : 400,
                          textAlign: 'center',
                          boxShadow: isActive ? '0 0 10px rgba(0,150,255,0.2)' : 'none',
                          flex: '1 0 140px'
                        }}
                      >
                        {s}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ML model metrics */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Scikit-Learn Classifier Validation metrics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  {modelMetrics["model_1_failure_prediction"] ? (
                    <>
                      <div><strong>Failure Prediction Model (RF):</strong></div>
                      <div style={{ paddingLeft: '10px' }}>
                        <div>Accuracy: {(modelMetrics["model_1_failure_prediction"].accuracy * 100).toFixed(2)}%</div>
                        <div>F1-Score: {modelMetrics["model_1_failure_prediction"].f1_score.toFixed(3)}</div>
                      </div>
                      <div style={{ marginTop: '10px' }}><strong>Failure Classification Model:</strong></div>
                      <div style={{ paddingLeft: '10px' }}>
                        <div>Accuracy: {(modelMetrics["model_6_failure_classification"].accuracy * 100).toFixed(2)}%</div>
                      </div>
                      <div style={{ marginTop: '10px' }}><strong>RUL Forecasting Model:</strong></div>
                      <div style={{ paddingLeft: '10px' }}>
                        <div>RMSE: {modelMetrics["model_2_rul_prediction"].rmse_days.toFixed(2)} days</div>
                        <div>R² Score: {modelMetrics["model_2_rul_prediction"].r2_score.toFixed(3)}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>Awaiting model metrics synchronization...</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
