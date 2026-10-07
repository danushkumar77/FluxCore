import React, { useEffect } from "react";
import { ReactFlow, Controls, Background, useNodesState, useEdgesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AgentState } from "../types";

const initialNodes = [
  { id: "orch", type: "default", data: { label: "FluxCore Orchestrator" }, position: { x: 250, y: 150 }, style: { background: "#0f172a", border: "2px solid #06b6d4", color: "#fff", padding: 10, borderRadius: 8, boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)" } },
  { id: "agent1", type: "default", data: { label: "Demand Forecast Agent" }, position: { x: 50, y: 30 }, style: { background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 8, borderRadius: 6 } },
  { id: "agent2", type: "default", data: { label: "Renewable Energy Agent" }, position: { x: 450, y: 30 }, style: { background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 8, borderRadius: 6 } },
  { id: "agent3", type: "default", data: { label: "Battery Energy Agent" }, position: { x: 50, y: 270 }, style: { background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 8, borderRadius: 6 } },
  { id: "agent4", type: "default", data: { label: "Grid Reliability Agent" }, position: { x: 450, y: 270 }, style: { background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 8, borderRadius: 6 } },
  { id: "agent5", type: "default", data: { label: "Predictive Maintenance Agent" }, position: { x: 250, y: -20 }, style: { background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 8, borderRadius: 6 } },
  { id: "agent6", type: "default", data: { label: "Economic Optimization Agent" }, position: { x: 250, y: 320 }, style: { background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 8, borderRadius: 6 } }
];

const initialEdges = [
  { id: "e-orch-a1", source: "orch", target: "agent1", animated: true, style: { stroke: "rgba(255,255,255,0.15)" } },
  { id: "e-orch-a2", source: "orch", target: "agent2", animated: true, style: { stroke: "rgba(255,255,255,0.15)" } },
  { id: "e-orch-a3", source: "orch", target: "agent3", animated: true, style: { stroke: "rgba(255,255,255,0.15)" } },
  { id: "e-orch-a4", source: "orch", target: "agent4", animated: true, style: { stroke: "rgba(255,255,255,0.15)" } },
  { id: "e-orch-a5", source: "orch", target: "agent5", animated: true, style: { stroke: "rgba(255,255,255,0.15)" } },
  { id: "e-orch-a6", source: "orch", target: "agent6", animated: true, style: { stroke: "rgba(255,255,255,0.15)" } }
];

export const AgentGraph = ({ activeTransitions }: { activeTransitions: any[] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Hook to animate agent node color based on active transition logs
  useEffect(() => {
    if (activeTransitions.length === 0) return;
    
    const lastTransition = activeTransitions[activeTransitions.length - 1];
    const agentName = lastTransition.agent_name;
    const targetState = lastTransition.to_state;

    // Map Agent names to node IDs
    const mapping: Record<string, string> = {
      "DemandForecastAgent": "agent1",
      "RenewableEnergyAgent": "agent2",
      "BatteryEnergyAgent": "agent3",
      "GridReliabilityAgent": "agent4",
      "PredictiveMaintenanceAgent": "agent5",
      "EconomicIntelligenceAgent": "agent6"
    };

    const nodeId = mapping[agentName];
    if (nodeId) {
      // Glow node briefly
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Determine border color based on state
            let color = "#06b6d4"; // Analysis
            if (targetState === "Optimization" || targetState === "Planning") {
              color = "#a855f7"; // Purple
            } else if (targetState === "Error") {
              color = "#f43f5e"; // Red
            }
            return {
              ...node,
              style: {
                ...node.style,
                border: `2px solid ${color}`,
                boxShadow: `0 0 10px ${color}`,
                color: "#fff",
                background: "rgba(15, 23, 42, 0.95)"
              }
            };
          }
          return node;
        })
      );

      // Light up the connecting edge
      const edgeId = `e-orch-${nodeId}`;
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              style: { stroke: "#06b6d4", strokeWidth: 2 }
            };
          }
          return edge;
        })
      );

      // Clear glow after 2 seconds
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                style: {
                  ...node.style,
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "none",
                  color: "#94a3b8",
                  background: "rgba(15, 23, 42, 0.7)"
                }
              };
            }
            return node;
          })
        );
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id === edgeId) {
              return {
                ...edge,
                style: { stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }
              };
            }
            return edge;
          })
        );
      }, 2000);
    }
  }, [activeTransitions, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-[#05070f] rounded-lg border border-white/5 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls showInteractive={false} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
        <Background bgColor="#05070f" color="rgba(255,255,255,0.03)" gap={20} />
      </ReactFlow>
      <div className="absolute top-4 left-4 p-2 glass-panel rounded border border-white/10 pointer-events-none select-none">
        <h4 className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider">Agent Event Bus Flow</h4>
      </div>
    </div>
  );
};
