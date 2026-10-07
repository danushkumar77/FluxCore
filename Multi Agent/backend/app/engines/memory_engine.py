import logging
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.domain.contracts.memory import MemoryRecordModel

logger = logging.getLogger("FluxCore.MemoryEngine")

class MemoryEngine:
    def __init__(self):
        # In-memory storage for rapid search. Designed for future PG-Vector mapping.
        self._store: List[MemoryRecordModel] = []

    def store_record(self, agent_name: str, record_type: str, content: str, tags: List[str] = None, metadata: Dict[str, Any] = None, embedding: List[float] = None):
        """Persist a memory record into the system."""
        record = MemoryRecordModel(
            agent_name=agent_name,
            record_type=record_type,
            content=content,
            tags=tags or [],
            metadata=metadata or {},
            embedding_vector=embedding,
            timestamp=datetime.utcnow()
        )
        self._store.append(record)
        logger.debug(f"Saved memory record ({record.record_id}) for agent {agent_name} of type: {record_type}")
        return record

    def query_by_tags(self, tags: List[str], record_type: Optional[str] = None, limit: int = 10) -> List[MemoryRecordModel]:
        """Queries records that share any of the target tags, optionally filtered by type."""
        results = []
        target_set = set(tags)
        for rec in self._store:
            if record_type and rec.record_type != record_type:
                continue
            if target_set.intersection(rec.tags):
                results.append(rec)
            if len(results) >= limit:
                break
        return results

    def similarity_search(self, query_vector: List[float], record_type: Optional[str] = None, limit: int = 5) -> List[tuple[MemoryRecordModel, float]]:
        """
        Executes a vector cosine similarity search on the memory records using numpy.
        Returns a list of tuples containing (MemoryRecord, similarity_score).
        """
        if not self._store:
            return []

        scored_records = []
        q_vec = np.array(query_vector)
        q_norm = np.linalg.norm(q_vec)

        if q_norm == 0:
            return []

        for rec in self._store:
            if rec.embedding_vector is None:
                continue
            if record_type and rec.record_type != record_type:
                continue

            r_vec = np.array(rec.embedding_vector)
            r_norm = np.linalg.norm(r_vec)
            
            if r_norm == 0:
                continue

            # Cosine similarity
            similarity = float(np.dot(q_vec, r_vec) / (q_norm * r_norm))
            scored_records.append((rec, similarity))

        # Sort by similarity score descending
        scored_records.sort(key=lambda x: x[1], reverse=True)
        return scored_records[:limit]

    def clear(self):
        self._store.clear()

# Global instance for DI
memory_engine = MemoryEngine()
