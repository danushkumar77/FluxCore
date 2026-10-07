import React, { useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AICopilotProps {
  telemetry: any;
}

export default function AICopilot({ telemetry }: AICopilotProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'assistant',
      text: telemetry.ai_reasoning || "Hello, I am the FluxCore Economic Brain. I continuously monitor market prices, weather conditions, and battery constraints to optimize operational costs. Ask me anything about current strategies.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const thinkingSteps = [
    "Analyzing energy price volatility map...",
    "Correlating Agent 1 demand forecasts with weather profiles...",
    "Querying battery state of charge (SoC) and cell degradation limits...",
    "Solving multi-objective mathematical objective function...",
    "Formulating economic strategy recommendations..."
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { sender: 'user', text: query, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setActiveStep(0);

    // Simulate progress checkmark step increments
    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setActiveStep(prev => prev + 1);
    }

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: data.response, timestamp: new Date().toLocaleTimeString() }
      ]);
    } catch (err) {
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `### ⚡ Gemini Local Heuristic Response\n\nUnder active parameters: Solar is contributing ${telemetry.market.solar_forecast} kW, and demand is ${telemetry.market.demand_forecast} kW. The optimal response to query is to sustain ${telemetry.chosen_strategy}. Let me know if you would like me to override weights.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Chat Panel */}
        <div className="lg:col-span-2 glass-panel rounded flex flex-col h-[540px]">
          <div className="p-4 border-b border-borderMuted flex items-center gap-2">
            <Bot className="w-5 h-5 text-gridAI animate-pulse" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
              AI Economist Chat Room
            </h4>
          </div>

          {/* Messages Scroller */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <AnimatePresence>
              {messages.map((m, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded p-4 text-xs leading-relaxed font-mono whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-gridAI bg-opacity-20 text-white border border-gridAI border-opacity-30 shadow-[0_0_8px_rgba(124,77,255,0.2)]'
                      : 'bg-slate-900 text-slate-300 border border-borderMuted border-l-4 border-l-gridAI'
                  }`}>
                    {m.text}
                    <span className="block text-[8px] text-slate-500 text-right mt-2">{m.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-borderMuted rounded p-4 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gridAI" />
                  Gemini reasoning: <em>{thinkingSteps[Math.min(activeStep, thinkingSteps.length - 1)]}</em>
                </div>
              </div>
            )}
          </div>

          {/* Input tray */}
          <form onSubmit={handleSend} className="p-4 border-t border-borderMuted flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the AI economist about arbitrage opportunities..."
              className="flex-1 bg-slate-900 border border-borderMuted rounded p-2.5 text-slate-200 text-xs focus:outline-none focus:border-gridAI font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 bg-gridAI hover:bg-opacity-80 text-white rounded flex items-center justify-center shadow-[0_0_8px_rgba(124,77,255,0.35)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right column: Thinking progress visual tree */}
        <div className="glass-panel p-6 rounded space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-glow-ai pointer-events-none opacity-40" />
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4">
            Reasoning Sequence Steps
          </h4>
          
          <div className="space-y-4">
            {thinkingSteps.map((step, index) => {
              const isChecked = index < activeStep;
              const isCurrent = index === activeStep && loading;
              
              let bubbleStyle = "bg-slate-800 text-slate-500 border-borderMuted";
              if (isChecked) bubbleStyle = "bg-gridProfit bg-opacity-20 text-gridProfit border-gridProfit border-opacity-35";
              if (isCurrent) bubbleStyle = "bg-gridAI bg-opacity-20 text-gridAI border-gridAI border-opacity-35 animate-pulse";

              return (
                <div key={index} className={`flex items-center gap-3 p-3 rounded border text-xs transition-colors duration-300 ${bubbleStyle}`}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono">
                    {isChecked ? '✓' : index + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
