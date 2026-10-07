import React from "react";
import { CommandCategory } from "./CommandCategory";
import { CommandItem } from "./CommandItem";
import { CommandData } from "./commandData";

interface CommandListProps {
  filteredCommands: CommandData[];
  selectedIndex: number;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectCommand: (cmd: CommandData) => void;
}

export const CommandList = ({
  filteredCommands,
  selectedIndex,
  favorites,
  onToggleFavorite,
  onSelectCommand
}: CommandListProps) => {
  if (filteredCommands.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-[10px] space-y-2 py-10">
        <span>No matching operational commands found.</span>
        <span className="text-[8px] text-slate-600">Try searching for "battery", "fault", or "dashboard"</span>
      </div>
    );
  }

  // Group commands by category
  const categories: Record<string, CommandData[]> = {};
  filteredCommands.forEach((cmd) => {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    categories[cmd.category].push(cmd);
  });

  // Keep track of the absolute list index
  let absoluteIndex = 0;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
      {Object.entries(categories).map(([catName, items]) => (
        <CommandCategory key={catName} name={catName}>
          {items.map((cmd) => {
            const currentAbsIndex = absoluteIndex;
            absoluteIndex++;
            const isSelected = currentAbsIndex === selectedIndex;
            const isFav = favorites.includes(cmd.id);

            return (
              <CommandItem
                key={cmd.id}
                command={cmd}
                isSelected={isSelected}
                isFavorite={isFav}
                onSelect={() => onSelectCommand(cmd)}
                onToggleFavorite={(e) => onToggleFavorite(cmd.id, e)}
              />
            );
          })}
        </CommandCategory>
      ))}
    </div>
  );
};
