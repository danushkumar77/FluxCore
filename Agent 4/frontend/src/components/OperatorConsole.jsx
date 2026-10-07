import React from 'react';
import { ToggleLeft, ToggleRight, Radio, AlertTriangle } from 'lucide-react';

export default function OperatorConsole({ operatorMode, onSetMode, onInjectFault, onClearFaults, activeFaults }) {
  const faultsList = [
    { id: "L1", label: "Lightning Strike - Line L1", type: "LINE_TO_GROUND" },
    { id: "L2", label: "Insulator Fault - Line L2", type: "LINE_TO_LINE" },
    { id: "T1", label: "Transformer T1 Overheat", type: "TRANSFORMER_OVERHEAT" },
    { id: "T4", label: "T4 Insulation Breakdown", type: "INSULATION_BREAKDOWN" },
    { id: "L3", label: "Sustained Short - Line L3", type: "THREE_PHASE_SHORT" }
  ];

  return (
    <div className="control-room-panel" style={{ height: '100%', overflowY: 'auto' }}>
      
      {/* Operating Modes Selection */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#0096FF', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
          Grid Operation Control Mode
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {["AUTONOMOUS", "ASSISTED", "MANUAL", "EMERGENCY"].map(mode => {
            const isActive = operatorMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onSetMode(mode)}
                className={`btn ${isActive ? '' : 'btn-secondary'}`}
                style={{
                  fontSize: '10px',
                  padding: '10px',
                  background: isActive ? (mode === "EMERGENCY" ? "#FF3B30" : "#7C4DFF") : 'transparent',
                  border: isActive ? 'none' : '1px solid #1E2E4A',
                  color: '#E2E8F0',
                  fontWeight: 'bold',
                  fontFamily: 'Orbitron'
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fault Injection Panel */}
      <div style={{ borderTop: '1px solid #1E2E4A', paddingTop: '15px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#FF9500', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <AlertTriangle size={12} /> Grid Incident Simulation
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faultsList.map(f => {
            const hasFault = activeFaults && f.id in activeFaults;
            return (
              <div key={f.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#16243F',
                border: '1px solid #1E2E4A',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '11px'
              }}>
                <span style={{ color: '#E2E8F0', fontWeight: '500' }}>{f.label}</span>
                {hasFault ? (
                  <button 
                    onClick={() => onClearFaults(f.id)} 
                    className="btn btn-secondary" 
                    style={{ fontSize: '9px', padding: '4px 8px', borderColor: '#FF3B30', color: '#FF3B30' }}
                  >
                    CLEAR FAULT
                  </button>
                ) : (
                  <button 
                    onClick={() => onInjectFault(f.id, f.type)} 
                    className="btn btn-danger" 
                    style={{ fontSize: '9px', padding: '4px 8px' }}
                  >
                    INJECT FAULT
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Operator override explanation */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#0F1827', border: '1px solid #1E2E4A', borderRadius: '6px', fontSize: '10px', color: '#64748B', lineHeight: '1.4' }}>
        <strong>Assisted Mode:</strong> AI generates recovery options (A-E) and validates security constraints, but waits for Operator approval before executing breaker toggle sequences.
      </div>
    </div>
  );
}
