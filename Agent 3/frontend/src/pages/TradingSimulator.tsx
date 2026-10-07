import React, { useState, useEffect } from "react";
import { useBess } from "../App";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Landmark, RefreshCw, BarChart2 } from "lucide-react";

export default function TradingSimulator() {
  const { telemetry } = useBess();
  const [bids, setBids] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/battery/metrics")
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err));

    fetch("http://127.0.0.1:8000/battery/history?limit=10")
      .then(res => res.json())
      .then(data => {
        if (data.decisions) {
          const arbBids = data.decisions
            .filter((d: any) => d.selected_plan === "PLAN-B" || d.selected_plan === "PLAN-E" || d.selected_plan === "PLAN-A")
            .map((d: any) => ({
              id: d.decision_id.slice(0, 8),
              time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              plan: d.selected_plan === "PLAN-A" ? "Buy Grid (Charge)" : "Sell Grid (Discharge)",
              price: d.selected_plan === "PLAN-A" ? d.expected_cost : d.expected_revenue,
              profit: d.expected_revenue - d.expected_cost
            }));
          setBids(arbBids);
        }
      })
      .catch(err => console.error(err));
  }, [telemetry]);

  const totalRevenue = metrics?.cumulative_savings_usd || 185.50;
  const marketPrice = telemetry?.market_price_usd || 45.00;

  // Chart data: hourly price spreads
  const spreadData = [
    { hour: "02:00", price: 42.5 },
    { hour: "05:00", price: 38.0 },
    { hour: "08:00", price: 185.0 }, // Morning Peak
    { hour: "11:00", price: 12.0 },  // Solar surplus dip
    { hour: "14:00", price: -8.0 },  // Solar surplus peak negative pricing
    { hour: "17:00", price: 210.0 }, // Evening Peak
    { hour: "20:00", price: 175.0 },
    { hour: "23:00", price: 55.0 }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Financial Indicators */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        
        <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ backgroundColor: "rgba(0, 230, 118, 0.1)", padding: "12px", borderRadius: "8px" }}>
            <DollarSign size={28} style={{ color: "var(--battery-green)" }} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Cumulative Arbitrage Profit</span>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--battery-green)" }}>${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ backgroundColor: "rgba(0, 200, 255, 0.1)", padding: "12px", borderRadius: "8px" }}>
            <Landmark size={28} style={{ color: "var(--energy-cyan)" }} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Market Clearance Pricing</span>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>${marketPrice.toFixed(2)} / MWh</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ backgroundColor: "rgba(124, 77, 255, 0.1)", padding: "12px", borderRadius: "8px" }}>
            <BarChart2 size={28} style={{ color: "var(--ai-purple)" }} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Ancillary Bid Clears</span>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{bids.length} cleared</p>
          </div>
        </div>

      </div>

      {/* Grid Pricing Spread & Trade Bids list */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        
        {/* Real-time spreads Barchart */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3>Grid Locational Marginal Pricing Spreads</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Hourly marginal clearance clearing values.</p>
          <div style={{ height: "240px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spreadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--card-border)", borderRadius: "8px" }} />
                <Bar dataKey="price" fill="var(--energy-cyan)" radius={[4, 4, 0, 0]} name="Clearing Price ($/MWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cleared Arbitrage bids list */}
        <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "16px" }}>Ancillary cleared Bids log</h3>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px" }}>
            {bids.length > 0 ? (
              bids.map(bid => (
                <div key={bid.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{bid.plan}</span>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Tx: #{bid.id} | Time: {bid.time}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: bid.profit >= 0 ? "var(--battery-green)" : "var(--critical-red)" }}>
                      {bid.profit >= 0 ? `+$${bid.profit.toFixed(2)}` : `-$${Math.abs(bid.profit).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "40px 0" }}>
                No active arbitrage trades cleared in this cycle.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
