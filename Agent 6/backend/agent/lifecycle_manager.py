from backend.agent.agent_orchestrator import start_orchestrator, stop_orchestrator
from backend.event_bus.subscriber import setup_agent_subscriptions

class LifecycleManager:
    def __init__(self):
        pass

    def on_startup(self):
        """
        FastAPI startup handler. Initializes subscriptions, databases, and starts orchestrator loop.
        """
        print("[Lifecycle Manager] Bootstrapping Agent 6: Economic Intelligence...")
        setup_agent_subscriptions()
        start_orchestrator()
        print("[Lifecycle Manager] Agent 6 initialization sequence complete.")

    def on_shutdown(self):
        """
        FastAPI shutdown handler. Stops orchestrator thread gracefully.
        """
        print("[Lifecycle Manager] Initiating shutdown sequences...")
        stop_orchestrator()
        print("[Lifecycle Manager] Agent 6 shutdown sequence complete.")

# Global singleton
lifecycle_manager = LifecycleManager()
