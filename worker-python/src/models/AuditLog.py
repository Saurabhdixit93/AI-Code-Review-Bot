from datetime import datetime
from typing import Optional, Any, Dict
from beanie import Document, Link
from pydantic import Field
from .Organization import Organization

class AuditLog(Document):
    org_id: Optional[Link[Organization]] = Field(None, alias="orgId")
    actor_user_id: Optional[str] = Field(None, alias="actorUserId")
    actor_type: str = Field("user", alias="actorType")  # user, system, github
    
    action: str
    entity_type: str = Field(..., alias="entityType")
    entity_id: Optional[str] = Field(None, alias="entityId")
    
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    ip_address: Optional[str] = Field(None, alias="ipAddress")
    user_agent: Optional[str] = Field(None, alias="userAgent")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_log"
        indexes = [
            "orgId",
            "action",
            "entityType",
            "createdAt",
        ]
