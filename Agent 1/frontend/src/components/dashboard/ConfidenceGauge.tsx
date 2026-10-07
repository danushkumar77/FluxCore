import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';

export default function ConfidenceGauge({ value = 94.2 }: { value?: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * (circumference / 2);
  
  let color = '#10b981'; // success
  if (value < 50) color = '#ef4444'; // danger
  else if (value < 75) color = '#f59e0b'; // warning

  return (
    <Card className="col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center w-full">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 w-full text-left">Model Confidence</h3>
        
        <div className="relative w-40 h-24 flex justify-center overflow-hidden">
          {/* Background Arc */}
          <svg className="absolute w-40 h-40 transform rotate-180" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference / 2}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 10px ${color}80)` }}
            />
          </svg>
          
          <div className="absolute bottom-0 flex flex-col items-center">
            <span className="text-3xl font-bold">{value}%</span>
          </div>
        </div>
        
        <div className="flex justify-between w-full px-4 mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </CardContent>
    </Card>
  );
}
