import React, { useState, useEffect } from "react";
import { LineChart, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, ShieldAlert, Cpu } from "lucide-react";

export default function ModelMonitoring() {
  const [modelInfo, setModelInfo] = useState(null);
  
  useEffect(() => {
    fetch("http://127.0.0.1:8001/model-info")
      .then(res => res.json())
      .then(data => setModelInfo(data))
      .catch(err => console.error("Error loading model metrics:", err));
  }, []);

  const importanceData = [];
  if (modelInfo) {
    // Collect solar features
    Object.entries(modelInfo.solar.feature_importance).slice(0, 5).forEach(([name, val]) => {
      importanceData.push({ name: `${name} (Solar)`, Weight: val });
    });
    // Collect wind features
    Object.entries(modelInfo.wind.feature_importance).slice(0, 5).forEach(([name, val]) => {
      importanceData.push({ name: `${name} (Wind)`, Weight: val });
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", padding: "20px", overflowY: "auto", height: "100vh" }}>
      
      {/* Metrics Card */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} style={{ color: "var(--color-wind)" }} />
          XGBoost Regressor Model Performance
        </h3>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "12px" }}>Model</th>
                <th style={{ padding: "12px" }}>Mean Absolute Error (MAE)</th>
                <th style={{ padding: "12px" }}>RMSE</th>
                <th style={{ padding: "12px" }}>MAPE</th>
                <th style={{ padding: "12px" }}>R² Validation Score</th>
                <th style={{ padding: "12px" }}>Tuning Estimators</th>
              </tr>
            </thead>
            <tbody>
              {modelInfo ? (
                ["solar", "wind", "hydro"].map(key => (
                  <tr key={key} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "16px 12px", fontWeight: "bold", textTransform: "uppercase" }}>{key} Forecast</td>
                    <td style={{ padding: "16px 12px", fontFamily: "var(--font-mono)" }}>{modelInfo[key].mae.toFixed(2)} kW</td>
                    <td style={{ padding: "16px 12px", fontFamily: "var(--font-mono)" }}>{modelInfo[key].rmse.toFixed(2)}</td>
                    <td style={{ padding: "16px 12px", fontFamily: "var(--font-mono)" }}>{modelInfo[key].mape.toFixed(2)}%</td>
                    <td style={{ padding: "16px 12px", fontWeight: "bold", color: "var(--color-battery)" }}>
                      {modelInfo[key].r2.toFixed(4)}
                    </td>
                    <td style={{ padding: "16px 12px", color: "var(--text-secondary)" }}>
                      n_est: {modelInfo[key].best_params.n_estimators}, depth: {modelInfo[key].best_params.max_depth}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: "20px", textStyle: "center", color: "var(--text-secondary)" }}>
                    Loading model verification metrics...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
        
        {/* Recharts chart */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "320px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "bold" }}>Feature Importance Weight (Top 10)</h3>
          <div style={{ flex: 1, width: "100%", fontSize: "10px" }}>
            {importanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importanceData} layout="vertical" margin={{ left: 50, right: 10 }}>
                  <XAxis type="number" stroke="var(--text-secondary)" />
                  <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={120} />
                  <Tooltip contentStyle={{ background: "#0B2D28", border: "1px solid rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="Weight" fill="var(--color-wind)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
                Loading importance data...
              </div>
            )}
          </div>
        </div>

        {/* Model Drift description */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
            <Cpu size={16} style={{ color: "var(--color-ai)" }} />
            Model Drift & Retraining Core
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4" }}>
            Model drift tracking audits active generation errors. If the running MAE deviation exceeds 15% compared to baseline validation parameters over 24 consecutive loops, a retraining trigger signal is dispatched to the model training pipeline.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", background: "rgba(255,255,255,0.02)", padding: "10px", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px" }} className="mono">
            <div>Baseline Retraining Threshold: 15%</div>
            <div>Drift Audit Period: 24 Cycles (12 Minutes)</div>
            <div>Retraining Script: backend/ml/train_models.py</div>
          </div>
        </div>

      </div>

    </div>
  );
}
