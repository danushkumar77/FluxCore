import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Radio, CheckCircle, ShieldAlert } from 'lucide-react';

export default function IncidentTimeline({ timeline }) {
  const getIcon = (action) => {
    if (action.includes("open") || action.includes("trip")) return <ShieldAlert size={12} color="#FF3B30" />;
    if (action.includes("close") || action.includes("restore")) return <CheckCircle size={12} color="#34C759" />;
    return <Radio size={12} color="#0096FF" />;
  };

  return (
    <div className="control-room-panel" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
        <Calendar size={18} color="#0096FF" />
        <div style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '12px', color: '#0096FF', textTransform: 'uppercase' }}>
          Incident Operations Log Timeline
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '1px solid #1E2E4A' }}>
        <AnimatePresence initial={false}>
          {timeline && timeline.length > 0 ? (
            timeline.map((log, index) => {
              const formattedTime = new Date(log.timestamp * 1000).toLocaleTimeString();
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'relative',
                    marginBottom: '15px',
                    background: '#16243F',
                    border: '1px solid #1E2E4A',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '11px'
                  }}
                >
                  {/* Timeline point dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-26px',
                    top: '12px',
                    background: '#111A2E',
                    border: '1px solid #1E2E4A',
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getIcon(log.action)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: '9px' }}>
                    <span>{formattedTime}</span>
                    <span>CONFIDENCE: {Math.round((log.confidence || 0.95) * 100)}%</span>
                  </div>
                  
                  <div style={{ fontWeight: 'bold', color: '#E2E8F0', marginBottom: '2px' }}>
                    {log.action.toUpperCase()} on {log.target}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '10px' }}>
                    {log.message}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div style={{ color: '#64748B', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
              No operations logged. Grid operates under steady conditions.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
