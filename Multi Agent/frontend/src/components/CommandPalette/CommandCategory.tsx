import React from "react";

interface CommandCategoryProps {
  name: string;
  children: React.ReactNode;
}

export const CommandCategory = ({ name, children }: CommandCategoryProps) => {
  return (
    <div className="space-y-1.5 pt-2">
      <span className="px-3 text-[8px] text-slate-500 uppercase tracking-widest block font-bold font-mono">
        {name}
      </span>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};
