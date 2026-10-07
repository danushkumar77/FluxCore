import React, { useState, useRef, useEffect } from "react";
import { Terminal, Send, Cpu, User } from "lucide-react";

export default function AICopilot({ chatLog, onSendMessage, isWaiting }) {
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);

  const samplePrompts = [
    "Why did generation decrease?",
    "Why was this strategy selected?",
    "What happens if weather changes?",
    "How can carbon reduction improve?"
  ];

  const handleSend = (text) => {
    if (!text.trim() || isWaiting) return;
    onSendMessage(text);
    setInputText("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", height: "100vh" }}>
      
      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minHeight: "450px" }}>
        
        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={18} style={{ color: "var(--color-ai)" }} />
            Renewable AI Copilot Engineer
          </h2>
          <span style={{ fontSize: "11px", color: "var(--color-ai)", fontWeight: "bold" }}>Gemini Client</span>
        </div>

        {/* Messages timeline */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "10px",
          background: "rgba(0,0,0,0.15)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.03)"
        }}>
          {chatLog.map((chat, idx) => {
            const isOperator = chat.sender === "operator";
            return (
              <div 
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: isOperator ? "flex-end" : "flex-start",
                  gap: "10px",
                  alignItems: "flex-start"
                }}
              >
                {!isOperator && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(124, 77, 255, 0.15)", border: "1px solid rgba(124, 77, 255, 0.3)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                    <Cpu size={14} style={{ color: "var(--color-ai)" }} />
                  </div>
                )}
                
                <div style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: isOperator ? "1px solid rgba(0, 200, 255, 0.2)" : "1px solid rgba(124, 77, 255, 0.2)",
                  background: isOperator ? "rgba(0, 45, 40, 0.6)" : "rgba(11, 45, 40, 0.5)",
                  color: "#FFF",
                  fontSize: "13px",
                  lineHeight: "1.4"
                }}>
                  {chat.text}
                </div>

                {isOperator && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0, 200, 255, 0.15)", border: "1px solid rgba(0, 200, 255, 0.3)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                    <User size={14} style={{ color: "var(--color-wind)" }} />
                  </div>
                )}
              </div>
            );
          })}
          
          {isWaiting && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(124, 77, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cpu size={14} className="rotate-turbine" style={{ color: "var(--color-ai)" }} />
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>AI Copilot is composing response...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Shortcut Quick Prompts */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isWaiting}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                padding: "8px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "var(--color-ai)"; e.target.style.color = "#FFF"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.05)"; e.target.style.color = "var(--text-secondary)"; }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Ask Copilot a grid question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
            disabled={isWaiting}
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#FFF",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              outline: "none"
            }}
          />
          <button
            onClick={() => handleSend(inputText)}
            disabled={isWaiting}
            style={{
              padding: "12px 24px",
              background: "var(--color-ai)",
              border: "none",
              borderRadius: "8px",
              color: "#FFF",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Send size={14} /> Send
          </button>
        </div>

      </div>
    </div>
  );
}
