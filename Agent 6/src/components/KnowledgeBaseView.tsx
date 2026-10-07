import React, { useState } from 'react';
import { Database, FileCode, Check } from 'lucide-react';

export default function KnowledgeBaseView() {
  const [selectedFile, setSelectedFile] = useState<string>('tariff_rules.json');

  const files: Record<string, any> = {
    'electricity_market_rules.json': {
      "market_name": "FluxCore Virtual Power Market",
      "currency": "USD",
      "market_structure": "Dual-participation (Grid Import/Export)",
      "bidding_interval_minutes": 5,
      "day_ahead_market_clearing_hour": 14,
      "price_caps": {
        "max_buy_price_per_kwh": 2.50,
        "min_buy_price_per_kwh": 0.01,
        "max_sell_price_per_kwh": 1.80,
        "min_sell_price_per_kwh": 0.00
      },
      "compliance_requirements": {
        "grid_code_standard": "IEEE-1547",
        "reactive_power_limits": [-0.9, 0.9]
      }
    },
    'tariff_rules.json': {
      "tariff_scheme": "Commercial Time-of-Use (TOU-8)",
      "peak_demand_charge_per_kw": 18.50,
      "net_metering_mode": "Net Billing (Avoided Cost)",
      "seasons": {
        "summer": {
          "months": [6, 7, 8, 9],
          "peak": {
            "hours": [16, 17, 18, 19, 20],
            "buy_rate": 0.48,
            "sell_rate": 0.12
          },
          "shoulder": {
            "hours": [8, 9, 10, 11, 12, 13, 14, 15, 21, 22],
            "buy_rate": 0.28,
            "sell_rate": 0.08
          },
          "off_peak": {
            "hours": [0, 1, 2, 3, 4, 5, 6, 7, 23],
            "buy_rate": 0.12,
            "sell_rate": 0.04
          }
        }
      }
    },
    'energy_trading_rules.json': {
      "trading_allowed": true,
      "supported_markets": ["Day-Ahead", "Real-Time", "Ancillary Services"],
      "commission_fee_pct": 0.005,
      "min_trade_volume_kwh": 10.0,
      "max_trade_volume_kwh": 5000.0,
      "arbitrage_rules": {
        "min_price_spread_margin": 0.05,
        "max_daily_trades_per_asset": 24
      }
    },
    'carbon_rules.json': {
      "grid_carbon_intensity_kg_co2_per_kwh": 0.385,
      "solar_carbon_intensity_kg_co2_per_kwh": 0.045,
      "wind_carbon_intensity_kg_co2_per_kwh": 0.012,
      "carbon_credit_value_usd_per_kg": 0.025,
      "compliance": {
        "minimum_renewable_mix_pct": 50.0,
        "penalty_per_excess_kg_co2": 0.08
      }
    },
    'optimization_constraints.json': {
      "battery_constraints": {
        "min_soc": 0.15,
        "max_soc": 0.95,
        "emergency_min_soc": 0.10,
        "degradation_cost_factor_per_cycle_kwh": 0.042,
        "efficiency_charge": 0.92,
        "efficiency_discharge": 0.92
      },
      "grid_constraints": {
        "max_import_limit_kw": 2500.0,
        "max_export_limit_kw": 1500.0
      },
      "optimization_weights": {
        "operational_cost": 1.0,
        "battery_degradation": 0.6,
        "carbon_emissions": 0.4,
        "grid_stability_penalty": 0.8
      }
    },
    'grid_operation_rules.json': {
      "safety_margins": {
        "voltage_dev_limit_pct": 5.0,
        "frequency_dev_limit_hz": 0.2
      },
      "operational_modes": {
        "emergency_reserve_hours": 2.0,
        "black_start_capability": true
      },
      "load_shedding": {
        "load_shed_threshold_kw": 2200.0,
        "non_critical_shed_multiplier": 0.3
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="bg-gridLightDark p-6 rounded border border-borderMuted">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-gridAI" />
          Economic Rule Knowledge Center
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Policy limits, market frameworks, and operating regulations loaded dynamically by the reasoning loop.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left selector sidebar */}
        <div className="space-y-2">
          {Object.keys(files).map((filename) => {
            const isSelected = selectedFile === filename;
            return (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`w-full text-left p-3 rounded text-xs font-semibold flex items-center justify-between border transition-all ${
                  isSelected 
                    ? 'bg-gridAI bg-opacity-10 border-gridAI text-white' 
                    : 'bg-gridLightDark border-borderMuted text-slate-400 hover:border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileCode className={`w-4 h-4 ${isSelected ? 'text-gridAI' : 'text-slate-500'}`} />
                  {filename}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-gridAI" />}
              </button>
            );
          })}
        </div>

        {/* Right formatted JSON editor panel */}
        <div className="lg:col-span-3 bg-gridLightDark p-6 rounded border border-borderMuted flex flex-col">
          <div className="flex items-center justify-between border-b border-borderMuted pb-4 mb-4">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">File view: {selectedFile}</span>
            <span className="text-[10px] bg-slate-900 border border-borderMuted px-2 py-0.5 rounded text-slate-500 font-mono">
              READ_ONLY
            </span>
          </div>

          <pre className="flex-1 bg-slate-900 p-6 rounded border border-borderMuted text-xs leading-relaxed text-gridEnergy overflow-auto font-mono max-h-[480px]">
            <code>{JSON.stringify(files[selectedFile], null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
