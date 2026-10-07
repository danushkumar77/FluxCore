import React, { useState } from "react";
import { FileSpreadsheet, Download, FileText, CheckCircle, RefreshCw } from "lucide-react";

export const EnterpriseReporting = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [readyReport, setReadyReport] = useState<string | null>(null);

  const reportTypes = [
    { id: "daily", name: "Daily Grid Operations Summary", desc: "SCADA peaks, agent state counts, voltage logs." },
    { id: "weekly", name: "Weekly Reliability & Outage Audit", desc: "Outage risks index, transformer core oil diagnostics." },
    { id: "carbon", name: "Carbon Offsets & Renewable Performance", desc: "PV Solar and wind gen offsets vs local baseline emissions." },
    { id: "maintenance", name: "Predictive Asset Maintenance Forecast", desc: "Remaining Useful Life (RUL) indices for critical line relays." }
  ];

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setReadyReport(null);
    setTimeout(() => {
      setGenerating(null);
      setReadyReport(id);
    }, 1500);
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header description */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-2">
        <h3 className="text-xs font-bold uppercase text-brand-cyan tracking-wider flex items-center">
          <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Enterprise Report Engine
        </h3>
        <p className="text-[10px] text-slate-400">Compile high-integrity logs, carbon credits offset values, and forecasting accuracies into formatted reports.</p>
      </div>

      {/* 2. Reports builder grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((rep) => {
          const isGenerating = generating === rep.id;
          const isReady = readyReport === rep.id;

          return (
            <div key={rep.id} className="p-4 glass-panel rounded-xl border border-white/5 hover:border-brand-cyan/20 transition flex flex-col justify-between h-40">
              <div>
                <h4 className="font-bold text-white uppercase text-[10px]">{rep.name}</h4>
                <p className="text-[9px] text-slate-400 font-sans mt-1.5 leading-relaxed">{rep.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                {isGenerating ? (
                  <span className="text-[9px] text-brand-cyan animate-pulse flex items-center space-x-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling database...</span>
                  </span>
                ) : isReady ? (
                  <span className="text-[9px] text-brand-emerald flex items-center space-x-1.5 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Report Compiled!</span>
                  </span>
                ) : (
                  <span className="text-slate-500 text-[8px]">Ready to build</span>
                )}

                <div className="flex space-x-1">
                  {isReady ? (
                    <button 
                      onClick={() => alert(`Downloading ${rep.name} spreadsheet export...`)}
                      className="bg-brand-emerald hover:bg-brand-emerald/85 text-slate-950 px-2.5 py-1 rounded text-[9px] font-bold transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF/CSV</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleGenerate(rep.id)}
                      disabled={generating !== null}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded border border-white/10 text-[9px] font-bold disabled:opacity-50 transition"
                    >
                      Build Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
