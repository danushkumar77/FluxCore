import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { WeeklyTrend } from '../../types';

export default function WeeklyTrendChart({ data }: { data: WeeklyTrend[] }) {
  return (
    <div className="h-full w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.05)" vertical={false} />
          <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(14, 22, 40, 0.95)', borderColor: 'rgba(0, 240, 255, 0.3)', borderRadius: '6px', fontSize: '11px', fontFamily: 'Share Tech Mono' }}
            cursor={{ fill: 'rgba(0, 240, 255, 0.05)' }}
          />
          <Bar dataKey="avg_demand" fill="url(#barGlow)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
