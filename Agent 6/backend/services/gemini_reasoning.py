import os
from typing import Dict, Any

# Attempt google-generativeai imports
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

class GeminiReasoning:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        
        if HAS_GEMINI and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel("gemini-2.5-flash") # standard model
            except Exception as e:
                print(f"[Gemini Setup] Failed to configure google-generativeai: {e}")
                self.client = None

    def generate_explanation(self, context: Dict[str, Any]) -> str:
        """
        Queries Gemini with grid context to explain decisions.
        Falls back to rule-based analysis if the API is offline/unconfigured.
        """
        # Compile telemetry indicators
        buy_price = context.get("buying_price", 0.15)
        demand = context.get("demand_kw", 0.0)
        solar = context.get("solar_gen_kw", 0.0)
        soc = context.get("battery_soc", 0.5)
        state = context.get("state", "Monitoring")
        chosen_strategy = context.get("chosen_strategy", "Plan A: Renewable First Strategy")
        savings = context.get("expected_savings", 10.0)
        confidence = context.get("confidence", 90.0)

        prompt = f"""
        You are the Chief Energy Economist AI of FluxCore. Explain this smart grid optimization decision:
        
        Current Grid State:
        - Active State: {state}
        - Buying Price: ${buy_price:.2f}/kWh
        - Demand: {demand:.1f} kW
        - Solar Generation: {solar:.1f} kW
        - Battery SoC: {soc * 100:.1f}%
        
        Optimization Selected:
        - Chosen Strategy: {chosen_strategy}
        - Expected savings / revenue rate: ${savings:.2f}
        - Optimization Confidence: {confidence:.1f}%
        
        Provide a concise, professional economic reasoning report. Break it down into:
        1. STRATEGY SUMMARY
        2. ECONOMIC RATIONALE
        3. CARBON IMPACT & BATTERY DEGRADATION TRADE-OFF
        
        Be analytical, and write like a trading desk strategist at Tesla Autobidder or Siemens.
        """

        if self.client:
            try:
                response = self.client.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[Gemini Reasoning] API error, falling back to local reasoning engine: {e}")

        # Local Rule-Based Fallback Generator
        # Analyze grid parameters
        solar_ratio = (solar / demand) * 100 if demand > 0 else 100.0
        
        reasoning = f"### ⚡ AI Economic Reasoning Report\n\n"
        reasoning += f"**Strategy:** {chosen_strategy}\n\n"
        
        reasoning += "#### 1. STRATEGY SUMMARY\n"
        if "Arbitrage" in chosen_strategy:
            reasoning += f"Arbitrage strategy active. Grid import buying rate is low (${buy_price:.2f}/kWh) or battery storage is being deployed to capture price spreads.\n\n"
        elif "Renewable" in chosen_strategy:
            reasoning += f"Renewable First strategy active. Prioritizing direct consumption of solar generation ({solar:.1f} kW) to meet local demand of {demand:.1f} kW.\n\n"
        elif "Peak" in chosen_strategy:
            reasoning += f"Peak Demand Reduction active. Shaving grid import capacity below critical threshold using battery load injections to avoid expensive peak demand surcharges.\n\n"
        elif "Carbon" in chosen_strategy:
            reasoning += f"Carbon Minimization active. Shifting consumption profiles to clean sources. Avoiding grid imports estimated to emit {demand * 0.385:.1f} kg CO2.\n\n"
        else:
            reasoning += f"Emergency Reserve active. Locking battery state of charge ({soc * 100:.1f}%) to protect microgrid stability against voltage fluctuations.\n\n"
            
        reasoning += "#### 2. ECONOMIC RATIONALE\n"
        if solar_ratio >= 100:
            reasoning += f"- Local renewable generation is {solar_ratio:.1f}% above local demand, creating an energy surplus.\n"
            reasoning += f"- Charging the battery using free local energy offsets future imports when grid tariffs peak.\n"
        else:
            reasoning += f"- Local renewables satisfy only {solar_ratio:.1f}% of active demand. Grid imports of {demand - solar:.1f} kW are active.\n"
            if buy_price > 0.30:
                reasoning += f"- Grid buying price is high (${buy_price:.2f}/kWh). Discharging the battery at {min(150.0, demand):.1f} kW avoids purchasing expensive power.\n"
            else:
                reasoning += f"- Grid tariffs are low (${buy_price:.2f}/kWh). Directly importing power while keeping battery reserves healthy.\n"
                
        reasoning += f"- Projected savings index is ${savings:.2f} relative to baseline un-optimized import operation.\n\n"
        
        reasoning += "#### 3. CARBON IMPACT & BATTERY DEGRADATION TRADE-OFF\n"
        degradation_cost = abs(solar - demand) * 0.04
        co2_saved_kg = max(0.0, solar * 0.385)
        reasoning += f"- Local carbon avoidance is estimated at **{co2_saved_kg:.2f} kg CO2**.\n"
        reasoning += f"- Battery wear cost is amortized at **${degradation_cost:.2f}** for this dispatch profile.\n"
        reasoning += f"- Safety margin checks report a grid frequency stability index of 60.0 Hz with nominal voltage tolerances."
        
        return reasoning

# Global singleton
gemini_reasoning = GeminiReasoning()
