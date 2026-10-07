import React from 'react';
import { Activity, ShieldAlert, Thermometer, BarChart } from 'lucide-react';

export default function RiskDashboard({ gridMetrics }) {
  const metrics = gridMetrics || {
    grid_health_score: 100.0,
    stability_score: 100.0,
    outage_probability: 0.0,
    transformer_healths: {},
    line_healths: {}
  };

  const transList = Object.values(metrics.transformer_healths || {});
  const lineList = Object.values(metrics.line_healths || {});

  const getStatusColor = (val) => {
    if (val < 60) return '#FF3B30';
    if (val < 85) return '#FF9500';
    return '#34C759';
  };

  return (
    <div className="control-room-panel" style={{ height: '100%', overflowY: 'auto', gap: '20px' }}>
      
      {/* Top Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px' }}>
            <span>Grid Health Index</span>
            <Activity size={12} color="#34C759" />
          </div>
          <div className="metric-value" style={{ color: getStatusColor(metrics.grid_health_score) }}>
            {metrics.grid_health_score}%
          </div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px' }}>
            <span>Stability Score</span>
            <BarChart size={12} color="#0096FF" />
          </div>
          <div className="metric-value">
            {metrics.stability_score}%
          </div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px' }}>
            <span>Outage Risk Probability</span>
            <ShieldAlert size={12} color="#FF9500" />
          </div>
          <div className="metric-value" style={{ color: metrics.outage_probability > 0.3 ? '#FF3B30' : '#FF9500' }}>
            {(metrics.outage_probability * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#E2E8F0', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
          Substation Transformer Thermal / Dielectric Health
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {transList.map(t => (
            <div key={t.asset_id} style={{
              background: '#16243F',
              border: '1px solid #1E2E4A',
              borderRadius: '6px',
              padding: '10px 15px',
              fontSize: '11px',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold', color: '#0096FF' }}>{t.asset_id}</span>
              <span>Health: <strong style={{ color: getStatusColor(t.health_score) }}>{t.health_score}%</strong></span>
              <span>outage Prob: <strong>{(t.outage_probability * 100).toFixed(1)}%</strong></span>
              <span style={{
                color: t.criticality_rank === 1 ? '#FF3B30' : '#FF9500',
                fontWeight: 'bold',
                textAlign: 'right'
              }}>
                CRITICALITY {t.criticality_rank}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Line List */}
      <div>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#E2E8F0', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
          Transmission Corridor Degradation / Impedance Health
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lineList.map(l => (
            <div key={l.asset_id} style={{
              background: '#16243F',
              border: '1px solid #1E2E4A',
              borderRadius: '6px',
              padding: '10px 15px',
              fontSize: '11px',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold', color: '#7C4DFF' }}>{l.asset_id}</span>
              <span>Health: <strong style={{ color: getStatusColor(l.health_score) }}>{l.health_score}%</strong></span>
              <span>outage Prob: <strong>{(l.outage_probability * 100).toFixed(1)}%</strong></span>
              <span style={{
                color: l.criticality_rank === 1 ? '#FF3B30' : '#FF9500',
                fontWeight: 'bold',
                textAlign: 'right'
              }}>
                CRITICALITY {l.criticality_rank}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
