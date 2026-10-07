from config.settings import settings
try:
    from google import genai
except ImportError:
    genai = None

class ReasoningEngine:
    def __init__(self):
        self.gemini_available = False
        self.client = None
        if genai and settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                self.gemini_available = True
            except:
                pass

    async def generate_reasoning(self, prediction_data: dict, input_data: dict) -> str:
        if self.gemini_available and self.client:
            try:
                sys_prompt = '''You are an experienced Electrical Grid Planning Engineer.
Explain electricity demand forecasts using prediction results, weather conditions, historical demand patterns, and renewable energy availability.
Never invent information. Keep explanations concise, technical, and actionable.
Respond in 2-3 sentences maximum.'''
                msg = f"Predicted demand: {prediction_data.get('prediction')} MW. Current load: {input_data.get('current_load')} MW. Temp: {input_data.get('temperature')} C. Renewable %: {input_data.get('renewable_percentage')}. Battery SOC: {input_data.get('battery_soc')}%. Risk: {prediction_data.get('risk')}."
                
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=msg,
                    config=genai.types.GenerateContentConfig(system_instruction=sys_prompt)
                )
                return response.text
            except Exception:
                pass
                
        # Fallback rule-based
        sentences = []
        temp = input_data.get('temperature', 25)
        if temp > 35: sentences.append('High temperatures are driving cooling demand.')
        if temp < 5: sentences.append('Cold temperatures are increasing heating demand.')
        if input_data.get('is_weekend'): sentences.append('Weekend reduces commercial/industrial loads.')
        hour = input_data.get('hour', 12)
        if (9 <= hour <= 12) or (17 <= hour <= 21): sentences.append('Peak business hours increase commercial consumption.')
        ren = input_data.get('renewable_percentage', 30)
        if ren < 20: sentences.append('Low renewable generation requires greater conventional supply.')
        if ren > 50: sentences.append('Strong renewable generation is offsetting conventional demand.')
        if input_data.get('battery_soc', 50) < 20: sentences.append('Battery reserves are critically low.')
        if prediction_data.get('prediction', 0) > input_data.get('current_load', 0):
            sentences.append('Demand is trending upward from current levels.')
            
        return ' '.join(sentences) if sentences else "Standard load patterns observed."
