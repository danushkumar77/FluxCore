import React, { useEffect, useState } from 'react';
import { History, Calendar, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface DecisionTimelineProps {
  telemetry: any;
}

export default function DecisionTimeline({ telemetry }: DecisionTimelineProps) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/economy/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.log("No backend connection; using simulated history.");
      }
    };
    fetchHistory();
  }, []);

  const defaultHistory = [
    { id: 1, timestamp: "22:00:15", action_taken: "CHARGE_BATTERY (120 kW)", savings: -18.40, confidence: 0.94, grid_price: 0.12, status: "SUCCESS" },
    { id: 2, timestamp: "19:00:22", action_taken: "DISCHARGE_BATTERY (150 kW)", savings: 72.00, confidence: 0.92, grid_price: 0.48, status: "SUCCESS" },
    { id: 3, timestamp: "18:00:10", action_taken: "DISCHARGE_BATTERY (150 kW)", savings: 68.50, confidence: 0.91, grid_price: 0.45, status: "SUCCESS" },
    { id: 4, timestamp: "14:00:05", action_taken: "SHIFT_LOAD (45 kW for 3h)", savings: 29.70, confidence: 0.89, grid_price: 0.28, status: "SUCCESS" },
    { id: 5, timestamp: "08:00:45", action_taken: "USE_SOLAR_RESERVES", savings: 12.00, confidence: 0.95, grid_price: 0.18, status: "SUCCESS" }
  ];

  const displayHistory = history.length > 0 ? history : defaultHistory;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="glass-panel p-6 rounded">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-gridAI animate-spin-slow" />
          Clearing Decision Registry Timeline
        </h2>
        <p className="text-slate-400 text-xs mt-1">Audit log of all autonomous transactions and actions executed on behalf of the grid.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative border-l-2 border-gridEnergy border-opacity-35 ml-8 space-y-8"
      >
        {displayHistory.map((log: any, index: number) => (
          <motion.div 
            variants={item}
            key={log.id || index} 
            className="relative pl-8"
          >
            {/* Timeline marker with ping glow */}
            <span className="absolute -left-[18px] top-1.5 w-8 h-8 rounded-full bg-slate-900 border-2 border-gridEnergy flex items-center justify-center shadow-[0_0_8px_rgba(0,200,255,0.4)]">
              <Cpu className="w-3.5 h-3.5 text-gridEnergy" />
            </span>

            <div className="glass-panel p-6 rounded grid grid-cols-1 md:grid-cols-4 gap-6 items-center hover:border-gridEnergy transition-colors duration-300">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Timestamp
                </span>
                <strong className="text-slate-300 font-mono text-xs block mt-1">
                  {log.timestamp.includes("T") ? log.timestamp.split("T")[1].substring(0, 8) : log.timestamp}
                </strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operational Action</span>
                <strong className="text-white text-xs block mt-1 uppercase font-mono">{log.action_taken}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tariff Rate</span>
                <span className="text-gridEnergy font-extrabold block mt-1 font-mono">${log.grid_price || 0.28}/kWh</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Financial Outcome</span>
                <span className={`text-lg font-extrabold block mt-1 font-mono ${log.savings >= 0 ? 'text-gridProfit' : 'text-gridWarning'}`}>
                  {log.savings >= 0 ? `+$${log.savings.toFixed(2)}` : `-$${Math.abs(log.savings).toFixed(2)}`}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
