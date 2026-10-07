import React, { useMemo } from 'react';

export default function RelayDashboard({ relayData, activeIncident }) {
  const relays = useMemo(() => {
    return Object.values(relayData || {});
  }, [relayData]);

  // Generate SVG waveform coordinates for active faults
  const renderFaultWaveform = () => {
    // Generate a path showing normal AC sinewave suddenly spiking
    let points = [];
    for (let i = 0; i < 100; i++) {
      let x = i * 4;
      let y = 50; // center
      if (i < 40) {
        // Normal phase current sine
        y += Math.sin(i * 0.4) * 15;
      } else if (i < 65) {
        // Fault spike!
        y += Math.sin(i * 0.8) * 45 + (Math.random() - 0.5) * 5;
      } else {
        // Breaker tripped: 0 current
        y += 0;
      }
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const renderVoltageWaveform = () => {
    let points = [];
    for (let i = 0; i < 100; i++) {
      let x = i * 4;
      let y = 50;
      if (i < 40) {
        // Normal voltage
        y += Math.sin(i * 0.4 + 1.2) * 20;
      } else if (i < 65) {
        // Voltage dip!
        y += Math.sin(i * 0.8 + 1.2) * 4;
      } else {
        // Dead line
        y += 0;
      }
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="control-room-panel" style={{ gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Waveform scope */}
        <div style={{ background: '#0A111C', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#7C4DFF', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
            Transient Fault Waveform Scope (IEEE 50/51)
          </div>
          {activeIncident ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#64748B', fontFamily: 'JetBrains Mono', marginBottom: '5px' }}>Phase A Current (rms) - Spike & Lockout Trip</div>
                <svg width="100%" height="100" style={{ background: '#050A12', border: '1px solid #16243F' }}>
                  <path d={`M ${renderFaultWaveform()}`} fill="none" stroke="#FF3B30" strokeWidth="2" />
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#16243F" strokeDasharray="5,5" />
                  <line x1="160" y1="0" x2="160" y2="100" stroke="#FF9500" strokeDasharray="3,3" />
                  <text x="165" y="15" fill="#FF9500" fontSize="8" fontFamily="JetBrains Mono">Breaker Trip (t = 24ms)</text>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#64748B', fontFamily: 'JetBrains Mono', marginBottom: '5px' }}>Voltage Profile (pu) - Transient Voltage Dip</div>
                <svg width="100%" height="100" style={{ background: '#050A12', border: '1px solid #16243F' }}>
                  <path d={`M ${renderVoltageWaveform()}`} fill="none" stroke="#0096FF" strokeWidth="2" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#16243F" strokeDasharray="5,5" />
                </svg>
              </div>
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#64748B', fontSize: '11px', textAlign: 'center', width: '100%', justifyContent: 'center' }}>
              No active transient waveforms. Grid operates under steady-state conditions (60.00 Hz).
            </div>
          )}
        </div>

        {/* Protection Coordination Status */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#0096FF', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
            Protection Coordination Audits
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
            <div className="metric-card" style={{ padding: '8px 12px' }}>
              <div style={{ color: '#64748B' }}>IEEE 50BF Breaker Failure Lockout</div>
              <div style={{ color: '#34C759', fontWeight: 'bold', fontSize: '13px' }}>HEALTHY - NO FAILURE DETECTED</div>
            </div>
            <div className="metric-card" style={{ padding: '8px 12px' }}>
              <div style={{ color: '#64748B' }}>False Trip Probability Index</div>
              <div style={{ color: '#0096FF', fontWeight: 'bold', fontSize: '13px' }}>0.015% (Nominal)</div>
            </div>
            <div className="metric-card" style={{ padding: '8px 12px' }}>
              <div style={{ color: '#64748B' }}>Differential Trip Winding Alignment</div>
              <div style={{ color: '#34C759', fontWeight: 'bold', fontSize: '13px' }}>100% MATCH (IEEE 87T)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Relays Table */}
      <div>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#E2E8F0', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
          Registered Field Protection Relays
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E2E4A', color: '#64748B' }}>
              <th style={{ padding: '8px' }}>Relay ID</th>
              <th style={{ padding: '8px' }}>Substation</th>
              <th style={{ padding: '8px' }}>Associated Breaker</th>
              <th style={{ padding: '8px' }}>Active Modes</th>
              <th style={{ padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {relays.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #16243F' }}>
                <td style={{ padding: '8px', fontWeight: 'bold', color: '#0096FF' }}>{r.id}</td>
                <td style={{ padding: '8px' }}>{r.substation_id}</td>
                <td style={{ padding: '8px' }}>{r.associated_breaker_id}</td>
                <td style={{ padding: '8px', color: '#64748B', fontFamily: 'JetBrains Mono' }}>
                  {r.mode_21_active && 'IEEE-21 '}
                  {r.mode_50_active && 'IEEE-50 '}
                  {r.mode_51_active && 'IEEE-51 '}
                  {r.mode_87T_active && 'IEEE-87T '}
                </td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    background: r.status === 'TRIPPED' ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)',
                    color: r.status === 'TRIPPED' ? '#FF3B30' : '#34C759'
                  }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
