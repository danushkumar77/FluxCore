import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function ReasoningPanel({ reasoning }: { reasoning: string }) {
  return (
    <Card className="col-span-2 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-600" />
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">AI Analysis</h3>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Sparkles className="w-3 h-3" />
            Gemini Powered
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-black/20 border border-white/5"
        >
          <p className="text-sm leading-relaxed text-muted-foreground font-medium italic">
            "{reasoning}"
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
