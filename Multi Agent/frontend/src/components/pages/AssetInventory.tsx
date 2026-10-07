import React, { useState } from "react";
import { Folder, Search, CheckCircle, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { MOCK_ASSETS, MockAsset } from "../../services/mockData";

export const AssetInventory = () => {
  const [assets, setAssets] = useState<MockAsset[]>(MOCK_ASSETS);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MockAsset | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = assets.filter((ast) => {
    const matchesSearch = ast.name.toLowerCase().includes(search.toLowerCase()) || 
                          ast.id.toLowerCase().includes(search.toLowerCase()) ||
                          ast.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || ast.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Search Toolbar */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assets by ID, name, manufacturer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded py-2 pl-9 pr-4 text-xs text-white outline-none transition"
          />
        </div>

        <div className="flex space-x-1">
          {["all", "active", "maintenance", "offline"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition ${
                statusFilter === st 
                  ? "bg-brand-cyan text-slate-950" 
                  : "bg-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Content splits */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* Assets Table (3-cols wide) */}
        <div className="xl:col-span-3 p-4 glass-panel rounded-xl border border-white/5 space-y-3 h-[420px] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
            <Folder className="w-4 h-4 mr-1.5" /> Physical Grid Infrastructure
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-2">Asset Name</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Health Score</th>
                  <th className="pb-2">RUL</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((ast) => (
                  <tr 
                    key={ast.id} 
                    onClick={() => setSelectedAsset(ast)}
                    className="hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-2.5 text-white font-semibold">{ast.name}</td>
                    <td className="py-2.5 text-slate-400">{ast.type}</td>
                    <td className="py-2.5 text-slate-400">{ast.location}</td>
                    <td className="py-2.5 text-brand-emerald font-bold">{ast.healthScore}%</td>
                    <td className="py-2.5 text-slate-300">{ast.rulYears} Years</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        ast.status === "active" 
                          ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20" 
                          : ast.status === "maintenance"
                            ? "bg-brand-amber/10 text-brand-amber border-brand-amber/20"
                            : "bg-brand-rose/10 text-brand-rose border-brand-rose/20 animate-pulse"
                      }`}>
                        {ast.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Asset Details (1-col wide) */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 h-[420px] flex flex-col justify-between">
          {selectedAsset ? (
            <div className="space-y-3">
              <div className="border-b border-white/5 pb-2">
                <span className="text-[8px] text-slate-500 font-bold block uppercase">ASSET METADATA</span>
                <h4 className="font-bold text-white uppercase text-[10px] mt-1">{selectedAsset.name}</h4>
              </div>

              <div className="space-y-2 text-[10px] leading-relaxed pt-1">
                <p className="text-slate-400"><strong>Asset ID:</strong> {selectedAsset.id}</p>
                <p className="text-slate-400"><strong>Manufacturer:</strong> {selectedAsset.manufacturer}</p>
                <p className="text-slate-400"><strong>Installation Date:</strong> {selectedAsset.installedDate}</p>
                <p className="text-slate-400"><strong>Warranty Expiry:</strong> {selectedAsset.warrantyUntil}</p>
                <p className="text-slate-400"><strong>Last Maintenanced:</strong> {selectedAsset.lastMaintenance}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-slate-500 font-semibold leading-relaxed">
              Select any inventory line to audit warranty dates and engineering metadata.
            </div>
          )}

          <div className="pt-3 border-t border-white/5 text-[9px] text-slate-500 flex justify-between items-center">
            <span>Asset Registry Synced</span>
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};
