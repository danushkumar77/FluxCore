import { useState } from 'react';
import { PredictionRequest, PredictionResponse } from '../types';
import { predict as predictApi } from '../services/api';

export function usePrediction() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const predict = async (request: PredictionRequest) => {
    try {
      setLoading(true);
      setError(null);
      const res = await predictApi(request);
      setResult(res);
      return res;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Prediction failed');
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return { predict, result, loading, error };
}
