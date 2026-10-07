import { useState, useEffect, useCallback } from 'react';
import { PredictionResponse } from '../types';
import { getHistory } from '../services/api';

export function useHistory(pageSize = 10) {
  const [data, setData] = useState<PredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10); // Mock total pages

  const fetchHistory = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const result = await getHistory(pageSize, offset);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  return { data, loading, page, setPage, totalPages };
}
