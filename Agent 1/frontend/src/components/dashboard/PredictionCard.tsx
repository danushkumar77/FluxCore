import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { DashboardSummary } from '../../types';

export default function PredictionCard({ data }: { data: DashboardSummary }) {
  const prediction = data.recent_predictions[0];
  if (!prediction) return null;

  return (
    <Card className="col-span-2 relative overflow-hidden group border-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Next Hour Demand</h3>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">
              {prediction.category}
            </Badge>
            <Badge className={
              prediction.risk === 'Low' ? 'risk-low' : 
              prediction.risk === 'Medium' ? 'risk-medium' : 
              prediction.risk === 'High' ? 'risk-high' : 'risk-critical'
            }>
              {prediction.risk} Risk
            </Badge>
          </div>
        </div>

        <div className="flex items-end gap-6 mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 glow-text"
          >
            {prediction.prediction.toLocaleString()} <span className="text-2xl text-cyan-400/70">MW</span>
          </motion.div>
          
          <div className="flex items-center gap-2 mb-2">
            {prediction.trend === 'Increasing' ? <ArrowUpRight className="w-6 h-6 text-warning" /> :
             prediction.trend === 'Decreasing' ? <ArrowDownRight className="w-6 h-6 text-success" /> :
             <ArrowRight className="w-6 h-6 text-muted-foreground" />}
            <span className={`text-lg font-medium ${
              prediction.trend === 'Increasing' ? 'text-warning' :
              prediction.trend === 'Decreasing' ? 'text-success' : 'text-muted-foreground'
            }`}>
              {prediction.trend}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Next 6 Hours</p>
            <p className="text-xl font-bold">{prediction.next_6h_demand.toLocaleString()} MW</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Next 24 Hours</p>
            <p className="text-xl font-bold">{prediction.next_24h_demand.toLocaleString()} MW</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-4 h-4" /> Peak Target
            </p>
            <p className="text-xl font-bold text-accent">{prediction.peak_demand.toLocaleString()} MW</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
