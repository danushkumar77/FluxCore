import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function WeatherCard() {
  const weather = [
    { label: 'Humidity', value: '45%', icon: Droplets, color: 'text-blue-400' },
    { label: 'Wind Speed', value: '18 km/h', icon: Wind, color: 'text-gray-300' },
    { label: 'Irradiance', value: '850 W/m²', icon: Sun, color: 'text-yellow-400' },
  ];

  return (
    <Card className="col-span-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Local Weather</h3>
          <span className="px-2 py-1 rounded text-[10px] font-medium bg-success/20 text-success border border-success/30">
            Low Impact
          </span>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-400">
            <Thermometer className="w-8 h-8" />
          </div>
          <div>
            <div className="text-4xl font-bold">28°<span className="text-xl text-muted-foreground">C</span></div>
            <p className="text-sm text-muted-foreground">Clear, Sunny</p>
          </div>
        </div>

        <div className="grid gap-3 mt-auto">
          {weather.map((w, i) => (
            <motion.div 
              key={w.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <w.icon className={`w-4 h-4 ${w.color}`} />
                <span className="text-sm text-muted-foreground">{w.label}</span>
              </div>
              <span className="text-sm font-medium">{w.value}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
