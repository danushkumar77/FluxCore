import { motion } from 'framer-motion';
import { Lightbulb, Battery, Sun, Settings2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function RecommendationPanel({ recommendations }: { recommendations: string[] }) {
  const getIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('battery') || lower.includes('storage')) return Battery;
    if (lower.includes('solar') || lower.includes('weather')) return Sun;
    if (lower.includes('alert') || lower.includes('critical')) return AlertCircle;
    return Settings2;
  };

  return (
    <Card className="col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-warning" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Operational Recommendations</h3>
        </div>
        
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const Icon = getIcon(rec);
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 hover:bg-black/40 transition-colors group cursor-default"
              >
                <div className="w-6 h-6 rounded bg-black/50 border border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 group-hover:text-primary transition-colors">
                  {idx + 1}
                </div>
                <Icon className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                <p className="text-sm text-foreground/80">{rec}</p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
