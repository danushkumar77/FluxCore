import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import type { TelemetryMeasurement } from "../types";

// Animated Particle along line connection path
const EnergyFlowLine = ({ start, end, speed = 1.0, color = "#06b6d4" }: { start: [number, number, number], end: [number, number, number], speed?: number, color?: string }) => {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const curve = new THREE.CatmullRomCurve3(points);
  
  const particleRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (particleRef.current) {
      const time = clock.getElapsedTime() * 0.25 * speed;
      const progress = time % 1.0;
      const pos = curve.getPointAt(progress);
      particleRef.current.position.copy(pos);
    }
  });

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));

  return (
    <group>
      {/* Underlying flow line */}
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color, opacity: 0.15, transparent: true }))} />

      
      {/* Moving Energy particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
};

// Substation / Asset Node representation
const SubstationNode = ({ name, position, type, telemetry, onClick }: { name: string, position: [number, number, number], type: string, telemetry: TelemetryMeasurement | null, onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      // Ambient floating effect
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.1;
    }
  });

  // Calculate color heatmap based on type & telemetry status
  let nodeColor = "#06b6d4"; // Default cyan
  if (type === "battery") {
    nodeColor = "#a855f7"; // Purple
  } else if (type === "generation") {
    nodeColor = "#10b981"; // Emerald green
  }

  // Heatmap check: if temperature > 50C or SOC is low, glow Amber / Rose
  if (telemetry) {
    if (telemetry.temperature_c && telemetry.temperature_c > 80) {
      nodeColor = "#f43f5e"; // Rose critical
    } else if (telemetry.voltage_kv && (telemetry.voltage_kv > 120 || telemetry.voltage_kv < 110)) {
      nodeColor = "#f59e0b"; // Amber warning
    }
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {type === "substation" ? (
          <boxGeometry args={[0.6, 0.6, 0.6]} />
        ) : type === "battery" ? (
          <cylinderGeometry args={[0.3, 0.3, 0.7, 16]} />
        ) : (
          <sphereGeometry args={[0.4, 32, 32]} />
        )}
        
        <meshStandardMaterial
          color={nodeColor}
          roughness={0.1}
          metalness={0.8}
          emissive={nodeColor}
          emissiveIntensity={hovered ? 0.8 : 0.25}
        />

        {/* Floating text tag */}
        <Html distanceFactor={8} position={[0, 0.7, 0]} center>
          <div className="px-2 py-0.5 glass-panel text-[10px] whitespace-nowrap text-slate-300 pointer-events-none select-none rounded border border-white/5 uppercase tracking-wider font-semibold font-mono">
            {name}
          </div>
        </Html>
      </mesh>
    </group>
  );
};

export const DigitalTwinCanvas = ({ telemetry }: { telemetry: TelemetryMeasurement | null }) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [assetTab, setAssetTab] = useState<"telemetry" | "forecast" | "maintenance" | "decisions">("telemetry");

  // Substations positions
  const solarPos: [number, number, number] = [-3, 1, -2];
  const windPos: [number, number, number] = [-3, 1, 2];
  const batteryPos: [number, number, number] = [3, 0.5, 2];
  const subPos: [number, number, number] = [0, 0.8, 0];
  const gridLoadPos: [number, number, number] = [3, 0.6, -2];

  const handleAssetClick = (name: string) => {
    setSelectedAsset(name);
    setAssetTab("telemetry");
  };

  return (
    <div className="w-full h-full relative bg-[#05070f] rounded-lg overflow-hidden border border-white/5">
      <Canvas camera={{ position: [0, 5, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        
        {/* Environment particles */}
        <Stars radius={100} depth={50} count={300} factor={4} saturation={0.5} fade speed={1} />

        {/* Substation grid network layout */}
        <SubstationNode name="PV Solar Farm" position={solarPos} type="generation" telemetry={telemetry} onClick={() => handleAssetClick("Solar Farm")} />
        <SubstationNode name="Wind Farm" position={windPos} type="generation" telemetry={telemetry} onClick={() => handleAssetClick("Wind Farm")} />
        <SubstationNode name="BESS Battery Storage" position={batteryPos} type="battery" telemetry={telemetry} onClick={() => handleAssetClick("BESS Storage")} />
        <SubstationNode name="Central Substation A" position={subPos} type="substation" telemetry={telemetry} onClick={() => handleAssetClick("Substation A")} />
        <SubstationNode name="Industrial Load Grid" position={gridLoadPos} type="substation" telemetry={telemetry} onClick={() => handleAssetClick("Grid Load")} />

        {/* Animated Power Flow Lines */}
        <EnergyFlowLine start={solarPos} end={subPos} speed={1.2} color="#10b981" />
        <EnergyFlowLine start={windPos} end={subPos} speed={1.5} color="#10b981" />
        <EnergyFlowLine start={subPos} end={batteryPos} speed={telemetry && telemetry.battery_soc_pct && telemetry.battery_soc_pct > 80 ? -0.8 : 1.0} color="#a855f7" />
        <EnergyFlowLine start={subPos} end={gridLoadPos} speed={1.8} color="#06b6d4" />

        <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      {/* Asset overlay dashboard details */}
      {selectedAsset && (
        <div className="absolute bottom-4 left-4 p-3.5 glass-panel rounded-lg border border-white/10 w-72 text-xs font-mono">
          <div className="flex justify-between items-center mb-2.5">
            <h4 className="font-bold text-brand-cyan text-[11px] uppercase tracking-wider">{selectedAsset} Details</h4>
            <button className="text-[10px] text-slate-400 hover:text-slate-200" onClick={() => setSelectedAsset(null)}>✕</button>
          </div>

          {/* Sub tabs header */}
          <div className="grid grid-cols-4 gap-1 border-b border-white/5 pb-2 mb-2 text-[9px] font-bold text-center">
            {(["telemetry", "forecast", "maintenance", "decisions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAssetTab(tab)}
                className={`pb-1 uppercase transition ${
                  assetTab === tab 
                    ? "text-brand-cyan border-b border-brand-cyan" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.substring(0, 4)}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 text-[10px]">
            {assetTab === "telemetry" && (
              <>
                <p>Status: <span className="text-brand-emerald font-bold">ONLINE</span></p>
                {telemetry && (
                  <>
                    <p>Voltage: {telemetry.voltage_kv} kV</p>
                    <p>Load Demand: {telemetry.active_power_mw} MW</p>
                    {selectedAsset.includes("BESS") && (
                      <p className="text-brand-purple">Battery SOC: {telemetry.battery_soc_pct}%</p>
                    )}
                  </>
                )}
              </>
            )}

            {assetTab === "forecast" && (
              <>
                <p>Forecast Hour: <span className="text-brand-cyan">Normal</span></p>
                <p>Confidence: <span className="text-brand-emerald">94.8%</span></p>
                <p>Predict Capacity: +18.4 MW</p>
              </>
            )}

            {assetTab === "maintenance" && (
              <>
                <p>Health Index: <span className="text-brand-emerald">98.2%</span></p>
                <p>RUL: 18.5 Years</p>
                <p>Warranty: Active</p>
              </>
            )}

            {assetTab === "decisions" && (
              <>
                <p>Agent Decision: <span className="text-brand-purple font-bold">Approved</span></p>
                <p>Mitigation Plan: Active BESS injection</p>
                <p>Rule compliance: 100% passed</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
