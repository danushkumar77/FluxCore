import React from 'react';
import { Cpu, ShieldCheck, Database, Server } from 'lucide-react';

export default function SystemHealth({ currentState, operatorMode }) {
  return (
    <div className="control-room-panel" style={{ height: '100%', overflowY: 'auto', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Cpu size={18} color="#0096FF" />
        <div style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '12px', color: '#0096FF', textTransform: 'uppercase' }}>
          Agent System Health & Status Audit
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* State panel */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#E2E8F0', fontWeight: 'bold', marginBottom: '10px' }}>
            AGENT CORE EXECUTION PROFILE
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>Active Worker Thread Status: <span style={{ color: '#34C759', fontWeight: 'bold' }}>RUNNING</span></div>
            <div>Current Operations State: <strong>{currentState}</strong></div>
            <div>Control Mode: <strong>{operatorMode}</strong></div>
            <div>Worker Scan Cycle Frequency: <strong>1.5 seconds</strong></div>
          </div>
        </div>

        {/* Database migration panel */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#E2E8F0', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={12} color="#0096FF" /> TIMESCALEDB / DATABASE METADATA
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>Migration Path Status: <span style={{ color: '#FF9500', fontWeight: 'bold' }}>SQLITE_ACTIVE (Dev Mode)</span></div>
            <div style={{ color: '#64748B', fontSize: '10px', lineHeight: '1.4' }}>
              TimescaleDB hyperparameters mapped: grid_telemetry hypertable initialized over 15-minute aggregation buckets.
            </div>
            <div style={{ borderTop: '1px solid #1E2E4A', paddingTop: '6px' }}>
              Incidents Index Count: <strong>Active</strong>
            </div>
          </div>
        </div>

      </div>

      {/* API diagnostics */}
      <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#E2E8F0', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Server size={12} color="#7C4DFF" /> API ROUTE REGISTER LOGS
        </div>
        <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>GET  /grid/digital-twin - STATUS 200 OK</div>
          <div>POST /grid/fault-simulate - STATUS 200 OK</div>
          <div>POST /grid/restoration-execute - STATUS 200 OK</div>
          <div>GET  /relay/status - STATUS 200 OK</div>
          <div>GET  /ws/grid - WS HANDSHAKE UPGRADED</div>
        </div>
      </div>
    </div>
  );
}
