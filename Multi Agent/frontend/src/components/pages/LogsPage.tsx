import React, { useState } from "react";
import { FileText, Search, Download, Trash2 } from "lucide-react";
import { MOCK_LOGS } from "../../services/mockData";

export const LogsPage = () => {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [exportedStatus, setExportedStatus] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.msg.toLowerCase().includes(search.toLowerCase()) || 
                          log.source.toLowerCase().includes(search.toLowerCase());
    const matchesSev = severityFilter === "all" || log.level === severityFilter;
    return matchesSearch && matchesSev;
  });

  const handleExport = () => {
    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 2000);
  };

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Search Toolbar */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search log messages, agent sources..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded py-2 pl-9 pr-4 text-xs text-white outline-none transition"
          />
        </div>

        <div className="flex space-x-2">
          {["all", "INFO", "WARNING", "ERROR"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition border ${
                severityFilter === sev 
                  ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40" 
                  : "bg-white/5 text-slate-400 border-white/5 hover:text-slate-300"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 border-l border-white/10 pl-3">
          <button 
            onClick={handleExport}
            className="bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded border border-white/10 transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportedStatus ? "EXPORTED!" : "EXPORT CSV"}</span>
          </button>
          <button 
            onClick={handleClear}
            className="bg-white/5 hover:bg-white/10 text-brand-rose px-3 py-1.5 rounded border border-brand-rose/20 transition flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* 2. Logs Board */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2 max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-semibold">
            No system log rows match your search filter settings.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="p-2 bg-slate-900/40 rounded border border-white/5 text-[10px] flex justify-between items-start gap-4">
              <div>
                <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                <span className={`font-bold mr-2 uppercase ${
                  log.level === "ERROR" 
                    ? "text-brand-rose" 
                    : log.level === "WARNING" 
                      ? "text-brand-amber" 
                      : "text-brand-emerald"
                }`}>
                  [{log.level}]
                </span>
                <span className="text-brand-cyan font-bold mr-2">{log.source}:</span>
                <span className="text-slate-300">{log.msg}</span>
              </div>
              <span className="text-slate-500 uppercase text-[9px]">{log.traceId}</span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
