import React from "react";
import { Clock } from "lucide-react";
import { CommandData } from "./commandData";

interface RecentCommandsProps {
  recent: CommandData[];
  onSelect: (cmd: CommandData) => void;
}

export const RecentCommands = ({ recent, onSelect }: RecentCommandsProps) => {
  if (recent.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-white/5 bg-slate-900/20 flex items-center space-x-2 shrink-0 font-mono text-[9px]">
      <div className="flex items-center text-brand-cyan space-x-1 font-bold uppercase shrink-0">
        <Clock className="w-3.5 h-3.5" />
        <span>Recent:</span>
      </div>
      <div className="flex flex-wrap gap-1.5 overflow-x-auto select-none">
        {recent.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd)}
            className="px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-white rounded border border-white/5 transition cursor-pointer shrink-0"
          >
            {cmd.name}
          </button>
        ))}
      </div>
    </div>
  );
};
