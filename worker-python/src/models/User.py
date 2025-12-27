from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class User(Document):
    github_user_id: int = Field(..., alias="githubUserId")
    username: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    access_token_encrypted: Optional[str] = Field(None, alias="accessTokenEncrypted")
    refresh_token_encrypted: Optional[str] = Field(None, alias="refreshTokenEncrypted")
    token_expires_at: Optional[datetime] = Field(None, alias="tokenExpiresAt")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [
            "githubUserId",
            "username",
            "email",
        ]
