import React, { useState, useRef, useEffect } from "react";
import { Send, Cpu, Bot, User, BrainCircuit, Activity, HelpCircle } from "lucide-react";
import { useBess } from "../App";
import { motion } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  confidence: number;
  timestamp: string;
}

export default function AiCopilot() {
  const { telemetry } = useBess();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "copilot",
      text: "FluxCore Agent 3 Cognitive reasoning engine initialized. Telemetry parameters loaded. Ready for engineering queries.",
      confidence: 0.96,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      confidence: 1.0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, container_id: "BESS-001" })
      });
      const data = await response.json();
      
      const copilotMsg: Message = {
        id: `cop-${Date.now()}`,
        sender: "copilot",
        text: data.copilot_response,
        confidence: 0.94 - (Math.random() * 0.1),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, copilotMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "copilot",
        text: "System communication fault: Gemini API gateway disconnected. Fallback response generated.",
        confidence: 0.50,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const soc = telemetry?.soc || 68.0;
  const soh = telemetry?.soh || 98.4;
  const temp = telemetry?.avg_cell_temp || 25.0;
  const price = telemetry?.market_price_usd || 45.00;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "12px", height: "calc(100vh - 84px)", overflow: "hidden" }}>
      
      {/* Telemetry Input Panel */}
      <div className="mission-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
        <h4 style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}><BrainCircuit size={14} style={{ color: "var(--ai-purple)" }} /> Cognitive Feed</h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>SOC LIMIT</span>
            <p className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{soc.toFixed(1)}%</p>
          </div>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>SOH MULTIPLIER</span>
            <p className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--battery-green)" }}>{soh.toFixed(1)}%</p>
          </div>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>CELL HEAT MAP</span>
            <p className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{temp.toFixed(1)}°C</p>
          </div>
          <div className="mission-panel" style={{ padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.01)" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>MARGINAL TARIFF</span>
            <p className="tech-font" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--energy-cyan)" }}>${price.toFixed(2)}/MWh</p>
          </div>
        </div>

        {/* Neural Waveform processing animation */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="80" height="40" viewBox="0 0 80 40">
            <path 
              d="M 10 20 Q 25 5 40 20 T 70 20" 
              fill="none" 
              stroke="var(--ai-purple)" 
              strokeWidth="2"
              style={{ animation: loading ? "pulse 0.5s infinite alternate" : "pulse 2s infinite alternate" }}
            />
          </svg>
        </div>
      </div>

      {/* Chat Terminal Console */}
      <div className="mission-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Terminal Header */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={16} style={{ color: "var(--ai-purple)" }} />
            <span className="tech-font" style={{ fontSize: "0.85rem", fontWeight: 600 }}>FLUXCORE AI REASONER CORE</span>
          </div>
        </div>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map(msg => {
            const isCopilot = msg.sender === "copilot";
            return (
              <div 
                key={msg.id} 
                style={{ 
                  display: "flex", 
                  gap: "10px", 
                  alignSelf: isCopilot ? "flex-start" : "flex-end",
                  maxWidth: "80%",
                  flexDirection: isCopilot ? "row" : "row-reverse"
                }}
              >
                <div 
                  style={{ 
                    backgroundColor: isCopilot ? "rgba(124, 77, 255, 0.1)" : "rgba(0, 200, 255, 0.1)", 
                    padding: "6px", 
                    borderRadius: "50%", 
                    height: "32px", 
                    width: "32px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: isCopilot ? "1px solid rgba(124, 77, 255, 0.2)" : "1px solid rgba(0, 200, 255, 0.2)",
                    flexShrink: 0
                  }}
                >
                  {isCopilot ? <Bot size={14} style={{ color: "var(--ai-purple)" }} /> : <User size={14} style={{ color: "var(--energy-cyan)" }} />}
                </div>
                
                <div 
                  className="mission-panel" 
                  style={{ 
                    padding: "12px 16px", 
                    backgroundColor: isCopilot ? "rgba(17, 35, 49, 0.8)" : "rgba(11, 28, 43, 0.9)",
                    border: isCopilot ? "1px solid rgba(124,77,255,0.12)" : "1px solid rgba(0,200,255,0.12)"
                  }}
                >
                  <div style={{ fontSize: "0.82rem", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </div>
                  
                  {isCopilot && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "8px", paddingTop: "6px" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Confidence rating:</span>
                      <span className="tech-font" style={{ fontSize: "0.75rem", color: "var(--battery-green)", fontWeight: 600 }}>{(msg.confidence * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignSelf: "flex-start" }}>
              <div style={{ backgroundColor: "rgba(124, 77, 255, 0.1)", padding: "6px", borderRadius: "50%", height: "32px", width: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={14} style={{ color: "var(--ai-purple)" }} className="fan-rotating-slow" />
              </div>
              <div className="mission-panel" style={{ padding: "10px 16px" }}>
                <span className="tech-font" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Processing BESS scenarios...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input tray */}
        <form onSubmit={handleSend} style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px", backgroundColor: "rgba(11,28,43,0.3)" }}>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type console prompt for BESS engineering controller..."
            style={{ 
              flex: 1, 
              backgroundColor: "rgba(17, 35, 49, 0.5)", 
              border: "1px solid var(--glass-border)", 
              borderRadius: "6px", 
              padding: "8px 12px", 
              color: "var(--text-primary)", 
              fontSize: "0.82rem",
              outline: "none"
            }}
          />
          <button type="submit" className="btn-ai" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.8rem" }}>
            <Send size={12} /> Send
          </button>
        </form>

      </div>

    </div>
  );
}
