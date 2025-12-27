from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import Field
from .PullRequest import PullRequest

class Run(Document):
    pr_id: Link[PullRequest] = Field(..., alias="prId")
    status: str = "pending"  # pending, running, completed, failed, skipped
    reason: Optional[str] = None
    error: Optional[str] = None
    run_mode: str = Field("shadow", alias="runMode")
    triggered_by: str = Field(..., alias="triggeredBy")
    started_at: Optional[datetime] = Field(None, alias="startedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    duration_ms: Optional[int] = Field(None, alias="durationMs")
    
    # Analysis metrics
    token_count_input: int = Field(0, alias="tokenCountInput")
    token_count_output: int = Field(0, alias="tokenCountOutput")
    token_cost: float = Field(0.0, alias="tokenCost")
    files_analyzed: int = Field(0, alias="filesAnalyzed")
    lines_analyzed: int = Field(0, alias="linesAnalyzed")
    hunks_analyzed: int = Field(0, alias="hunksAnalyzed")
    
    # Finding stats
    findings_total: int = Field(0, alias="findingsTotal")
    findings_static: int = Field(0, alias="findingsStatic")
    findings_ai: int = Field(0, alias="findingsAi")
    findings_suppressed: int = Field(0, alias="findingsSuppressed")
    
    ai_model_used: Optional[str] = Field(None, alias="aiModelUsed")
    ai_tier: Optional[str] = Field(None, alias="aiTier")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "runs"
        indexes = [
            "prId",
            "status",
            "createdAt",
        ]
