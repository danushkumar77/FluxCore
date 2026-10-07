import React from 'react';
import { ShieldCheck, Play, Award, Zap } from 'lucide-react';

export default function RestorationPlanner({ activeIncident, onExecutePlan, operatorMode }) {
  if (!activeIncident || !activeIncident.proposed_plans || activeIncident.proposed_plans.length === 0) {
    return (
      <div className="control-room-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '11px', textAlign: 'center' }}>
        No active restoration plans generated. Platform is monitoring grid state (steady 1.0 per unit).
      </div>
    );
  }

  const plans = activeIncident.proposed_plans;

  return (
    <div className="control-room-panel" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
        <ShieldCheck size={18} color="#0096FF" />
        <div style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '12px', color: '#0096FF', textTransform: 'uppercase' }}>
          Autonomous Restoration Action Planner
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {plans.map(plan => {
          const isSelected = activeIncident.selected_plan_id === plan.plan_id;
          
          return (
            <div key={plan.plan_id} style={{
              background: isSelected ? 'rgba(0,150,255,0.05)' : '#16243F',
              border: isSelected ? '1px solid #0096FF' : '1px solid #1E2E4A',
              borderRadius: '8px',
              padding: '12px 15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative'
            }}>
              
              {isSelected && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '15px',
                  background: '#0096FF',
                  color: '#0A111C',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontFamily: 'Orbitron'
                }}>
                  OPTIMAL SELECTION
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '13px', color: isSelected ? '#0096FF' : '#E2E8F0' }}>
                  {plan.name} - {plan.description}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#64748B' }}>
                  ID: {plan.plan_id}
                </span>
              </div>

              {/* Tradeoff Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', fontSize: '9px', color: '#64748B' }}>
                <div>
                  Safety: <strong style={{ color: '#34C759' }}>{plan.safety_score}%</strong>
                  <div style={{ height: '3px', background: '#1E2E4A', marginTop: '2px' }}><div style={{ height: '100%', background: '#34C759', width: `${plan.safety_score}%` }} /></div>
                </div>
                <div>
                  Stability: <strong style={{ color: '#0096FF' }}>{plan.stability_impact_score}%</strong>
                  <div style={{ height: '3px', background: '#1E2E4A', marginTop: '2px' }}><div style={{ height: '100%', background: '#0096FF', width: `${plan.stability_impact_score}%` }} /></div>
                </div>
                <div>
                  Speed: <strong style={{ color: '#7C4DFF' }}>{plan.speed_score}%</strong>
                  <div style={{ height: '3px', background: '#1E2E4A', marginTop: '2px' }}><div style={{ height: '100%', background: '#7C4DFF', width: `${plan.speed_score}%` }} /></div>
                </div>
                <div>
                  Shedding: <strong style={{ color: '#FF9500' }}>{plan.customer_impact_score}%</strong>
                  <div style={{ height: '3px', background: '#1E2E4A', marginTop: '2px' }}><div style={{ height: '100%', background: '#FF9500', width: `${plan.customer_impact_score}%` }} /></div>
                </div>
                <div>
                  Cost: <strong style={{ color: '#E2E8F0' }}>{plan.cost_score}%</strong>
                  <div style={{ height: '3px', background: '#1E2E4A', marginTop: '2px' }}><div style={{ height: '100%', background: '#E2E8F0', width: `${plan.cost_score}%` }} /></div>
                </div>
              </div>

              {/* Execution Steps */}
              <div style={{ borderTop: '1px solid #1E2E4A', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {plan.steps.map(step => (
                  <div key={step.step_number} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono'
                  }}>
                    <span style={{ color: '#E2E8F0' }}>
                      {step.step_number}. {step.description}
                    </span>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontSize: '8px',
                      background: step.safety_check_passed ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                      color: step.safety_check_passed ? '#34C759' : '#FF3B30'
                    }}>
                      {step.safety_check_passed ? 'SAFETY OK' : 'FAILED CHECK'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Execute / Action Button */}
              {operatorMode !== "AUTONOMOUS" && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                  <button 
                    onClick={() => onExecutePlan(plan.plan_id)} 
                    className="btn" 
                    style={{ fontSize: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Play size={12} /> Approve & Execute
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
