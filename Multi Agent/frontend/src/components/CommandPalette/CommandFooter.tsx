import React from "react";

export const CommandFooter = () => {
  const keys = [
    { label: "↑↓", desc: "Navigate" },
    { label: "Enter", desc: "Execute" },
    { label: "Tab", desc: "Switch Category" },
    { label: "Esc", desc: "Dismiss" }
  ];

  return (
    <div className="flex items-center space-x-6 px-4 py-2.5 border-t border-white/5 bg-slate-950/60 shrink-0 font-mono text-[9px] text-slate-500">
      {keys.map((k, idx) => (
        <div key={idx} className="flex items-center space-x-1.5">
          <kbd className="bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded-md text-slate-400 font-bold">
            {k.label}
          </kbd>
          <span>{k.desc}</span>
        </div>
      ))}
      <span className="ml-auto text-slate-600 font-bold uppercase tracking-wider text-[8px]">
        FluxCore Command Engine v1.2
      </span>
    </div>
  );
};
