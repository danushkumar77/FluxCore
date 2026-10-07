import time
import logging
from typing import Any, Optional, Dict
from app.core.config import get_settings

logger = logging.getLogger("FluxCore.Cache")

class CacheEntry:
    def __init__(self, value: Any, ttl_seconds: int):
        self.value = value
        self.expire_at = time.time() + ttl_seconds

    def is_expired(self) -> bool:
        return time.time() > self.expire_at

class EnterpriseCache:
    def __init__(self):
        # In-memory dictionary store
        self._store: Dict[str, CacheEntry] = {}
        settings = get_settings()
        self.redis_url = settings.REDIS_URL
        if self.redis_url:
            logger.info(f"Redis backend configured at {self.redis_url}. Ready for PostgreSQL/Redis migration.")
        else:
            logger.info("Using local in-memory storage for Enterprise Cache.")

    async def get(self, key: str) -> Optional[Any]:
        """Fetch item from cache. Checks expiration."""
        # Note: If Redis client is integrated later, we will fetch from Redis here.
        entry = self._store.get(key)
        if entry:
            if entry.is_expired():
                logger.debug(f"Cache expired for key: {key}")
                self._store.pop(key, None)
                return None
            return entry.value
        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set item in cache with TTL in seconds."""
        # Note: If Redis is integrated, set in Redis here.
        self._store[key] = CacheEntry(value, ttl_seconds)
        logger.debug(f"Cache set for key: {key} (TTL: {ttl_seconds}s)")

    async def delete(self, key: str):
        self._store.pop(key, None)

    # --- Domain Specific Cached Accessors ---
    
    async def get_cached_forecast(self, target_id: str, f_type: str) -> Optional[Any]:
        return await self.get(f"forecast_{target_id}_{f_type}")

    async def cache_forecast(self, target_id: str, f_type: str, data: Any, ttl: int = 120):
        await self.set(f"forecast_{target_id}_{f_type}", data, ttl)

    async def get_cached_telemetry(self, asset_id: str) -> Optional[Any]:
        return await self.get(f"telemetry_{asset_id}")

    async def cache_telemetry(self, asset_id: str, data: Any, ttl: int = 10):
        await self.set(f"telemetry_{asset_id}", data, ttl)

# Global instance for DI
cache_layer = EnterpriseCache()
