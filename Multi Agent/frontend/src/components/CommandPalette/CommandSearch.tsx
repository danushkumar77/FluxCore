import React, { useRef, useEffect } from "react";
import { Search, Brain } from "lucide-react";

interface CommandSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const CommandSearch = ({ value, onChange }: CommandSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus search field on mount
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div className="flex items-center px-4 py-3.5 border-b border-white/5 bg-slate-950/40 shrink-0">
      <Search className="w-5 h-5 text-brand-cyan mr-3" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search pages, AI agents, assets, reports, simulations..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 font-sans text-xs focus:ring-0"
      />
      <div className="flex items-center space-x-1.5 text-slate-500 text-[9px] border border-white/5 px-2 py-0.5 rounded-md font-mono bg-black/45">
        <Brain className="w-3.5 h-3.5 text-brand-purple" />
        <span>AI Copilot</span>
      </div>
    </div>
  );
};
