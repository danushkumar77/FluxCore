class RecommendationEngine:
    def generate(self, risk_data: dict, input_data: dict) -> list[str]:
        recs = []
        risk = risk_data.get('risk', 'Low')
        
        if risk == 'Critical':
            recs.extend(['Activate emergency demand response protocols', 'Dispatch all available reserve generation', 'Coordinate with neighboring grid operators for emergency power import'])
        elif risk == 'High':
            recs.extend(['Increase battery discharge rate to maximum', 'Initiate voluntary industrial load curtailment', 'Pre-position maintenance crews at critical substations'])
        elif risk == 'Medium':
            recs.extend(['Optimize battery discharge scheduling', 'Monitor transformer loading levels closely', 'Prepare demand response program activation'])
        else:
            recs.extend(['Continue standard monitoring procedures', 'Optimize renewable energy integration', 'Schedule non-critical maintenance during off-peak hours'])
            
        if input_data.get('battery_soc', 50) > 60 and risk in ['High', 'Critical']:
            recs.append('Deploy battery storage reserves immediately')
        if input_data.get('renewable_percentage', 30) < 20:
            recs.append('Increase renewable energy dispatch priority')
        
        hour = input_data.get('hour', 12)
        is_peak = (9 <= hour <= 12) or (17 <= hour <= 21)
        if is_peak and risk_data.get('trend') == 'Increasing':
            recs.append('Implement real-time pricing signals to incentivize load shifting')
            
        temp = input_data.get('temperature', 25)
        if temp > 40 or temp < -10:
            recs.append('Issue public conservation advisory')
            
        if input_data.get('demand_response_event'):
            recs.append('Coordinate with enrolled demand response participants')
            
        return recs
