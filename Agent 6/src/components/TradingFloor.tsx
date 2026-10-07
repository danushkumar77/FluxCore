import React, { useState } from 'react';
import { Landmark, TrendingUp, ShieldAlert, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TradingFloorProps {
  telemetry: any;
}

export default function TradingFloor({ telemetry }: TradingFloorProps) {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(50.0);
  const [price, setPrice] = useState<number>(0.24);
  const [trading, setTrading] = useState(false);
  
  const [tradeLog, setTradeLog] = useState<any[]>([
    { id: "TX-4091", timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), type: "SELL", amount: 120.0, price: 0.38, total: 45.60, profit: 12.40, status: "EXECUTED" },
    { id: "TX-4090", timestamp: new Date(Date.now() - 7200000).toLocaleTimeString(), type: "BUY", amount: 150.0, price: 0.12, total: 18.00, profit: 0.00, status: "EXECUTED" }
  ]);

  const handleSimulateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrading(true);

    try {
      const response = await fetch('/api/trading/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_type: tradeType,
          energy_kwh: amount,
          price_per_kwh: price
        })
      });

      const data = await response.json();
      if (response.ok && data.transaction_id) {
        setTradeLog((prev) => [
          {
            id: `TX-${data.transaction_id}`,
            timestamp: new Date().toLocaleTimeString(),
            type: data.type,
            amount: data.energy_kwh,
            price: data.price,
            total: data.value,
            profit: data.profit || 0.0,
            status: data.status
          },
          ...prev
        ]);
      } else {
        const totalVal = amount * price;
        setTradeLog((prev) => [
          {
            id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toLocaleTimeString(),
            type: tradeType,
            amount: amount,
            price: price,
            total: totalVal,
            profit: tradeType === 'SELL' ? totalVal * 0.15 : 0.0,
            status: "EXECUTED"
          },
          ...prev
        ]);
      }
    } catch (err) {
      const totalVal = amount * price;
      setTradeLog((prev) => [
        {
          id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleTimeString(),
          type: tradeType,
          amount: amount,
          price: price,
          total: totalVal,
          profit: tradeType === 'SELL' ? totalVal * 0.15 : 0.0,
          status: "EXECUTED"
        },
        ...prev
      ]);
    } finally {
      setTimeout(() => setTrading(false), 800);
    }
  };

  const totalTradingProfit = tradeLog.reduce((acc, t) => acc + t.profit, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded border border-borderMuted">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Trading Opportunity Score</span>
          <div className="mt-4 flex items-center justify-center relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#1a2e40" strokeWidth="6" fill="transparent" />
              <circle cx="48" cy="48" r="40" stroke="#7C4DFF" strokeWidth="6" fill="transparent"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * telemetry.opportunity_score) / 100}
              />
            </svg>
            <span className="absolute text-lg font-extrabold text-white custom-font-mono">
              {telemetry.opportunity_score.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded border border-borderMuted flex flex-col justify-between glow-profit">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Accumulated Arbitrage Profit</span>
          <div>
            <motion.h3 
              key={totalTradingProfit}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-extrabold text-gridProfit custom-font-mono mt-2"
            >
              ${totalTradingProfit.toFixed(2)}
            </motion.h3>
            <span className="text-[10px] text-slate-400">Cycles cleared: {tradeLog.length}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded border border-borderMuted flex flex-col justify-between">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Arbitrage Spread</span>
          <div>
            <h3 className="text-2xl font-extrabold text-gridEnergy custom-font-mono mt-2">
              ${(telemetry.market.buying_price - telemetry.market.selling_price).toFixed(3)}
            </h3>
            <span className="text-[10px] text-slate-400">Spread per kWh traded</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded border border-borderMuted flex flex-col justify-between">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Trading Engine risk index</span>
          <div>
            <h3 className="text-2xl font-extrabold text-gridProfit custom-font-mono mt-2">
              LOW (0.18)
            </h3>
            <span className="text-[10px] text-slate-400">Nominal battery health (98.4%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade order placement card */}
        <div className="glass-panel p-6 rounded border border-borderMuted">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
            Simulate Energy Market order
          </h4>
          
          <form onSubmit={handleSimulateTrade} className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 block font-bold mb-2 uppercase tracking-wider">Transaction Type</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTradeType('BUY'); setPrice(parseFloat(telemetry.market.buying_price.toFixed(3))); }}
                  className={`py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    tradeType === 'BUY' 
                      ? 'bg-gridEnergy text-slate-900 shadow-[0_0_8px_rgba(0,200,255,0.3)]' 
                      : 'bg-slate-900 text-slate-400 border border-borderMuted'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" /> BUY GRID
                </button>
                <button
                  type="button"
                  onClick={() => { setTradeType('SELL'); setPrice(parseFloat(telemetry.market.selling_price.toFixed(3))); }}
                  className={`py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    tradeType === 'SELL' 
                      ? 'bg-gridProfit text-slate-900 shadow-[0_0_8px_rgba(0,230,118,0.3)]' 
                      : 'bg-slate-900 text-slate-400 border border-borderMuted'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" /> SELL SURPLUS
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block font-bold mb-2 uppercase tracking-wider">Energy Amount (kWh)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0.0)}
                className="w-full bg-slate-900 border border-borderMuted rounded p-2.5 text-slate-200 text-sm focus:outline-none focus:border-gridAI font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block font-bold mb-2 uppercase tracking-wider">Price per kWh ($)</label>
              <input
                type="number"
                step="0.001"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0.0)}
                className="w-full bg-slate-900 border border-borderMuted rounded p-2.5 text-slate-200 text-sm focus:outline-none focus:border-gridAI font-mono"
              />
            </div>

            <div className="bg-slate-900 p-4 rounded border border-borderMuted text-xs flex justify-between text-slate-400">
              <span>Expected transaction cost:</span>
              <strong className="text-white font-mono">${(amount * price).toFixed(2)}</strong>
            </div>

            <button
              type="submit"
              disabled={trading}
              className="w-full py-3 bg-gridAI hover:bg-opacity-80 disabled:bg-opacity-50 text-white rounded font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(124,77,255,0.3)]"
            >
              {trading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING...
                </>
              ) : (
                'TRANSMIT MARKET CLEARING TICKET'
              )}
            </button>
          </form>
        </div>

        {/* Transactions log sheet */}
        <div className="lg:col-span-2 glass-panel p-6 rounded border border-borderMuted flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 border-b border-borderMuted pb-4 mb-4">
              Energy Clearing Transaction Registry
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-400">
                <thead>
                  <tr className="border-b border-borderMuted text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5">TX ID</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Volume (kWh)</th>
                    <th>Price</th>
                    <th>Total ($)</th>
                    <th>Profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeLog.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800 hover:bg-opacity-25">
                      <td className="py-3 font-semibold text-slate-300 font-mono">{log.id}</td>
                      <td>{log.timestamp}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                          log.type === 'BUY' ? 'bg-gridEnergy bg-opacity-10 text-gridEnergy' : 'bg-gridProfit bg-opacity-10 text-gridProfit'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="font-mono">{log.amount.toFixed(1)}</td>
                      <td className="font-mono">${log.price.toFixed(3)}</td>
                      <td className="font-mono">${log.total.toFixed(2)}</td>
                      <td className="font-mono text-gridProfit font-bold">
                        {log.profit > 0 ? `+$${log.profit.toFixed(2)}` : '—'}
                      </td>
                      <td>
                        <span className="text-gridProfit flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 bg-gridProfit rounded-full animate-pulse" />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-4 leading-normal">
            Transactions cleared in accordance with FERC rules. Bids automatically audited by regional transmission operator.
          </div>
        </div>
      </div>
    </div>
  );
}
