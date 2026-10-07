import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 1. Transformer 3D Component
function TransformerModel({ telemetry, isWarning, isCritical }) {
  const fanRef1 = useRef();
  const fanRef2 = useRef();
  const [particles, setParticles] = useState([]);

  // Rotate cooling fans based on temperature
  useFrame((state, delta) => {
    const speed = telemetry?.oil_temp ? (telemetry.oil_temp / 30) : 1;
    if (fanRef1.current) fanRef1.current.rotation.y += delta * speed * 5;
    if (fanRef2.current) fanRef2.current.rotation.y += delta * speed * 5;
  });

  // Animate oil circulation particles
  useEffect(() => {
    const temp = telemetry?.oil_temp || 45;
    const count = Math.min(25, Math.floor(temp / 2.5));
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        y: Math.random() * 2 - 1,
        x: Math.random() * 1.6 - 0.8,
        z: Math.random() * 1.6 - 0.8,
        speed: 0.3 + Math.random() * 0.5
      });
    }
    setParticles(pts);
  }, [telemetry?.oil_temp]);

  useFrame((state, delta) => {
    setParticles(prev => prev.map(p => {
      let ny = p.y + delta * p.speed;
      if (ny > 0.9) ny = -0.9;  // Convection loop wrap
      return { ...p, y: ny };
    }));
  });

  // Brighter, more vibrant casing colors
  const tankColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#0096FF';

  return (
    <group position={[0, -0.2, 0]}>
      {/* Main Oil Tank Core */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 1.8, 1.8]} />
        <meshStandardMaterial color={tankColor} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Conservator tank on top */}
      <mesh position={[0, 1.25, -0.4]} rotation={[0, 0, 1.57]}>
        <cylinderGeometry args={[0.35, 0.35, 2.0, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* High-Voltage Ceramic Insulators (Brown/Orange ceramic) */}
      {[-0.8, 0, 0.8].map((x, idx) => (
        <group key={idx} position={[x, 0.9, 0.3]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.08, 0.14, 0.8, 12]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} /> {/* Brown ceramic */}
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Radiator cooling fins on sides */}
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[0.15, 1.5, 1.6]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[0.15, 1.5, 1.6]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cooling Fans (Silver/metallic) */}
      <mesh ref={fanRef1} position={[-1.6, -0.3, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 16]} />
        <meshStandardMaterial color="#0096FF" metalness={0.9} roughness={0.1} wireframe />
      </mesh>
      <mesh ref={fanRef2} position={[1.6, -0.3, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 16]} />
        <meshStandardMaterial color="#0096FF" metalness={0.9} roughness={0.1} wireframe />
      </mesh>

      {/* Glowing Oil Convection Particles */}
      {particles.map((p, idx) => (
        <mesh key={idx} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#0096FF" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// 2. Wind Turbine 3D Component
function WindTurbineModel({ telemetry, isWarning, isCritical }) {
  const rotorRef = useRef();

  useFrame((state, delta) => {
    const speed = telemetry?.rotor_speed ? (telemetry.rotor_speed / 5) : 3;
    if (rotorRef.current) {
      rotorRef.current.rotation.z += delta * speed;
    }
  });

  const towerColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#f8fafc';
  const nacelleColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#0096FF';

  return (
    <group position={[0, -2, 0]}>
      {/* Tower pole */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.1, 0.25, 5.0, 16]} />
        <meshStandardMaterial color={towerColor} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Nacelle housing (Vibrant Blue stripe) */}
      <mesh position={[0, 5.15, -0.2]}>
        <boxGeometry args={[0.7, 0.7, 1.4]} />
        <meshStandardMaterial color={nacelleColor} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Spinner and Rotor Blades */}
      <group ref={rotorRef} position={[0, 5.15, 0.75]}>
        <mesh rotation={[1.57, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.28, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>

        {[0, 2.094, 4.188].map((angle, idx) => (
          <group key={idx} rotation={[0, 0, angle]}>
            <mesh position={[0, 1.15, 0.05]}>
              <boxGeometry args={[0.09, 2.3, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 3. Solar Panel 3D Component
function SolarArrayModel({ telemetry, isWarning, isCritical }) {
  const [electrons, setElectrons] = useState([]);

  useEffect(() => {
    const count = 20;
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * 2.8 - 1.4,
        y: Math.random() * 1.4 - 0.7,
        speed: 0.6 + Math.random() * 1.2
      });
    }
    setElectrons(pts);
  }, []);

  useFrame((state, delta) => {
    setElectrons(prev => prev.map(e => {
      let nx = e.x - delta * e.speed;
      if (nx < -1.4) nx = 1.4;
      return { ...e, x: nx };
    }));
  });

  const frameColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#475569';

  return (
    <group rotation={[0.4, -0.4, 0]} position={[0, 0.2, 0]}>
      {/* Support Stand */}
      <mesh position={[0, -1.2, -0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 1.8, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>

      {/* Frame panel backplate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 1.8, 0.15]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Vibrant Blue Silicon Grid */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[3.0, 1.6, 0.02]} />
        <meshStandardMaterial color="#1e40af" roughness={0.05} metalness={0.95} />
      </mesh>

      {/* Grid lines */}
      {[-1, -0.5, 0, 0.5, 1].map((x, idx) => (
        <mesh key={idx} position={[x, 0, 0.11]}>
          <boxGeometry args={[0.01, 1.6, 0.005]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Energy Flow particles */}
      {electrons.map((e, idx) => (
        <mesh key={idx} position={[e.x, e.y, 0.13]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#34C759" />
        </mesh>
      ))}
    </group>
  );
}

// 4. Battery Stack 3D Component
function BatteryModel({ telemetry, isWarning, isCritical }) {
  const temp = telemetry?.cell_temp || 28;
  const soc = telemetry?.soc || 75;
  const isOverheating = temp > 45;

  // Casing color is now a clean industrial steel gray/silver for high visibility
  const cabinetColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#cbd5e1';

  return (
    <group position={[0, 0, 0]}>
      {/* Battery rack container cabinet */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.5, 2.2, 1.6]} />
        <meshStandardMaterial color={cabinetColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Cabinet Module Rack Slots (Contrasting charcoal inner bay) */}
      {[-0.6, 0, 0.6].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.05]}>
          <boxGeometry args={[2.2, 0.4, 1.52]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      ))}

      {/* Glowing LED status dots */}
      {[-0.6, 0, 0.6].map((y, idx) => {
        const ledColor = isOverheating ? '#FF3B30' : '#34C759';
        return (
          <group key={idx}>
            <mesh position={[-0.8, y, 0.82]}>
              <boxGeometry args={[0.3, 0.1, 0.02]} />
              <meshBasicMaterial color={ledColor} />
            </mesh>
            <mesh position={[0.8, y, 0.82]}>
              <boxGeometry args={[0.3, 0.1, 0.02]} />
              <meshBasicMaterial color={ledColor} />
            </mesh>
          </group>
        );
      })}

      {/* Charging level glowing bar */}
      <mesh position={[0, -0.6, 0.82]}>
        <boxGeometry args={[1.2 * (soc / 100), 0.12, 0.02]} />
        <meshBasicMaterial color="#0096FF" />
      </mesh>
    </group>
  );
}

// 5. Circuit Breaker 3D Component
function BreakerModel({ telemetry, isWarning, isCritical }) {
  const cabinetColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#0096FF';

  return (
    <group position={[0, -1.0, 0]}>
      {/* Support cabinet box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.8, 1.2]} />
        <meshStandardMaterial color={cabinetColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Vertical porcelain columns */}
      {[-0.5, 0.5].map((x, idx) => (
        <group key={idx} position={[x, 1.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 1.6, 12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Ceramic brown bushing collars */}
          {[-0.5, 0, 0.5].map((h, hIdx) => (
            <mesh key={hIdx} position={[0, h, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.15, 12]} />
              <meshStandardMaterial color="#9a3412" roughness={0.6} /> {/* Ceramic brown */}
            </mesh>
          ))}
          {/* Interrupter head */}
          <mesh position={[0, 0.9, 0]} rotation={[1.57, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.8, 12]} />
            <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 6. Transmission Line 3D Component
function TransmissionLineModel({ telemetry, isWarning, isCritical }) {
  const towerColor = isCritical ? '#FF3B30' : isWarning ? '#FF9500' : '#cbd5e1';

  return (
    <group position={[0, -1.8, 0]}>
      {/* Steel latticed tower base */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.08, 0.35, 3.2, 4]} />
        <meshStandardMaterial color={towerColor} roughness={0.4} metalness={0.8} wireframe />
      </mesh>

      {/* Crossbar */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[3.2, 0.15, 0.15]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>

      {/* Insulator columns (Ceramic Brown) */}
      {[-1.4, 1.4].map((x, idx) => (
        <mesh key={idx} position={[x, 2.4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
          <meshStandardMaterial color="#9a3412" roughness={0.7} />
        </mesh>
      ))}

      {/* Sagging power lines */}
      <mesh position={[0, 2.1, 0]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[3.0, 0.03, 0.03]} />
        <meshBasicMaterial color="#0096FF" />
      </mesh>
    </group>
  );
}

export default function DigitalTwinViewer({ asset }) {
  if (!asset) {
    return (
      <div className="glass-panel" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Select an asset from the fleet to initialize its 3D digital twin.
      </div>
    );
  }

  const isWarning = asset.status === 'Warning';
  const isCritical = asset.status === 'Critical';

  return (
    <div className="glass-panel" style={{ height: '450px', padding: 0, position: 'relative', overflow: 'hidden' }}>
      {/* HUD overlay */}
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, pointerEvents: 'none' }}>
        <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#0096FF', letterSpacing: '1px' }}>Digital Twin Stream</h4>
        <h2 style={{ fontSize: '1.2rem', margin: '4px 0' }}>{asset.name}</h2>
        <span className={`status-dot ${asset.status.toLowerCase()}`}></span>
        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{asset.status} ({asset.health_index.toFixed(1)}% Health)</span>
      </div>

      <div style={{ position: 'absolute', bottom: 15, right: 15, zIndex: 10, background: 'rgba(4,8,15,0.7)', border: '1px solid rgba(0,150,255,0.2)', padding: '6px 12px', borderRadius: 4, fontSize: '0.75rem', pointerEvents: 'none', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
        CWD: Orbit Mode | Scroll to Zoom
      </div>

      <Canvas camera={{ position: [0, 1.2, 4.2], fov: 55 }} style={{ background: '#070f1a' }}>
        <ambientLight intensity={1.8} />
        <pointLight position={[10, 12, 10]} intensity={2.5} />
        <directionalLight position={[-5, 5, -5]} intensity={1.2} />

        {asset.type === 'Transformer' && <TransformerModel telemetry={asset.telemetry} isWarning={isWarning} isCritical={isCritical} />}
        {asset.type === 'Renewable' && asset.subtype === 'Wind' && <WindTurbineModel telemetry={asset.telemetry} isWarning={isWarning} isCritical={isCritical} />}
        {asset.type === 'Renewable' && asset.subtype === 'Solar' && <SolarArrayModel telemetry={asset.telemetry} isWarning={isWarning} isCritical={isCritical} />}
        {asset.type === 'Battery' && <BatteryModel telemetry={asset.telemetry} isWarning={isWarning} isCritical={isCritical} />}
        {asset.type === 'CircuitBreaker' && <BreakerModel telemetry={asset.telemetry} isWarning={isWarning} isCritical={isCritical} />}
        {asset.type === 'TransmissionLine' && <TransmissionLineModel telemetry={asset.telemetry} isWarning={isWarning} isCritical={isCritical} />}

        {/* 3D CAD Grid Floor Helper for spatial depth */}
        <gridHelper args={[12, 12, '#0096FF', '#1b2d42']} position={[0, -1.8, 0]} />

        <OrbitControls enablePan={true} maxPolarAngle={Math.PI / 1.8} minDistance={2} maxDistance={9} />
      </Canvas>
    </div>
  );
}
