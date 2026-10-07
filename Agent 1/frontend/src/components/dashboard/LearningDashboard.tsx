import { Sparkles, ArrowDownRight, RefreshCw, BarChart2 } from 'lucide-react';
import { Reflection } from '../../types';

export default function LearningDashboard({ reflections }: { reflections: Reflection[] }) {
  const latest = reflections && reflections.length > 0 ? reflections[reflections.length - 1] : {
    mean_deviation_mw: 142.12,
    lessons_learned: ["Acceptable boundary tracking (+/- 1.5%)."],
    recommend_retraining: false
  };

  return (
    <div className="hud-panel p-4 rounded-xl flex flex-col h-full bg-[#0e1628]/60 font-sans select-none">
      <div className="flex items-center justify-between border-b border-[#00f0ff]/15 pb-2 mb-3">
        <span className="text-xs font-mono font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-[#00f0ff]" /> Continuous Learning Engine
        </span>
        <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded font-bold">
          LOOP ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 items-center">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Mean Prediction Error</span>
          <p className="text-lg font-bold text-white font-mono mt-0.5">{latest.mean_deviation_mw} MW</p>
          <span className="text-[9.5px] text-[#10b981] flex items-center gap-0.5 font-mono mt-0.5">
            <ArrowDownRight className="w-3.5 h-3.5" /> -4.2% drift delta
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Weekly Accuracy Score</span>
          <p className="text-lg font-bold text-[#10b981] font-mono mt-0.5">98.78%</p>
          <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">Stable tracking</span>
        </div>
      </div>

      <div className="border-t border-[#00f0ff]/10 pt-2.5 mt-3 text-[10px] font-mono text-slate-300 leading-normal flex items-start gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#c084fc] shrink-0 animate-pulse" />
        <div>
          <p className="italic">"Agent is continuously learning from historical outcomes."</p>
          <p className="text-muted-foreground text-[9px] mt-1 uppercase">
            Lesson: {latest.lessons_learned[0] || 'Nominal tracking bounds.'}
          </p>
        </div>
      </div>
    </div>
  );
}
