import React, { useState } from "react";
import { Database, Search, Cpu, Activity, Clock } from "lucide-react";
import { MOCK_MEMORY } from "../../services/mockData";

export const MemoryEngine = () => {
  const [queryText, setQueryText] = useState("");
  const [similarityResults, setSimilarityResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSimilaritySearch = () => {
    if (!queryText.trim()) return;
    setSearching(true);
    
    // Simulate vector cosine search calculations
    setTimeout(() => {
      const results = MOCK_MEMORY.map((mem) => {
        // Calculate a mock similarity index based on string matching overlaps
        let score = 0.45;
        const queryWords = queryText.toLowerCase().split(" ");
        const contentWords = mem.content.toLowerCase().split(" ");
        const overlap = queryWords.filter(w => contentWords.includes(w)).length;
        if (overlap > 0) {
          score = Math.min(0.98, 0.65 + overlap * 0.1);
        }
        return { ...mem, score };
      }).sort((a, b) => b.score - a.score);
      
      setSimilarityResults(results);
      setSearching(false);
    }, 600);
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Vector Search Query Input */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
        <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
          <Database className="w-4 h-4 mr-1.5" /> Semantic Vector Memory Search
        </h3>
        <p className="text-[10px] text-slate-400">Query the memory index using text questions (simulates 512-dimension cosine distance embeddings).</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="e.g. BESS overload temperature warning..." 
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="flex-1 bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded py-2 px-3 text-xs text-white outline-none transition"
          />
          <button 
            onClick={handleSimilaritySearch}
            className="bg-brand-cyan hover:bg-brand-cyan/80 text-slate-950 px-4 py-2 rounded text-xs font-bold transition"
          >
            {searching ? "Calculating..." : "Query Vector Index"}
          </button>
        </div>
      </div>

      {/* 2. Search Results / Memory Log list */}
      <div className="grid grid-cols-1 gap-3">
        {similarityResults.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider">Vector Search Results (Sorted by Cosine Distance)</h4>
            {similarityResults.map((rec, i) => (
              <div key={i} className="p-4 glass-panel rounded-xl border border-brand-cyan/20 flex flex-wrap justify-between items-center gap-3">
                <div className="flex-1 min-w-[280px] space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] uppercase bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded font-bold">
                      {rec.type.replace("_", " ")}
                    </span>
                    <span className="text-slate-500 text-[10px]">[{new Date(rec.timestamp).toLocaleDateString()}]</span>
                  </div>
                  <p className="text-slate-200 font-sans text-[11px] leading-relaxed">{rec.content}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-brand-cyan block">Similarity Score</span>
                  <span className="text-sm font-bold text-white">{rec.score.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chronological Memory Records</h4>
            {MOCK_MEMORY.map((rec, i) => (
              <div key={i} className="p-3.5 glass-panel rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="uppercase text-brand-purple font-semibold bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded">
                    {rec.type.replace("_", " ")}
                  </span>
                  <span className="text-slate-500 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(rec.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 font-sans text-[11px] leading-relaxed">{rec.content}</p>
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {rec.tags.map((t, idx) => (
                    <span key={idx} className="text-[8px] bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
