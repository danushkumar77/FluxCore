import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Database, Brain, Globe2, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function SystemHealth() {
  const systems = [
    { name: 'API Server', status: true, icon: Globe2 },
    { name: 'Database', status: true, icon: Database },
    { name: 'AI Model', status: true, icon: Brain },
  ];

  return (
    <Card className="col-span-1">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">System Health</h3>
        
        <div className="space-y-4">
          {systems.map((sys, idx) => (
            <motion.div 
              key={sys.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-black/30 border ${sys.status ? 'border-success/20 text-success' : 'border-danger/20 text-danger'}`}>
                  <sys.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{sys.name}</span>
              </div>
              {sys.status ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-danger" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Uptime: 99.9%
          </div>
          <div>v1.0.42</div>
        </div>
      </CardContent>
    </Card>
  );
}
