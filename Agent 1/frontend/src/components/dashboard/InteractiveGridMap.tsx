import { useState, useEffect } from 'react';
import { Sun, Wind, Battery, ShieldAlert, Cpu, Building, RefreshCw, Zap } from 'lucide-react';

interface GridNode {
  id: string;
  name: string;
  type: 'generation' | 'substation' | 'storage' | 'demand';
  x: number;
  y: number;
  value: string;
  status: 'nominal' | 'warning' | 'critical';
  details: string;
}

export default function InteractiveGridMap({ currentLoad }: { currentLoad: number }) {
  const [activeNode, setActiveNode] = useState<GridNode | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(timer);
  }, []);

  const nodes: GridNode[] = [
    { id: 'solar', name: 'Helios Solar Array', type: 'generation', x: 80, y: 60, value: '3,200 MW', status: 'nominal', details: 'Solar Irradiance: 720 W/m². Active cells.' },
    { id: 'wind', name: 'Galeforce Wind Farm', type: 'generation', x: 260, y: 40, value: '1,800 MW', status: 'nominal', details: 'Wind speed: 28 km/h. Turbines rotating at nominal RPM.' },
    { id: 'hydro', name: 'Apex Hydro Station', type: 'generation', x: 380, y: 60, value: '1,400 MW', status: 'nominal', details: 'Reservoir status: Nominal. Current output stable.' },
    { id: 'sub1', name: 'Substation Alpha', type: 'substation', x: 220, y: 150, value: '138 kV', status: 'nominal', details: 'Phase balance: 99.8%. No transformer saturation.' },
    { id: 'battery', name: 'Tesla Megapack Storage', type: 'storage', x: 80, y: 220, value: '840 MW', status: 'nominal', details: 'State of Charge: 68%. Mode: Discharge Mode Enabled.' },
    { id: 'metro', name: 'Metropolitan Demand Center', type: 'demand', x: 380, y: 220, value: '7,800 MW', status: 'warning', details: 'Phase loading high. Ambient HVAC demand peaking.' },
  ];

  return (
    <div className="hud-panel p-4 rounded-xl flex flex-col h-full select-none">
      <div className="flex items-center justify-between mb-4 border-b border-[#00f0ff]/15 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono font-bold uppercase text-white tracking-widest">Active Grid Waveform flow</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping"></span>
          <span>LIVE TRANSMISSION FLOWS</span>
        </div>
      </div>

      <div className="relative flex-1 bg-[#050816]/60 rounded-lg border border-[#00f0ff]/10 p-2 min-h-[220px]">
        {/* CSS Animation rules for grid elements */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes rotor-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes solar-pulse {
            0% { fill-opacity: 0.2; }
            100% { fill-opacity: 0.6; }
          }
          .spin-rotor {
            transform-origin: 260px 40px;
            animation: rotor-spin 2s linear infinite;
          }
          .pulse-solar-ray {
            animation: solar-pulse 1.5s ease-in-out infinite alternate;
          }
          .battery-glow {
            filter: drop-shadow(0 0 8px #00ff88);
            animation: pulse-node 1.5s infinite alternate;
          }
        `}} />

        <svg viewBox="0 0 460 280" className="w-full h-full">
          {/* Transmission lines paths */}
          {/* Solar -> Substation */}
          <path d="M 80 60 L 220 150" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="2.5" fill="none" />
          <path d="M 80 60 L 220 150" stroke="#00f0ff" strokeWidth="2" fill="none" className="electron-flow" />

          {/* Wind -> Substation */}
          <path d="M 260 40 L 220 150" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="2.5" fill="none" />
          <path d="M 260 40 L 220 150" stroke="#00f0ff" strokeWidth="2" fill="none" className="electron-flow" />

          {/* Hydro -> Substation */}
          <path d="M 380 60 L 220 150" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="2.5" fill="none" />
          <path d="M 380 60 L 220 150" stroke="#00f0ff" strokeWidth="2" fill="none" className="electron-flow" />

          {/* Battery -> Substation */}
          <path d="M 80 220 L 220 150" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="2.5" fill="none" />
          <path d="M 80 220 L 220 150" stroke="#10b981" strokeWidth="2" fill="none" className="electron-flow" />

          {/* Substation -> Metro */}
          <path d="M 220 150 L 380 220" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="3" fill="none" />
          <path d="M 220 150 L 380 220" stroke="#f59e0b" strokeWidth="2" fill="none" className="electron-flow" />

          {/* Wind turbine blades rotation */}
          <circle cx="260" cy="40" r="15" fill="rgba(255,255,255,0.03)" stroke="rgba(0,240,255,0.2)" strokeWidth="1" />
          <path d="M 260 25 L 260 55 M 245 40 L 275 40" stroke="#00f0ff" strokeWidth="1.5" className="spin-rotor" />

          {/* Solar Panel rays */}
          <circle cx="80" cy="60" r="14" fill="rgba(255,255,255,0.03)" stroke="rgba(0,240,255,0.2)" strokeWidth="1" />
          <circle cx="80" cy="60" r="10" fill="rgba(0,240,255,0.2)" className="pulse-solar-ray" />

          {/* Nodes Rendering */}
          {nodes.map(node => {
            const isSelected = activeNode?.id === node.id;
            const isBattery = node.id === 'battery';
            return (
              <g 
                key={node.id} 
                className="cursor-pointer group" 
                onClick={() => setActiveNode(node)}
              >
                {/* Node outer glow */}
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={isSelected ? 16 : 10} 
                  fill={node.status === 'critical' ? 'rgba(239, 68, 68, 0.15)' : node.status === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 240, 255, 0.15)'}
                  stroke={node.status === 'critical' ? '#ef4444' : node.status === 'warning' ? '#f59e0b' : '#00f0ff'}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  className="transition-all duration-300"
                />
                {/* Core node dot */}
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={isSelected ? 8 : 5}
                  fill={node.status === 'critical' ? '#ef4444' : node.status === 'warning' ? '#f59e0b' : isBattery ? '#00ff88' : '#00f0ff'}
                  className={isBattery ? 'battery-glow' : node.status === 'warning' || isSelected ? 'grid-node-pulse' : ''}
                />

                {/* Micro Node labels */}
                <text 
                  x={node.x} 
                  y={node.y - 18} 
                  textAnchor="middle" 
                  fill="#94a3b8" 
                  fontSize={8} 
                  fontWeight="bold" 
                  className="font-mono tracking-wider opacity-80 group-hover:opacity-100 uppercase"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating HUD detail panel overlay */}
        {activeNode && (
          <div className="absolute bottom-2 left-2 right-2 bg-[#0e1628]/95 border border-[#00f0ff]/30 p-2.5 rounded-lg text-[11px] font-mono shadow-[0_4px_20px_rgba(0,200,255,0.15)] animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-1 mb-1">
              <span className="text-white font-bold tracking-wider">{activeNode.name}</span>
              <span className="text-[#00f0ff]">{activeNode.value}</span>
            </div>
            <p className="text-muted-foreground mb-1.5">{activeNode.details}</p>
            <button 
              className="text-[9px] text-[#00f0ff] hover:underline"
              onClick={(e) => { e.stopPropagation(); setActiveNode(null); }}
            >
              CLOSE telemetry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
