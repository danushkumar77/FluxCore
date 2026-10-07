import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const mockFeatureImportance = [
  { name: 'Time of Day', value: 0.34, category: 'time' },
  { name: 'Previous load', value: 0.27, category: 'grid' },
  { name: 'Renewable Output', value: 0.18, category: 'weather' },
  { name: 'Battery SOC', value: 0.11, category: 'grid' },
  { name: 'Electricity Price', value: 0.10, category: 'market' },
];

const categoryColors: Record<string, string> = {
  time: '#00f0ff',
  weather: '#10b981',
  grid: '#3b82f6',
  market: '#f59e0b',
};

export default function FeatureImportanceChart() {
  return (
    <div className="h-full w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={mockFeatureImportance} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.05)" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val * 100}%`} />
          <YAxis type="category" dataKey="name" stroke="#e2e8f0" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(14, 22, 40, 0.95)', borderColor: 'rgba(0, 240, 255, 0.3)', borderRadius: '6px', fontSize: '11px', fontFamily: 'Share Tech Mono' }}
            cursor={{ fill: 'rgba(0, 240, 255, 0.05)' }}
            formatter={(value: any) => [`${(value * 100).toFixed(0)}%`, 'Importance']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
            {mockFeatureImportance.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || '#00f0ff'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
