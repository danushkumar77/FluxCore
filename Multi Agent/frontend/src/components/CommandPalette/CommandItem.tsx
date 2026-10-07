import React from "react";
import { FileText, Cpu, Play, FileSpreadsheet, Box, Settings, BookOpen, Wrench, Pin } from "lucide-react";
import { CommandData } from "./commandData";

interface CommandItemProps {
  command: CommandData;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const TYPE_ICONS: Record<string, any> = {
  page: FileText,
  agent: Cpu,
  simulation: Play,
  report: FileSpreadsheet,
  twin: Box,
  settings: Settings,
  knowledge: BookOpen,
  maintenance: Wrench
};

export const CommandItem = ({ command, isSelected, isFavorite, onSelect, onToggleFavorite }: CommandItemProps) => {
  const Icon = TYPE_ICONS[command.type] || FileText;

  return (
    <div
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition border font-mono text-[10px] ${
        isSelected
          ? "bg-brand-cyan/15 border-brand-cyan/25 text-white shadow-[0_0_12px_rgba(0,229,255,0.08)]"
          : "bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-white"
      }`}
    >
      <div className="flex items-center space-x-3 truncate">
        <div className={`p-1.5 rounded-lg border ${
          isSelected 
            ? "bg-brand-cyan/20 border-brand-cyan/30 text-brand-cyan" 
            : "bg-white/5 border-white/5 text-slate-500"
        }`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="truncate">
          <span className="font-bold block text-white text-[11px] truncate">{command.name}</span>
          <span className="text-[9px] text-slate-500 block truncate mt-0.5">{command.description}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {command.severity && (
          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${
            command.severity === "critical" 
              ? "bg-brand-rose/10 text-brand-rose border-brand-rose/25 animate-pulse" 
              : "bg-brand-amber/10 text-brand-amber border-brand-amber/25"
          }`}>
            {command.severity}
          </span>
        )}

        <button 
          onClick={onToggleFavorite}
          className={`p-1 hover:bg-white/10 rounded transition ${
            isFavorite ? "text-brand-amber" : "text-slate-600 hover:text-slate-400"
          }`}
        >
          <Pin className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
};
