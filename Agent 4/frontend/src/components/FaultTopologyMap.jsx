import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Node positioning
const NODE_COORDS = {
  "S1": { x: 50, y: 50 },
  "S2": { x: 50, y: 350 },
  "S3": { x: 450, y: 350 },
  "S4": { x: 450, y: 50 },
  "S5": { x: 250, y: 200 }
};

export default function FaultTopologyMap({ twinData, onToggleBreaker }) {
  const nodes = twinData?.nodes || [];
  const edges = twinData?.edges || [];

  // Generate React Flow nodes
  const flowNodes = useMemo(() => {
    return nodes.map(node => {
      const coords = NODE_COORDS[node.id] || { x: 0, y: 0 };
      const statusColor = node.status === "CRITICAL" ? "#FF3B30" : node.status === "WARNING" ? "#FF9500" : "#34C759";
      return {
        id: node.id,
        position: coords,
        data: {
          label: (
            <div style={{ padding: '5px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'Orbitron' }}>{node.label}</div>
              <div style={{ fontSize: '9px', color: '#64748B' }}>{node.voltage_level_kv} kV</div>
              <div style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: statusColor, marginTop: '5px' }} />
            </div>
          )
        },
        style: {
          background: '#111A2E',
          color: '#E2E8F0',
          border: `1px solid ${statusColor}`,
          width: 120,
          borderRadius: '8px',
          boxShadow: `0 0 10px rgba(0,0,0,0.5)`
        }
      };
    });
  }, [nodes]);

  // Generate React Flow edges
  const flowEdges = useMemo(() => {
    return edges.map(edge => {
      let color = "#0096FF"; // Healthy blue
      let animated = true;
      let style = { strokeWidth: 2 };
      
      if (edge.status === "FAULTED") {
        color = "#FF3B30"; // Red fault
        style = { strokeWidth: 4, stroke: '#FF3B30' };
      } else if (edge.status === "ISOLATED") {
        color = "#1E2E4A"; // Dark muted blue
        animated = false;
        style = { strokeWidth: 1, strokeDasharray: '5,5', opacity: 0.4 };
      }

      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        animated,
        label: `${edge.id} (${edge.active_power_mw.toFixed(1)} MW)`,
        labelStyle: { fill: '#64748B', fontSize: 8, fontFamily: 'JetBrains Mono', background: '#0A111C' },
        style: { ...style, stroke: color },
        type: 'smoothstep'
      };
    });
  }, [edges]);

  // Find breakers to render in control console panel below map
  const breakers = useMemo(() => {
    const rawBreakers = [];
    nodes.forEach(n => {
      if (n.breakers) {
        n.breakers.forEach(bId => {
          rawBreakers.push({
            id: bId,
            substation: n.id,
            isClosed: true // Default
          });
        });
      }
    });
    return rawBreakers;
  }, [nodes]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr 140px' }}>
      <div style={{ width: '100%', height: '100%', background: '#0A111C' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          nodesConnectable={false}
          nodesDraggable={true}
        >
          <Controls />
          <Background color="#1E2E4A" gap={16} />
        </ReactFlow>
      </div>
      
      {/* Interactive Breaker Console */}
      <div style={{
        background: '#111A2E',
        borderTop: '1px solid #1E2E4A',
        padding: '12px 20px',
        overflowY: 'auto'
      }}>
        <div style={{ fontSize: '11px', fontFamily: 'Orbitron', fontWeight: 'bold', color: '#0096FF', marginBottom: '8px', textTransform: 'uppercase' }}>
          Breaker Control Console (Manual Override)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {edges.map(edge => {
            const breakerIdA = `B${edge.id[1]}A`;
            const breakerIdB = `B${edge.id[1]}B`;
            
            const lineIsolated = edge.status === "ISOLATED";

            return (
              <div key={edge.id} style={{
                background: '#16243F',
                border: '1px solid #1E2E4A',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#E2E8F0' }}>{edge.id}:</span>
                <button 
                  onClick={() => onToggleBreaker(breakerIdA, lineIsolated)}
                  className={`btn ${lineIsolated ? 'btn-secondary' : 'btn-danger'}`}
                  style={{ padding: '4px 8px', fontSize: '9px' }}
                >
                  {breakerIdA}: {lineIsolated ? 'CLOSE' : 'TRIP'}
                </button>
                <button 
                  onClick={() => onToggleBreaker(breakerIdB, lineIsolated)}
                  className={`btn ${lineIsolated ? 'btn-secondary' : 'btn-danger'}`}
                  style={{ padding: '4px 8px', fontSize: '9px' }}
                >
                  {breakerIdB}: {lineIsolated ? 'CLOSE' : 'TRIP'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
