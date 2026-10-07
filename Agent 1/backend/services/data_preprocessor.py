class DataPreprocessor:
    def preprocess(self, data: dict) -> dict:
        processed = data.copy()
        
        season_map = {'spring': 0, 'summer': 1, 'autumn': 2, 'winter': 3}
        if 'season' in processed and isinstance(processed['season'], str):
            processed['season'] = season_map.get(processed['season'].lower(), 1)
            
        for k, v in processed.items():
            if isinstance(v, bool):
                processed[k] = 1 if v else 0
                
        return processed
