from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import Field
from .Repository import Repository

class PullRequest(Document):
    repo_id: Link[Repository] = Field(..., alias="repoId")
    pr_number: int = Field(..., alias="prNumber")
    title: str
    state: str = "open"
    head_sha: str = Field(..., alias="headSha")
    base_sha: str = Field(..., alias="baseSha")
    run_mode: str = Field("shadow", alias="runMode")
    author_login: str = Field(..., alias="authorLogin")
    is_draft: bool = Field(False, alias="isDraft")
    is_from_fork: bool = Field(False, alias="isFromFork")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "pull_requests"
        indexes = [
            "repoId",
            "prNumber",
            "headSha",
        ]
