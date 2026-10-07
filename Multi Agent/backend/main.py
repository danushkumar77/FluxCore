import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.api_gateway import router as api_router
from app.infrastructure.database.database import init_db
from app.core.event_bus import event_bus
from app.application.scheduler import scheduler
from app.application.notification import notification_engine
from app.application.workers.telemetry_worker import telemetry_worker
from app.core.orchestrator import orchestrator

# Import Agents to register in registry
from app.agents.demand_forecast import DemandForecastAgent
from app.agents.renewable_energy import RenewableEnergyAgent
from app.agents.battery_energy import BatteryEnergyAgent
from app.agents.grid_reliability import GridReliabilityAgent
from app.agents.predictive_maintenance import PredictiveMaintenanceAgent
from app.agents.economic_intelligence import EconomicIntelligenceAgent
from app.agents.cybersecurity import CybersecurityAgent
from app.agents.ev_coordination import EVCoordinationAgent
from app.agents.carbon_optimization import CarbonOptimizationAgent

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("FluxCore.Application")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Lifecycle ---
    logger.info("Starting FluxCore Platform Foundation...")
    
    # 1. Initialize SQLite database schemas
    await init_db()
    
    # 2. Start core services & engines
    event_bus.start()
    notification_engine.start()
    scheduler.start()
    
    # 3. Dynamic Discovery: Instantiate and register the 9 agents
    demand_agent = DemandForecastAgent()
    renewable_agent = RenewableEnergyAgent()
    battery_agent = BatteryEnergyAgent()
    reliability_agent = GridReliabilityAgent()
    maintenance_agent = PredictiveMaintenanceAgent()
    economic_agent = EconomicIntelligenceAgent()
    cybersecurity_agent = CybersecurityAgent()
    ev_agent = EVCoordinationAgent()
    carbon_agent = CarbonOptimizationAgent()

    orchestrator.register_agent(demand_agent)
    orchestrator.register_agent(renewable_agent)
    orchestrator.register_agent(battery_agent)
    orchestrator.register_agent(reliability_agent)
    orchestrator.register_agent(maintenance_agent)
    orchestrator.register_agent(economic_agent)
    orchestrator.register_agent(cybersecurity_agent)
    orchestrator.register_agent(ev_agent)
    orchestrator.register_agent(carbon_agent)

    
    # 4. Bootstrap Orchestrator (Starts all agents)
    await orchestrator.bootstrap()
    
    # 5. Start Telemetry background generator worker
    telemetry_worker.start()
    
    logger.info("FluxCore Platform successfully booted.")
    yield
    
    # --- Shutdown Lifecycle ---
    logger.info("Shutting down FluxCore Platform...")
    telemetry_worker.stop()
    await orchestrator.shutdown()
    await scheduler.stop()
    await event_bus.stop()
    logger.info("FluxCore Platform stopped.")

app = FastAPI(
    title="FluxCore Autonomous Multi-Agent Smart Grid Intelligence Platform",
    description="Enterprise-grade core foundation supporting multi-agent collaboration, event-driven telemetry and explainable reasoning.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in staging/production configuration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount central API Router
app.include_router(api_router, prefix="/api/v1")
