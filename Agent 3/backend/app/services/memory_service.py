from typing import List, Dict, Any
from backend.app.domain.interfaces import MemoryRepository

class MemoryService:
    def __init__(self, memory_repo: MemoryRepository):
        self.memory_repo = memory_repo

    async def record_lesson(self, lesson: Dict[str, Any]) -> None:
        await self.memory_repo.save_lesson(lesson)

    async def get_all_lessons(self, limit: int = 100) -> List[Dict[str, Any]]:
        return await self.memory_repo.get_all_lessons(limit)

    async def search_memory(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        return await self.memory_repo.search_lessons(query, limit)
