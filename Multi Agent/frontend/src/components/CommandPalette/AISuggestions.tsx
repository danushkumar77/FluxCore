import React from "react";
import { Sparkles } from "lucide-react";

interface AISuggestionsProps {
  query: string;
  onSelectSuggestion: (sug: string) => void;
}

export const AISuggestions = ({ query, onSelectSuggestion }: AISuggestionsProps) => {
  if (!query) return null;

  const suggestions: Record<string, string[]> = {
    battery: ["Battery Dashboard", "Battery Agent", "Battery Report", "Battery Simulation", "Battery Health"],
    fault: ["Fault Agent", "Fault Timeline", "Root Cause Analysis", "Grid Reliability"],
    cyber: ["Cybersecurity Agent", "SCADA intrusion logs", "Threat audit report", "Simulation: Cyber Attack"]
  };

  // Find match key
  const matchKey = Object.keys(suggestions).find(k => query.toLowerCase().includes(k));
  if (!matchKey) return null;

  const list = suggestions[matchKey];

  return (
    <div className="px-4 py-2 border-b border-white/5 bg-brand-purple/5 flex items-center space-x-2 shrink-0 font-mono text-[9px]">
      <div className="flex items-center text-brand-purple space-x-1 font-bold uppercase shrink-0">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>AI Suggests:</span>
      </div>
      <div className="flex flex-wrap gap-1.5 overflow-x-auto select-none">
        {list.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(sug)}
            className="px-2 py-0.5 bg-brand-purple/15 text-slate-300 hover:text-white rounded border border-brand-purple/20 transition cursor-pointer shrink-0"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
};
