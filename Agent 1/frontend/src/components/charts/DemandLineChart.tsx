import { ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, ComposedChart } from 'recharts';
import { HourlyForecast } from '../../types';

export default function DemandLineChart({ data }: { data: HourlyForecast[] }) {
  const chartData = data.map(d => ({
    time: `${d.hour}:00`,
    demand: d.demand,
    upper: d.demand + (100 - d.confidence) * 120,
    lower: d.demand - (100 - d.confidence) * 120,
  }));

  return (
    <div className="h-full w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.05)" vertical={false} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(14, 22, 40, 0.95)', borderColor: 'rgba(0, 240, 255, 0.3)', borderRadius: '6px', fontSize: '11px', fontFamily: 'Share Tech Mono' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(0, 240, 255, 0.05)" />
          <Area type="monotone" dataKey="lower" stroke="none" fill="#050816" />
          <Line type="monotone" dataKey="demand" stroke="#00f0ff" strokeWidth={2} dot={{ r: 2, fill: '#00f0ff', strokeWidth: 0 }} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
