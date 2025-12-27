from datetime import datetime
from beanie import Document, Link
from pydantic import Field
from .Organization import Organization
from .User import User

class Member(Document):
    org_id: Link[Organization] = Field(..., alias="orgId")
    user_id: Link[User] = Field(..., alias="userId")
    role: str = "viewer"  # owner, maintainer, reviewer, viewer
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "members"
        indexes = [
            "orgId",
            "userId",
        ]
