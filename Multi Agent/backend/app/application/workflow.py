import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Callable, Awaitable, Optional
from uuid import UUID, uuid4

logger = logging.getLogger("FluxCore.WorkflowEngine")

class WorkflowStep:
    def __init__(self, name: str, execute_func: Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]], rollback_func: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None, is_approval_gate: bool = False):
        self.name = name
        self.execute_func = execute_func
        self.rollback_func = rollback_func
        self.is_approval_gate = is_approval_gate

class WorkflowInstance:
    def __init__(self, workflow_id: UUID, template_name: str, steps: List[WorkflowStep], context: Dict[str, Any]):
        self.workflow_id = workflow_id
        self.template_name = template_name
        self.steps = steps
        self.context = context
        self.status = "pending"  # pending, running, paused_for_approval, completed, failed, rolled_back
        self.current_step_index = 0
        self.execution_history: List[Dict[str, Any]] = []

class WorkflowEngine:
    def __init__(self):
        self._instances: Dict[UUID, WorkflowInstance] = {}

    def create_workflow(self, template_name: str, steps: List[WorkflowStep], initial_context: Dict[str, Any]) -> WorkflowInstance:
        wf_id = uuid4()
        instance = WorkflowInstance(wf_id, template_name, steps, initial_context)
        self._instances[wf_id] = instance
        logger.info(f"Workflow '{template_name}' instance created: {wf_id}")
        return instance

    async def execute_workflow(self, workflow_id: UUID) -> WorkflowInstance:
        """Starts or resumes execution of a workflow instance."""
        instance = self._instances.get(workflow_id)
        if not instance:
            raise ValueError(f"Workflow instance {workflow_id} not found.")

        if instance.status in ["completed", "failed", "rolled_back"]:
            return instance

        instance.status = "running"
        logger.info(f"Executing workflow {instance.template_name} ({workflow_id}) from step index {instance.current_step_index}")

        while instance.current_step_index < len(instance.steps):
            step = instance.steps[instance.current_step_index]
            
            # Check for Approval Gate
            if step.is_approval_gate and instance.context.get("approved_by") is None:
                instance.status = "paused_for_approval"
                logger.warning(f"Workflow {workflow_id} paused at step '{step.name}' awaiting Operator Approval.")
                return instance

            logger.info(f"Running step: {step.name}")
            start_time = datetime.utcnow()
            
            try:
                # Execute step and update context
                step_result = await step.execute_func(instance.context)
                instance.context.update(step_result or {})
                
                instance.execution_history.append({
                    "step_name": step.name,
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat(),
                    "duration_sec": (datetime.utcnow() - start_time).total_seconds()
                })
                
                instance.current_step_index += 1
            except Exception as e:
                logger.error(f"Step '{step.name}' failed: {e}. Starting rollback process...")
                instance.execution_history.append({
                    "step_name": step.name,
                    "status": "failed",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
                instance.status = "failed"
                await self._rollback_workflow(instance)
                return instance

        instance.status = "completed"
        logger.info(f"Workflow {workflow_id} completed successfully.")
        return instance

    async def approve_workflow(self, workflow_id: UUID, approved_by: str):
        """Operator approves a paused workflow, allowing execution to resume."""
        instance = self._instances.get(workflow_id)
        if instance and instance.status == "paused_for_approval":
            instance.context["approved_by"] = approved_by
            instance.context["approved_at"] = datetime.utcnow().isoformat()
            logger.info(f"Workflow {workflow_id} approved by Operator: {approved_by}. Resuming execution.")
            await self.execute_workflow(workflow_id)

    async def _rollback_workflow(self, instance: WorkflowInstance):
        """Rolls back all successfully executed steps in reverse order."""
        logger.warning(f"Rolling back workflow: {instance.template_name} ({instance.workflow_id})")
        # Run rollbacks from current_step_index - 1 down to 0
        for i in range(instance.current_step_index - 1, -1, -1):
            step = instance.steps[i]
            if step.rollback_func:
                logger.info(f"Rolling back step: {step.name}")
                try:
                    await step.rollback_func(instance.context)
                except Exception as e:
                    logger.critical(f"Critical: Rollback step '{step.name}' failed: {e}")
        
        instance.status = "rolled_back"
        logger.info(f"Workflow {instance.workflow_id} rolled back successfully.")

    def get_workflow_instance(self, workflow_id: UUID) -> Optional[WorkflowInstance]:
        return self._instances.get(workflow_id)
