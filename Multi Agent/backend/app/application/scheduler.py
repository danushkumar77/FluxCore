import asyncio
import logging
import time
from datetime import datetime
from typing import Dict, Any, List, Callable, Awaitable, Optional

logger = logging.getLogger("FluxCore.Scheduler")

class ScheduledJob:
    def __init__(self, name: str, task_func: Callable[[], Awaitable[None]], priority: int = 3, interval_sec: float = 0.0, next_run: float = 0.0, cron_expr: str = None, max_retries: int = 3):
        self.name = name
        self.task_func = task_func
        self.priority = priority  # 1 (Highest) to 5 (Lowest)
        self.interval_sec = interval_sec
        self.next_run = next_run
        self.cron_expr = cron_expr
        self.max_retries = max_retries
        self.consecutive_failures = 0

class EnterpriseScheduler:
    def __init__(self):
        self._jobs: List[ScheduledJob] = []
        self._running = False
        self._loop_task: Optional[asyncio.Task] = None

    def start(self):
        if not self._running:
            self._running = True
            self._loop_task = asyncio.create_task(self._scheduler_loop())
            logger.info("Enterprise Scheduler started.")

    async def stop(self):
        self._running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
            logger.info("Enterprise Scheduler stopped.")

    def schedule_periodic(self, name: str, task_func: Callable[[], Awaitable[None]], interval_seconds: float, priority: int = 3):
        """Schedules a recurring task on a fixed second interval."""
        job = ScheduledJob(
            name=name,
            task_func=task_func,
            priority=priority,
            interval_sec=interval_seconds,
            next_run=time.time() + interval_seconds
        )
        self._jobs.append(job)
        logger.info(f"Scheduled periodic job '{name}' every {interval_seconds} seconds. Priority: {priority}")

    def schedule_one_shot(self, name: str, task_func: Callable[[], Awaitable[None]], delay_seconds: float, priority: int = 3):
        """Schedules a task to execute once after a delay."""
        job = ScheduledJob(
            name=name,
            task_func=task_func,
            priority=priority,
            interval_sec=0.0,  # 0 means one-shot
            next_run=time.time() + delay_seconds
        )
        self._jobs.append(job)
        logger.info(f"Scheduled one-shot job '{name}' in {delay_seconds} seconds. Priority: {priority}")

    async def _scheduler_loop(self):
        while self._running:
            try:
                now = time.time()
                # Find jobs due to run, sorted by priority (1 is highest)
                due_jobs = [job for job in self._jobs if job.next_run <= now]
                due_jobs.sort(key=lambda j: (j.priority, j.next_run))

                for job in due_jobs:
                    logger.debug(f"Running scheduled job: {job.name} (Priority: {job.priority})")
                    try:
                        await job.task_func()
                        job.consecutive_failures = 0
                        # Recalculate next run
                        if job.interval_sec > 0:
                            job.next_run = now + job.interval_sec
                        else:
                            # Remove one-shot job
                            self._jobs.remove(job)
                    except Exception as e:
                        job.consecutive_failures += 1
                        logger.error(f"Error executing job '{job.name}' (Failure count: {job.consecutive_failures}): {e}")
                        if job.consecutive_failures <= job.max_retries:
                            # Retry backoff
                            retry_delay = 5.0 * (2 ** (job.consecutive_failures - 1))
                            job.next_run = now + retry_delay
                            logger.info(f"Rescheduled job '{job.name}' for retry in {retry_delay}s")
                        else:
                            logger.critical(f"Job '{job.name}' failed repeatedly and exceeded max retries. Suspended.")
                            if job.interval_sec > 0:
                                # Push next run out but keep in registry
                                job.next_run = now + job.interval_sec * 5
                            else:
                                self._jobs.remove(job)
                
                await asyncio.sleep(0.5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(1.0)

# Global instance for DI
scheduler = EnterpriseScheduler()
