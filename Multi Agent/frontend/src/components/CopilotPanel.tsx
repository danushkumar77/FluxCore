import React, { useState } from "react";
import { Brain, Send, HelpCircle, ChevronRight, ChevronLeft, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface CopilotPanelProps {
  telemetry: any;
}

export const CopilotPanel = ({ telemetry }: CopilotPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "system",
      text: "FluxCore Copilot initialized. I have complete visibility over current SCADA parameters, model forecasts, and rule logs. Select a suggested request below or type a query.",
      timestamp: "21:30"
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const suggestions = [
    { text: "Explain Feeder 4 overcurrent trip", answer: "Grid Reliability Agent reports that Feeder Breaker 4 hit 112% overload due to a voltage sag on the substation grid path. BESS unit 1 was discharged at 4.0 MW to bypass load from the affected breaker while keeping safety trip thresholds compliant with IEEE-1547. Local cooling fan units were activated." },
    { text: "What is the BESS charging strategy?", answer: "Current Battery Energy strategy is set to Hold/Idle. Charge cycles are delayed because peak pricing is active ($42.50/MWh), preserving cell capacity and avoiding grid load overhead during transformer high temperature conditions (82C)." },
    { text: "Summarize today's solar performance", answer: "Renewable Intelligence Agent reports PV solar farms are running at +18.4 MW peak generation under optimal weather (650 W/m² solar irradiance), meeting 42.5% of total grid demand." }
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    setMessages(prev => [...prev, { sender: "user", text, timestamp: time }]);
    
    // Simulate AI / Rule Engine response
    setTimeout(() => {
      // Find matches in suggestions or default fallback
      const matchingSuggest = suggestions.find(s => text.toLowerCase().includes(s.text.toLowerCase().substring(0, 10)));
      const reply = matchingSuggest 
        ? matchingSuggest.answer 
        : `Rule Engine audit confirms voltage is nominal (${telemetry?.voltage_kv || 114.8} kV) and system health index stands at 98.2%. No safety parameters are bypassed. Recommended status: Hold current dispatch settings.`;
      
      setMessages(prev => [...prev, { sender: "copilot", text: reply, timestamp: time }]);
    }, 800);

    setInputValue("");
  };

  return (
    <div className="h-full flex relative shrink-0 z-40">
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -left-8 transform -translate-y-1/2 bg-slate-950/90 border border-r-0 border-white/5 p-2 rounded-l-xl text-brand-cyan hover:text-white transition flex items-center justify-center shadow-lg"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <Brain className="w-4 h-4 animate-pulse" />}
      </button>

      {/* Main drawer content */}
      <motion.div
        animate={{ width: isOpen ? 320 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full bg-slate-950/90 border-l border-white/5 overflow-hidden flex flex-col justify-between font-mono"
      >
        {isOpen && (
          <div className="h-full flex flex-col justify-between p-4 space-y-4">
            
            {/* Header info */}
            <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
              <Brain className="w-5 h-5 text-brand-cyan animate-pulse" />
              <div>
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">AI Operator Copilot</h4>
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
                  <span className="text-[8px] text-slate-500 uppercase font-bold">Rule Engine Auditing</span>
                </div>
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[10px] leading-relaxed scrollbar-thin">
              {messages.map((m, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border ${
                  m.sender === "user" 
                    ? "bg-brand-cyan/15 border-brand-cyan/20 text-white ml-6" 
                    : m.sender === "system"
                      ? "bg-white/5 border-white/10 text-slate-400"
                      : "bg-slate-900/60 border-white/5 text-slate-200 mr-6"
                }`}>
                  <div className="flex justify-between items-center mb-1 text-[8px] text-slate-500 font-bold">
                    <span>{m.sender.toUpperCase()}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <p className="font-sans">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Suggestions panel */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[8px] text-slate-500 uppercase block font-bold">Suggested Diagnostics</span>
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s.text)}
                    className="w-full text-left p-1.5 bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 rounded text-[9px] text-slate-300 hover:text-white transition truncate block"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input field */}
            <div className="flex gap-1.5 pt-2 border-t border-white/5">
              <input 
                type="text" 
                placeholder="Query grid status..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                className="flex-1 bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded px-2 py-1.5 text-[10px] text-white outline-none transition"
              />
              <button 
                onClick={() => handleSend(inputValue)}
                className="bg-brand-cyan hover:bg-brand-cyan/85 text-slate-950 p-2 rounded transition flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
};
