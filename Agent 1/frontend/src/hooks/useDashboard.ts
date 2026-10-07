import { useState, useEffect, useCallback } from 'react';
import { DashboardSummary } from '../types';
import { getDashboardSummary } from '../services/api';

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDashboardSummary();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
