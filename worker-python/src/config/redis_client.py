# ===========================================
# Python Worker - Redis Client Configuration
# ===========================================

import redis
from redis import Redis
from rq import Queue, Worker
from typing import Optional, List
import structlog

from .settings import settings

logger = structlog.get_logger(__name__)

_redis_client: Optional[Redis] = None


def get_redis_client() -> Redis:
    """Get or create Redis client."""
    global _redis_client
    
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=False,
        )
        logger.info("Redis client initialized")
    
    return _redis_client


def close_redis_client() -> None:
    """Close Redis client connection."""
    global _redis_client
    
    if _redis_client is not None:
        _redis_client.close()
        _redis_client = None
        logger.info("Redis client closed")


# Queue names - must match Node.js
QUEUE_ANALYSIS = "analysis-jobs"
QUEUE_REPO_SYNC = "repo-sync-jobs"


def get_analysis_queue() -> Queue:
    """Get the analysis job queue."""
    return Queue(QUEUE_ANALYSIS, connection=get_redis_client())


def get_repo_sync_queue() -> Queue:
    """Get the repository sync queue."""
    return Queue(QUEUE_REPO_SYNC, connection=get_redis_client())


def create_worker(queues: Optional[List[str]] = None) -> Worker:
    """Create a worker for the specified queues."""
    if queues is None:
        queues = [QUEUE_ANALYSIS]
    
    redis_conn = get_redis_client()
    queue_instances = [Queue(name, connection=redis_conn) for name in queues]
    
    return Worker(
        queues=queue_instances,
        connection=redis_conn,
    )
