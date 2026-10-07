import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, ShieldAlert, Award } from 'lucide-react';

export default function AICopilot({ currentState, activeIncident, onSendMessage, chatHistory }) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const stateColors = {
    "Idle": "#64748B",
    "Monitoring": "#34C759",
    "Fault Detection": "#FF9500",
    "Grid Analysis": "#7C4DFF",
    "Risk Assessment": "#FF3B30",
    "Reasoning": "#7C4DFF",
    "Planning": "#0096FF",
    "Executing": "#FF3B30",
    "Recovery": "#34C759",
    "Reflection": "#0096FF",
    "Learning": "#34C759"
  };

  return (
    <div className="copilot-chat" style={{ height: '100%', display: 'grid', gridTemplateRows: '150px 1fr 60px' }}>
      
      {/* AI State Agent Header */}
      <div style={{
        background: '#16243F',
        borderBottom: '1px solid #1E2E4A',
        padding: '12px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="#7C4DFF" style={{ animation: 'pulse-border 1.5s infinite' }} />
          <div style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '11px', color: '#7C4DFF' }}>Active Agent State Machine</div>
        </div>
        
        {/* Animated state progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', padding: '4px 0' }}>
          {["Monitoring", "Grid Analysis", "Reasoning", "Planning", "Executing", "Recovery", "Learning"].map((state, idx) => {
            const isActive = currentState === state;
            const bg = isActive ? stateColors[state] : 'transparent';
            const border = isActive ? 'none' : '1px solid #1E2E4A';
            const color = isActive ? '#0A111C' : '#64748B';
            return (
              <span key={state} style={{
                fontSize: '8px',
                fontWeight: 'bold',
                padding: '3px 6px',
                borderRadius: '4px',
                background: bg,
                border: border,
                color: color,
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease'
              }}>
                {state.toUpperCase()}
              </span>
            );
          })}
        </div>

        {activeIncident && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '9px', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldAlert size={10} /> RULES: {activeIncident.ieee_rules_referenced.join(', ') || 'IEEE-50'}
            </span>
            <span style={{ fontSize: '9px', background: 'rgba(124,77,255,0.1)', color: '#7C4DFF', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Award size={10} /> CONFIDENCE: {(activeIncident.outage_probability > 0 ? 96 : 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Chat History Panel */}
      <div className="chat-history">
        <div className="chat-message ai">
          <strong>GridReliabilityCopilot:</strong> Secure link established. I am configured as Senior Grid Reliability Engineer. Query telemetry, faults, or restoration operations.
        </div>
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            <strong>{msg.sender === 'ai' ? 'GridReliabilityCopilot' : 'Operator'}:</strong>
            <div style={{ marginTop: '4px', fontFamily: msg.sender === 'ai' ? 'inherit' : 'JetBrains Mono' }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSubmit} className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot (e.g. 'Isolate Transformer T1' or 'Check S1 voltage stability')..."
          className="chat-input"
          style={{ fontSize: '12px' }}
        />
        <button type="submit" className="btn" style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
