import { PredictionResponse } from '../../types';

export default function HistoryTable({ predictions }: { predictions: PredictionResponse[] }) {
  return (
    <div className="overflow-x-auto select-none rounded-lg border border-[#00f0ff]/15 bg-[#0e1628]/20">
      <table className="w-full text-left text-sm font-sans text-slate-200">
        <thead className="bg-[#050816] text-[#00f0ff] uppercase tracking-wider text-xs border-b border-[#00f0ff]/20">
          <tr>
            <th className="px-5 py-4 font-bold">Timestamp</th>
            <th className="px-5 py-4 font-bold">Demand (MW)</th>
            <th className="px-5 py-4 font-bold">Confidence Index</th>
            <th className="px-5 py-4 font-bold">Risk Level</th>
            <th className="px-5 py-4 font-bold">Grid Status</th>
            <th className="px-5 py-4 font-bold">Trend Path</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#00f0ff]/10">
          {predictions.map((p, idx) => {
            const isCritical = p.risk === 'Critical';
            const isHigh = p.risk === 'High';
            const isMed = p.risk === 'Medium';
            return (
              <tr key={idx} className="hover:bg-[#00f0ff]/5 transition-colors duration-150">
                <td className="px-5 py-4 text-slate-300 font-mono font-medium">
                  {new Date(p.timestamp).toLocaleTimeString() || p.timestamp}
                </td>
                <td className="px-5 py-4 font-bold font-mono text-white text-base">
                  {p.prediction.toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-white/10 rounded overflow-hidden">
                      <div className="h-full bg-[#10b981]" style={{ width: `${p.confidence}%` }} />
                    </div>
                    <span className="font-mono text-xs text-slate-200 font-bold">{p.confidence.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-bold">
                  <span className={`px-2.5 py-1 rounded text-xs border ${
                    isCritical ? 'bg-red-500/20 text-red-300 border-red-500/40 glow-red' :
                    isHigh ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 glow-amber' :
                    isMed ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald'
                  }`}>
                    {p.risk}
                  </span>
                </td>
                <td className="px-5 py-4 uppercase font-medium text-slate-100 text-xs">
                  {p.category}
                </td>
                <td className="px-5 py-4 uppercase font-mono text-xs text-slate-300 font-bold">
                  {p.trend}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
