import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { Database, Search, Award, RefreshCw, AlertCircle } from "lucide-react";

export default function MemoryExplorer() {
  const { telemetry } = useBess();
  const [lessons, setLessons] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLessons = async (searchVal: string = "") => {
    setLoading(true);
    try {
      const url = searchVal 
        ? `http://127.0.0.1:8000/battery/lessons?query=${encodeURIComponent(searchVal)}`
        : "http://127.0.0.1:8000/battery/lessons";
      const res = await fetch(url);
      const data = await res.json();
      setLessons(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons(query);
  }, [query, telemetry]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Search Input Bar */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search operational memory cache (e.g. 'solar', 'temperature', 'arbitrage')..."
            style={{ 
              width: "100%",
              backgroundColor: "rgba(17, 35, 49, 0.6)", 
              border: "1px solid var(--card-border)", 
              borderRadius: "8px", 
              padding: "10px 16px 10px 42px", 
              color: "var(--text-primary)", 
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
        </div>
        <button onClick={() => fetchLessons(query)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
          <RefreshCw size={14} /> Sync Memory
        </button>
      </div>

      {/* Memory list */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Database size={18} style={{ color: "var(--energy-cyan)" }} /> Lessons Learned database</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {lessons.length > 0 ? (
            lessons.map(les => {
              const error = les.expected_vs_actual_error || 0.0;
              const hasError = Math.abs(error) > 5.0;
              
              return (
                <div 
                  key={les.lesson_id} 
                  className="glass-panel" 
                  style={{ 
                    padding: "16px",
                    border: hasError ? "1px solid rgba(255, 152, 0, 0.25)" : "1px solid rgba(0, 200, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.01)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginBottom: "10px" }}>
                    <div>
                      <span className="status-badge badge-nominal" style={{ fontSize: "0.65rem" }}>{les.condition_type}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "10px" }}>ID: {les.lesson_id} | Time: {new Date(les.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {hasError && <AlertCircle size={14} style={{ color: "var(--warning-orange)" }} />}
                      <span style={{ fontSize: "0.75rem", color: hasError ? "var(--warning-orange)" : "var(--text-secondary)" }}>
                        Forecast Delta: ${error.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem" }}>
                    <p><span style={{ color: "var(--text-secondary)" }}>Action Decision:</span> <strong>{les.decision_made}</strong></p>
                    <p><span style={{ color: "var(--text-secondary)" }}>Calculated Outcome:</span> {les.outcome}</p>
                    <p style={{ marginTop: "4px", color: "var(--battery-green)", fontWeight: 500 }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Lesson Learned:</span> "{les.lesson_learned}"
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No memories matching search query. Ensure the background workers have completed reflection sweeps.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
