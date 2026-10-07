import { motion } from 'framer-motion';
import { Zap, Activity, BatteryMedium, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { DashboardSummary } from '../../types';

export default function GridStatusCard({ data }: { data: DashboardSummary }) {
  const metrics = [
    { 
      label: 'Current Load', 
      value: `${data.current_load.toLocaleString()}`, 
      unit: 'MW',
      icon: Zap, 
      color: 'text-cyan-400', 
      trend: 'up' 
    },
    { 
      label: 'Grid Frequency', 
      value: '50.02', 
      unit: 'Hz',
      icon: Activity, 
      color: 'text-success', 
      trend: 'stable' 
    },
    { 
      label: 'Voltage', 
      value: '400.5', 
      unit: 'kV',
      icon: BatteryMedium, 
      color: 'text-accent', 
      trend: 'stable' 
    },
    { 
      label: 'Power Factor', 
      value: '0.98', 
      unit: '',
      icon: Activity, 
      color: 'text-success', 
      trend: 'up' 
    }
  ];

  return (
    <Card className="col-span-2 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Real-time Grid Status</h3>
        <div className="grid grid-cols-2 gap-6">
          {metrics.map((m, i) => (
            <motion.div 
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className={`p-3 rounded-lg bg-black/40 ${m.color}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">{m.value}</span>
                  <span className="text-sm text-muted-foreground">{m.unit}</span>
                </div>
              </div>
              <div className="ml-auto mt-2">
                {m.trend === 'up' ? <TrendingUp className="w-4 h-4 text-warning" /> : 
                 m.trend === 'down' ? <TrendingDown className="w-4 h-4 text-success" /> : 
                 <div className="w-4 h-1 rounded bg-success/50" />}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
