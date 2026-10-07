import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Substation positions mapping latitude/longitude to a centered 3D scale
const SUBSTATION_POSITIONS = {
  "S1": [-4, 0, -2],
  "S2": [4, 0, -1],
  "S3": [2, 0, 4],
  "S4": [-3, 0, 3],
  "S5": [0, 1.5, 0] // Central Hub is elevated
};

function SubstationNode({ id, name, status, position }) {
  const meshRef = useRef();
  
  // Rotate substation sphere slowly
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const color = status === "CRITICAL" ? "#FF3B30" : status === "WARNING" ? "#FF9500" : "#34C759";

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Light ring around substation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.7, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function PowerFlowLine({ fromPos, toPos, status, current }) {
  const points = [new THREE.Vector3(...fromPos), new THREE.Vector3(...toPos)];
  const curve = new THREE.CatmullRomCurve3(points);
  
  const particleRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    // Flow particles smoothly along the curve (framerate-independent using delta)
    tRef.current += delta * 0.15 * (current || 0.4);
    if (tRef.current > 1) tRef.current = 0;

    if (particleRef.current) {
      const pos = curve.getPointAt(tRef.current);
      particleRef.current.position.copy(pos);
    }
  });

  const lineColor = status === "FAULTED" ? "#FF3B30" : status === "ISOLATED" ? "#1E2E4A" : "#0096FF";
  const flowColor = status === "FAULTED" ? "#FF3B30" : status === "RECOVERY" ? "#34C759" : "#7C4DFF";

  return (
    <group>
      {/* Base Line Cylinder */}
      <mesh>
        <tubeGeometry args={[curve, 64, 0.04, 8, false]} />
        <meshBasicMaterial color={lineColor} transparent opacity={0.7} />
      </mesh>

      {/* Floating flow particle */}
      {status !== "ISOLATED" && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={flowColor} />
        </mesh>
      )}
    </group>
  );
}

export default function GridTwin({ twinData }) {
  const nodes = twinData?.nodes || [];
  const edges = twinData?.edges || [];
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 8, 10], fov: 60 }}>
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0.5} fade speed={1} />
        
        {/* Render Substation Spheres */}
        {nodes.map(node => (
          <SubstationNode 
            key={node.id} 
            id={node.id} 
            name={node.label} 
            status={node.status} 
            position={SUBSTATION_POSITIONS[node.id] || [0,0,0]} 
          />
        ))}

        {/* Render Transmission Lines with flowing particles */}
        {edges.map(edge => {
          const fromPos = SUBSTATION_POSITIONS[edge.from];
          const toPos = SUBSTATION_POSITIONS[edge.to];
          if (!fromPos || !toPos) return null;
          return (
            <PowerFlowLine 
              key={edge.id} 
              fromPos={fromPos} 
              toPos={toPos} 
              status={edge.status} 
              current={edge.current_rms} 
            />
          );
        })}

        {/* Ground grid helper */}
        <gridHelper args={[20, 20, '#1E2E4A', '#111A2E']} position={[0, -0.6, 0]} />
        <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>

      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '15px',
        background: 'rgba(17, 26, 46, 0.85)',
        border: '1px solid #1E2E4A',
        padding: '12px 15px',
        borderRadius: '8px',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 'bold', fontFamily: 'Orbitron', color: '#0096FF', textTransform: 'uppercase' }}>Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#34C759' }} /> Healthy Substation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#FF9500' }} /> Warning Overheat</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#FF3B30' }} /> Faulted Segment</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#7C4DFF' }} /> Power Flow Particle</div>
      </div>
    </div>
  );
}
