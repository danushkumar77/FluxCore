import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CommandSearch } from "./CommandSearch";
import { CommandList } from "./CommandList";
import { CommandFooter } from "./CommandFooter";
import { AISuggestions } from "./AISuggestions";
import { FavoriteCommands } from "./FavoriteCommands";
import { RecentCommands } from "./RecentCommands";
import { ALL_COMMANDS, CommandData } from "./commandData";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (action: string) => void;
}

export const CommandPalette = ({ isOpen, onClose, onExecuteCommand }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load favorites & recent from LocalStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem("flux_command_favs");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedRecents = localStorage.getItem("flux_command_recents");
    if (savedRecents) setRecentIds(JSON.parse(savedRecents));
  }, []);

  // Filter commands
  const filtered = ALL_COMMANDS.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  // Reset selection index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (cmd: CommandData) => {
    // Add to recents (max 20)
    const updatedRecents = [cmd.id, ...recentIds.filter((id) => id !== cmd.id)].slice(0, 20);
    setRecentIds(updatedRecents);
    localStorage.setItem("flux_command_recents", JSON.stringify(updatedRecents));

    onExecuteCommand(cmd.action);
    onClose();
    setQuery("");
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("flux_command_favs", JSON.stringify(updated));
  };

  // Map IDs to CommandData
  const favoriteCommands = ALL_COMMANDS.filter((cmd) => favorites.includes(cmd.id));
  const recentCommands = ALL_COMMANDS.filter((cmd) => recentIds.includes(cmd.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[900px] h-[600px] glass-panel rounded-[24px] border border-white/8 shadow-2xl flex flex-col overflow-hidden relative z-10"
          >
            {/* Search Input bar */}
            <CommandSearch value={query} onChange={setQuery} />

            {/* AI Suggestions autocomplete query row */}
            <AISuggestions query={query} onSelectSuggestion={setQuery} />

            {/* favorites row */}
            <FavoriteCommands favorites={favoriteCommands} onSelect={handleSelect} />

            {/* recent row */}
            <RecentCommands recent={recentCommands} onSelect={handleSelect} />

            {/* Scrollable list items */}
            <CommandList
              filteredCommands={filtered}
              selectedIndex={selectedIndex}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSelectCommand={handleSelect}
            />

            {/* Keyboard shortcut footer bar */}
            <CommandFooter />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
