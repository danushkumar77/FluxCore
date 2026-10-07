import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function PeakAlertCard() {
  return (
    <Card className="col-span-1 border-warning/30 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent pointer-events-none" />
      <CardContent className="p-6 h-full flex flex-col justify-center text-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="mx-auto p-4 rounded-full bg-warning/20 text-warning mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          <AlertTriangle className="w-8 h-8" />
        </motion.div>
        
        <h3 className="text-lg font-bold text-foreground mb-1">Peak Demand Alert</h3>
        <p className="text-warning font-medium mb-4">Moderate Risk Level</p>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-warning/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Expected Peak</span>
            </div>
            <span className="text-sm font-bold">18:30 - 20:00</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-warning/20">
            <span className="text-sm text-muted-foreground">Reserve Margin</span>
            <span className="text-sm font-bold text-warning">15.2%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
