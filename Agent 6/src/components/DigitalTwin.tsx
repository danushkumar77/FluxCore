import React, { useEffect, useRef, useState } from 'react';
import { Sun, Battery, Home, Landmark, Activity, Thermometer, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface DigitalTwinProps {
  telemetry: any;
}

export default function DigitalTwin({ telemetry }: DigitalTwinProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const solarGen = telemetry.market.solar_forecast || 0.0;
  const loadDemand = telemetry.market.demand_forecast || 0.0;
  const batteryDispatch = telemetry.battery.dispatch_kw || 0.0;
  const netGrid = telemetry.market.demand_forecast - telemetry.market.solar_forecast - batteryDispatch;

  const isExporting = netGrid < 0;
  const isHighCost = telemetry.market.buying_price > 0.3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let particleOffset = 0;
    let turbineAngle = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 400;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawWindTurbine = (x: number, y: number, height: number, size: number) => {
      if (!ctx) return;
      // Draw tower
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - height);
      ctx.stroke();

      // Draw spinning blades
      ctx.save();
      ctx.translate(x, y - height);
      ctx.rotate(turbineAngle);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      
      for (let i = 0; i < 3; i++) {
        ctx.rotate((2 * Math.PI) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawSolarPanel = (x: number, y: number, size: number) => {
      if (!ctx) return;
      // Tilted panel angle dependent on diurnal simulated time
      const hour = telemetry.sim_hour || 12;
      const tiltAngle = ((hour - 12) / 12) * 0.45; // Tilted angle

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tiltAngle);

      // Support base
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 15);
      ctx.stroke();

      // Blue face plate
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#00C8FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-size, -5, size * 2, 10, 2);
      ctx.fill();
      ctx.stroke();

      // Draw cell grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size / 2, -5); ctx.lineTo(-size / 2, 5);
      ctx.moveTo(0, -5); ctx.lineTo(0, 5);
      ctx.moveTo(size / 2, -5); ctx.lineTo(size / 2, 5);
      ctx.stroke();

      ctx.restore();
    };

    const drawNode = (name: string, valStr: string, x: number, y: number, color: string) => {
      if (!ctx) return;
      ctx.fillStyle = 'rgba(14, 27, 41, 0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 65, y - 40, 130, 80, 8);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), x, y - 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillText(valStr, x, y + 15);
    };

    const drawConnectionLine = (x1: number, y1: number, x2: number, y2: number, active: boolean, flowDir: number) => {
      if (!ctx) return;
      ctx.strokeStyle = active ? '#1a3e5c' : '#112233';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (active) {
        ctx.strokeStyle = isHighCost ? '#F44336' : '#00E676';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 16]);
        ctx.lineDashOffset = -particleOffset * flowDir;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particleOffset = (particleOffset + 1.2) % 24;
      turbineAngle = (turbineAngle + 0.03) % (Math.PI * 2);

      const w = canvas.width;
      const h = canvas.height;

      const centerX = w / 2;
      const centerY = h / 2;
      
      const solarX = centerX - 180;
      const solarY = centerY - 100;

      const gridX = centerX - 180;
      const gridY = centerY + 100;

      const batteryX = centerX + 180;
      const batteryY = centerY - 100;

      const loadX = centerX + 180;
      const loadY = centerY + 100;

      // Draw connection lines
      drawConnectionLine(solarX, solarY, centerX, centerY, solarGen > 0, 1);
      drawConnectionLine(gridX, gridY, centerX, centerY, Math.abs(netGrid) > 0, isExporting ? -1 : 1);
      drawConnectionLine(centerX, centerY, batteryX, batteryY, Math.abs(batteryDispatch) > 0, batteryDispatch < 0 ? 1 : -1);
      drawConnectionLine(centerX, centerY, loadX, loadY, loadDemand > 0, 1);

      // Central Hub
      ctx.fillStyle = '#081018';
      ctx.strokeStyle = '#7C4DFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = '#7C4DFF';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText("BUS", centerX, centerY + 3);

      // Render physical assets on the canvas
      drawWindTurbine(solarX - 100, solarY + 40, 60, 22);
      drawSolarPanel(solarX - 100, solarY - 10, 25);
      
      // Render outer cards
      drawNode("Solar Farm", `${solarGen.toFixed(1)} kW`, solarX, solarY, '#00C8FF');
      drawNode("Power Grid", `${netGrid.toFixed(1)} kW`, gridX, gridY, isHighCost ? '#F44336' : '#00E676');
      drawNode("Battery Bank", `${(telemetry.battery.soc * 100).toFixed(1)}%`, batteryX, batteryY, '#FF9800');
      drawNode("Microgrid Load", `${loadDemand.toFixed(1)} kW`, loadX, loadY, '#7C4DFF');

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [solarGen, loadDemand, batteryDispatch, netGrid, isExporting, isHighCost, telemetry]);

  return (
    <div className="p-8 space-y-6">
      {/* Overview header */}
      <div className="glass-panel p-6 rounded flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white">Economic Grid Digital Twin</h2>
          <p className="text-slate-400 text-xs mt-1">Real-time solar panel sun-tracking and rotating wind turbine physics.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-3 h-3 bg-gridProfit rounded-sm" /> Low cost flow
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-3 h-3 bg-gridCritical rounded-sm" /> High cost import
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Animated flow canvas pod */}
        <div className="lg:col-span-3 glass-panel p-6 rounded relative flex flex-col justify-center min-h-[440px]">
          <canvas ref={canvasRef} className="w-full h-full block z-10" />
          <div className="absolute bottom-4 left-6 text-xs text-slate-500 font-mono">
            Interactive circuit bus topology - updates real-time
          </div>
        </div>

        {/* Diagnostics side columns */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded space-y-5">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4">
              Twin Telemetries
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Battery Temp</span>
                <strong className="text-white font-mono">{telemetry.battery.temperature_c.toFixed(1)}°C</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Grid Frequency</span>
                <strong className="text-white font-mono">60.01 Hz</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Battery SoH</span>
                <strong className="text-gridProfit font-mono">{telemetry.battery.soh}%</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Bus Voltage</span>
                <strong className="text-white font-mono">1.01 pu</strong>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded text-xs">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider block">Active Power Balance</span>
            <div className="mt-4 space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Solar Gen:</span>
                <span className="text-gridEnergy">+{solarGen.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span>Battery Dispatch:</span>
                <span className={batteryDispatch >= 0 ? 'text-gridProfit' : 'text-gridWarning'}>
                  {batteryDispatch >= 0 ? `+${batteryDispatch.toFixed(1)}` : batteryDispatch.toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span>Load Demand:</span>
                <span className="text-gridCritical">-{loadDemand.toFixed(1)} kW</span>
              </div>
              <div className="border-t border-borderMuted pt-2 flex justify-between font-bold text-white">
                <span>Net Grid Import:</span>
                <span>{netGrid.toFixed(1)} kW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
