from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class Organization(Document):
    github_org_id: int = Field(..., alias="githubOrgId")
    name: str
    slug: str
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    installation_id: Optional[int] = Field(None, alias="installationId")
    installation_status: str = Field("active", alias="installationStatus")
    settings: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "organizations"
        indexes = [
            "githubOrgId",
            "slug",
        ]
