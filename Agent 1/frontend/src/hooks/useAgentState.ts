import { useState, useEffect, useCallback } from 'react';
import { AgentStateSummary } from '../types';
import { getAgentState } from '../services/api';

export function useAgentState() {
  const [agentState, setAgentState] = useState<AgentStateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await getAgentState();
      setAgentState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agent state'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000); // 3s polling for real-time console logs
    return () => clearInterval(interval);
  }, [fetchState]);

  return { agentState, loading, error, refresh: fetchState };
}
