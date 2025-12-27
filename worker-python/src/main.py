# ===========================================
# Python Worker - Main Entry Point
# ===========================================

import asyncio
import signal
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any
import structlog
from rq import Worker
from rq.job import Job

from .config import (
    settings,
    init_database,
    close_database,
    get_redis_client,
    close_redis_client,
    QUEUE_ANALYSIS,
)
from .pipeline.orchestrator import run_analysis

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.dev.ConsoleRenderer() if settings.node_env == "development" else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


def process_analysis_job(job_data: dict) -> dict:
    """Process an analysis job from the queue."""
    logger.info("Processing analysis job", job_id=job_data.get("job_id"))
    
    # Run async orchestrator
    result = asyncio.run(
        run_analysis(
            pr_id=job_data["prId"],
            repo_id=job_data["repoId"],
            org_id=job_data["orgId"],
            pr_number=job_data["prNumber"],
            head_sha=job_data["headSha"],
            run_id=job_data.get("runId", ""),
            run_mode=job_data.get("runMode", "shadow"),
        )
    )
    
    return {
        "run_id": result.run_id,
        "status": result.status,
        "findings_count": len(result.findings),
        "posted": result.posted,
    }


async def worker_startup() -> None:
    """Initialize worker resources."""
    logger.info("Initializing worker")
    await init_database()
    logger.info("Worker initialized")


async def worker_shutdown() -> None:
    """Cleanup worker resources."""
    logger.info("Shutting down worker")
    await close_database()
    close_redis_client()
    logger.info("Worker shutdown complete")


def run_worker():
    """Run the RQ worker."""
    # Initialize database pool
    asyncio.run(worker_startup())
    
    # Setup signal handlers
    shutdown_event = asyncio.Event()
    
    def signal_handler(sig, frame):
        logger.info("Received shutdown signal", signal=sig)
        asyncio.run(worker_shutdown())
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Create and run worker
    redis_conn = get_redis_client()
    
    import uuid
    worker = Worker(
        queues=[QUEUE_ANALYSIS],
        connection=redis_conn,
        name=f"worker-{settings.node_env}-{uuid.uuid4().hex[:8]}",
    )
    
    logger.info("Starting worker", queues=[QUEUE_ANALYSIS])
    
    try:
        worker.work(with_scheduler=False)
    finally:
        asyncio.run(worker_shutdown())


class HealthCheckHandler(BaseHTTPRequestHandler):
    """Simple health check handler."""
    
    def do_GET(self):
        """Handle GET requests."""
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

    def log_message(self, format, *args):
        """Suppress logging for health checks."""
        return


def run_health_check_server(port: int):
    """Run the health check server."""
    server_address = ("", port)
    httpd = HTTPServer(server_address, HealthCheckHandler)
    logger.info("Health check server starting", port=port)
    httpd.serve_forever()


def start_health_check_server():
    """Start the health check server in a background thread."""
    import os
    port = int(os.environ.get("PORT", 10000))
    
    thread = threading.Thread(
        target=run_health_check_server,
        args=(port,),
        daemon=True
    )
    thread.start()
    return thread


def main():
    """Main entry point."""
    logger.info(
        "AI Code Review Worker starting",
        ai_provider=settings.ai_provider,
        ai_base_url=settings.ai_base_url,
        ai_model_tier1=settings.ai_model_tier1,
        ai_model_tier2=settings.ai_model_tier2,
    )
    
    # Start health check server for Render
    start_health_check_server()
    
    run_worker()


if __name__ == "__main__":
    main()
