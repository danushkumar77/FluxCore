import time
from typing import Dict, Any

class AgentMetrics:
    def __init__(self):
        self.metrics_store = {
            "agent_latency_ms": 120.0,
            "gemini_response_time_ms": 850.0,
            "optimization_execution_time_ms": 15.0,
            "websocket_connections_count": 0,
            "total_api_requests": 0,
            "active_workers_health": "NOMINAL"
        }

    def record_latency(self, metric_name: str, duration_ms: float):
        self.metrics_store[metric_name] = round(duration_ms, 2)

    def increment(self, metric_name: str):
        if metric_name in self.metrics_store:
            self.metrics_store[metric_name] += 1
        else:
            self.metrics_store[metric_name] = 1

    def decrement(self, metric_name: str):
        if metric_name in self.metrics_store:
            self.metrics_store[metric_name] = max(0, self.metrics_store[metric_name] - 1)

    def get_snapshot(self) -> Dict[str, Any]:
        return self.metrics_store

# Global singleton
agent_metrics = AgentMetrics()
