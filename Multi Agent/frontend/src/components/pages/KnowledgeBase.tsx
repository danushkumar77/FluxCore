import React, { useState } from "react";
import { BookOpen, Search, Filter, HelpCircle, HardDrive } from "lucide-react";
import { MOCK_KNOWLEDGE } from "../../services/mockData";

export const KnowledgeBase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredRules = MOCK_KNOWLEDGE.filter((rule) => {
    const matchesSearch = rule.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rule.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "all" || rule.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ["all", "interconnection", "battery", "grid", "safety", "emergency"];

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Search Toolbar */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search IEEE/IEC standards, safety codes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded py-2 pl-9 pr-4 text-xs text-white outline-none transition"
          />
        </div>

        <div className="flex space-x-1 overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition ${
                selectedCategory === cat 
                  ? "bg-brand-cyan text-slate-950" 
                  : "bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Rules List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredRules.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-slate-500 font-semibold">
            No standards or rules matched your query.
          </div>
        ) : (
          filteredRules.map((rule, idx) => (
            <div key={idx} className="p-4 glass-panel rounded-xl border border-white/5 hover:border-brand-cyan/20 transition flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-brand-cyan font-bold bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded">
                    {rule.code}
                  </span>
                  <span className="text-[9px] uppercase text-slate-500">{rule.category}</span>
                </div>
                <h4 className="font-bold text-white mb-2">{rule.title}</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">{rule.description}</p>
              </div>

              <div className="pt-2 border-t border-white/5 text-[9px] text-slate-500">
                Parameters: {JSON.stringify(rule.parameters)}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
