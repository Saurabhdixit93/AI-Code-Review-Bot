from datetime import datetime
from typing import Optional, List
from beanie import Document, Link
from pydantic import Field, BaseModel
from .Organization import Organization

import pymongo

class RepoConfig(BaseModel):
    run_mode: str = Field("shadow", alias="runMode")
    max_pr_files: int = Field(100, alias="maxPrFiles")
    max_pr_lines: int = Field(5000, alias="maxPrLines")
    enable_ai: bool = Field(True, alias="enableAi")
    ai_mode: str = Field("balanced", alias="aiMode")
    ai_model_override: Optional[str] = Field(None, alias="aiModelOverride")
    excluded_paths: List[str] = Field(default_factory=list, alias="excludedPaths")
    excluded_file_patterns: List[str] = Field(default_factory=list, alias="excludedFilePatterns")
    enabled_rules: Optional[List[str]] = Field(None, alias="enabledRules")
    disabled_rules: Optional[List[str]] = Field(None, alias="disabledRules")
    max_comments: int = Field(10, alias="maxComments")
    min_severity: str = Field("low", alias="minSeverity")

class Repository(Document):
    org_id: Link[Organization] = Field(..., alias="orgId")
    github_repo_id: int = Field(..., alias="githubRepoId")
    name: str
    full_name: str = Field(..., alias="fullName")
    description: Optional[str] = None
    default_branch: str = Field(..., alias="defaultBranch")
    language: Optional[str] = None
    is_private: bool = Field(..., alias="isPrivate")
    is_enabled: bool = Field(True, alias="isEnabled")
    last_synced_at: Optional[datetime] = Field(None, alias="lastSyncedAt")
    config: RepoConfig = Field(default_factory=RepoConfig)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "repositories"
        indexes = [
            "orgId",
            pymongo.IndexModel([("githubRepoId", pymongo.ASCENDING)], unique=True),
            pymongo.IndexModel([("fullName", pymongo.ASCENDING)], unique=True),
        ]
