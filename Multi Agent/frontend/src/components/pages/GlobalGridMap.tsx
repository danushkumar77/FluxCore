import React, { useState } from "react";
import { Map, Sun, CloudRain, ShieldAlert, Layers } from "lucide-react";
import { motion } from "framer-motion";

export const GlobalGridMap = () => {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [weatherLayer, setWeatherLayer] = useState<"none" | "solar" | "storm">("none");
  const [filterType, setFilterType] = useState<"all" | "generation" | "substation">("all");

  const nodes = [
    { id: "node-1", name: "PV Solar Farm", type: "generation", x: 100, y: 120, status: "active", health: 91.5, output: "18.4 MW", desc: "Monitored solar arrays generating peak renewable capacity." },
    { id: "node-2", name: "Wind Farm North", type: "generation", x: 500, y: 80, status: "maintenance", health: 88.6, output: "12.1 MW", desc: "Wind turbine group undergoing minor gearbox maintenance checks." },
    { id: "node-3", name: "BESS Storage Unit 1", type: "storage", x: 150, y: 320, status: "active", health: 98.4, output: "Hold (75.0% SOC)", desc: "Lithium BESS battery unit ready for peak shaving discharge cycles." },
    { id: "node-4", name: "Central Substation A", type: "substation", x: 320, y: 220, status: "active", health: 94.2, output: "114.8 kV", desc: "Main step-up distribution grid transformer node." },
    { id: "node-5", name: "Industrial Load Grid", type: "substation", x: 520, y: 300, status: "active", health: 98.2, output: "80.4 MW", desc: "Localized industrial distribution customer demand profile." }
  ];

  const connections = [
    { from: "node-1", to: "node-4", color: "#10b981" },
    { from: "node-2", to: "node-4", color: "#10b981" },
    { from: "node-4", to: "node-3", color: "#a855f7" },
    { from: "node-4", to: "node-5", color: "#06b6d4" }
  ];

  const filteredNodes = nodes.filter(n => filterType === "all" || n.type === filterType);

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Control Toolbar */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1 overflow-x-auto max-w-full">
          {["all", "generation", "substation"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f as any)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition ${
                filterType === f 
                  ? "bg-brand-cyan text-slate-950" 
                  : "bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Weather toggle overlay */}
        <div className="flex space-x-2 border-l border-white/10 pl-3">
          <button 
            onClick={() => setWeatherLayer(weatherLayer === "solar" ? "none" : "solar")}
            className={`px-3 py-1.5 rounded text-[10px] font-bold transition border flex items-center space-x-1.5 ${
              weatherLayer === "solar" 
                ? "bg-brand-amber/15 text-brand-amber border-brand-amber/40" 
                : "bg-white/5 text-slate-400 border-white/5"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Solar Heat Layer</span>
          </button>
          <button 
            onClick={() => setWeatherLayer(weatherLayer === "storm" ? "none" : "storm")}
            className={`px-3 py-1.5 rounded text-[10px] font-bold transition border flex items-center space-x-1.5 ${
              weatherLayer === "storm" 
                ? "bg-brand-rose/15 text-brand-rose border-brand-rose/40 animate-pulse" 
                : "bg-white/5 text-slate-400 border-white/5"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Storm Risk Layer</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Map workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* Map Column SVG container */}
        <div className="xl:col-span-3 p-4 glass-panel rounded-xl border border-white/5 h-[400px] relative overflow-hidden bg-[#070b19]">
          
          {/* Simulated storm overlay graphic */}
          {weatherLayer === "storm" && (
            <div className="absolute inset-0 bg-brand-rose/5 pointer-events-none animate-pulse flex items-center justify-center border border-brand-rose/25">
              <span className="text-[10px] text-brand-rose uppercase font-bold tracking-widest bg-black/60 px-3 py-1 rounded-full border border-brand-rose/40">
                ⚠️ High Wind Storm Warning Zone active
              </span>
            </div>
          )}

          {weatherLayer === "solar" && (
            <div className="absolute inset-0 bg-brand-amber/5 pointer-events-none flex items-center justify-center border border-brand-amber/25">
              <span className="text-[10px] text-brand-amber uppercase font-bold tracking-widest bg-black/60 px-3 py-1 rounded-full border border-brand-amber/40">
                ☼ Optimal Solar Irradiance conditions
              </span>
            </div>
          )}

          <svg width="100%" height="100%" viewBox="0 0 640 400" className="w-full h-full select-none cursor-grab">
            
            {/* Draw transmission grid lines path */}
            {connections.map((c, i) => {
              const fromNode = nodes.find(n => n.id === c.from);
              const toNode = nodes.find(n => n.id === c.to);
              if (!fromNode || !toNode) return null;
              return (
                <line 
                  key={i}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={c.color}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  className="animate-[dash_10s_linear_infinite]"
                />
              );
            })}

            {/* Draw asset nodes */}
            {filteredNodes.map((n) => {
              const isSelected = selectedNode?.id === n.id;
              const isWarning = n.status === "maintenance";
              const isOffline = n.status === "offline";
              
              const color = isOffline 
                ? "#ef4444" 
                : isWarning 
                  ? "#f59e0b" 
                  : n.type === "storage" 
                    ? "#a855f7" 
                    : n.type === "generation" 
                      ? "#10b981" 
                      : "#06b6d4";

              return (
                <g 
                  key={n.id} 
                  onClick={() => setSelectedNode(n)}
                  className="cursor-pointer"
                >
                  <circle 
                    cx={n.x} 
                    cy={n.y} 
                    r={isSelected ? 10 : 8} 
                    fill={color}
                    className={isSelected ? "stroke-white stroke-2 animate-pulse" : "hover:stroke-white/40 hover:stroke-2"}
                  />
                  <text 
                    x={n.x} 
                    y={n.y - 14} 
                    fill="#94a3b8" 
                    fontSize={8} 
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node description detail panel */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-col justify-between h-[400px]">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h4 className="font-bold text-white uppercase text-[10px]">{selectedNode.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
                  selectedNode.status === "active" 
                    ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20" 
                    : "bg-brand-amber/10 text-brand-amber border-brand-amber/20 animate-pulse"
                }`}>
                  {selectedNode.status}
                </span>
              </div>
              
              <div className="space-y-2 text-[10px] pt-1">
                <p className="text-slate-400 font-sans leading-relaxed">{selectedNode.desc}</p>
                <p className="text-slate-300"><strong>Type:</strong> <span className="uppercase">{selectedNode.type}</span></p>
                <p className="text-slate-300"><strong>Health Score:</strong> <span className="text-brand-emerald font-bold">{selectedNode.health}%</span></p>
                <p className="text-slate-300"><strong>Output Reading:</strong> <span className="text-brand-cyan">{selectedNode.output}</span></p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-slate-500 font-semibold leading-relaxed">
              Select any coordinate node on the grid map to display parameters.
            </div>
          )}

          <div className="text-[8px] text-slate-500 pt-3 border-t border-white/5 leading-normal">
            Platform Geographic bounds: <br />
            Lat: 37.7749° N | Lng: -122.4194° W
          </div>
        </div>

      </div>

    </div>
  );
};
