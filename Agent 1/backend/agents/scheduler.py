import asyncio
from utils.logger import get_logger
from agents.agent_state import agent_state_manager, AgentState
from agents.goal_manager import goal_manager
from agents.reflection_engine import reflection_engine
from database.models import Base, get_db
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

logger = get_logger("scheduler")

class AgentScheduler:
    """Orchestrates periodic background task loops for autonomous monitoring and self-reflection."""
    def __init__(self, agent_instance, session_factory: async_sessionmaker[AsyncSession]):
        self.agent = agent_instance
        self.session_factory = session_factory
        self.tasks = []
        self.running = False

    def start(self):
        if self.running:
            return
        self.running = True
        logger.info("Initializing background task loops.")
        self.tasks.append(asyncio.create_task(self.telemetry_ingest_loop()))
        self.tasks.append(asyncio.create_task(self.self_reflection_loop()))

    def stop(self):
        self.running = False
        for task in self.tasks:
            task.cancel()
        self.tasks = []
        logger.info("Background task loops stopped.")

    async def telemetry_ingest_loop(self):
        """Simulates autonomous grid status checking every 60 seconds."""
        while self.running:
            try:
                agent_state_manager.set_state(AgentState.MONITORING)
                logger.info("Scheduler: Reading grid telemetry feeds...")
                
                # Update default goals progress dynamically based on simulated state
                goal_manager.update_progress("stability", 100.0)
                goal_manager.update_progress("battery", 68.2, "Active")
                goal_manager.update_progress("renewables", 42.6, "Active")

                agent_state_manager.set_state(AgentState.IDLE)
            except Exception as e:
                logger.error(f"Error in telemetry loop: {e}")
                agent_state_manager.set_state(AgentState.ERROR)
            await asyncio.sleep(60)

    async def self_reflection_loop(self):
        """Runs model self-reflection accuracy audits every 15 minutes (scaled to 120s for demo)."""
        while self.running:
            await asyncio.sleep(120)
            try:
                agent_state_manager.set_state(AgentState.PREDICTING)
                logger.info("Scheduler: Executing self-reflection analysis...")
                async with self.session_factory() as session:
                    await reflection_engine.reflect_on_predictions(session)
                agent_state_manager.set_state(AgentState.IDLE)
            except Exception as e:
                logger.error(f"Error in self-reflection loop: {e}")
