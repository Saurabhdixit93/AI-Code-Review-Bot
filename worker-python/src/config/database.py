import motor.motor_asyncio
from beanie import init_beanie
from typing import Optional
import structlog

from .settings import settings
from ..models.User import User
from ..models.Organization import Organization
from ..models.Member import Member
from ..models.Repository import Repository
from ..models.PullRequest import PullRequest
from ..models.Run import Run
from ..models.Finding import Finding
from ..models.AuditLog import AuditLog

logger = structlog.get_logger(__name__)

_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None

async def init_database() -> None:
    """Initialize MongoDB connection and Beanie models."""
    global _client
    
    if _client is not None:
        return
    
    logger.info("Initializing MongoDB connection", uri=settings.mongodb_uri)
    
    _client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
    db = _client[settings.mongodb_db_name]
    
    logger.info("Initializing Beanie models")
    await init_beanie(
        database=db,
        document_models=[
            Organization,
            Repository,
            PullRequest,
            Run,
            Finding,
            AuditLog,
        ],
    )
    
    logger.info("Database initialized successfully")

async def close_database() -> None:
    """Close MongoDB connection."""
    global _client
    
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed")
