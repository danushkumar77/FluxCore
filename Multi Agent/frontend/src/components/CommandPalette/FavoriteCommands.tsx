import React from "react";
import { Pin } from "lucide-react";
import { CommandData } from "./commandData";

interface FavoriteCommandsProps {
  favorites: CommandData[];
  onSelect: (cmd: CommandData) => void;
}

export const FavoriteCommands = ({ favorites, onSelect }: FavoriteCommandsProps) => {
  if (favorites.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-white/5 bg-slate-900/20 flex items-center space-x-2 shrink-0 font-mono text-[9px]">
      <div className="flex items-center text-brand-amber space-x-1 font-bold uppercase shrink-0">
        <Pin className="w-3.5 h-3.5 fill-current" />
        <span>Favorites:</span>
      </div>
      <div className="flex flex-wrap gap-1.5 overflow-x-auto select-none">
        {favorites.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd)}
            className="px-2 py-0.5 bg-brand-amber/10 hover:bg-brand-amber/20 text-slate-300 hover:text-white rounded border border-brand-amber/20 transition cursor-pointer shrink-0"
          >
            {cmd.name}
          </button>
        ))}
      </div>
    </div>
  );
};
