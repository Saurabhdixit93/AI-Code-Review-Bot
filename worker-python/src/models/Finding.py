from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import Field
from .Run import Run
from .PullRequest import PullRequest
from .Repository import Repository

class Finding(Document):
    run_id: Link[Run] = Field(..., alias="runId")
    pr_id: Optional[Link[PullRequest]] = Field(None, alias="prId")
    repo_id: Optional[Link[Repository]] = Field(None, alias="repoId")
    
    file_path: str = Field(..., alias="filePath")
    line_start: Optional[int] = Field(None, alias="lineStart")
    line_end: Optional[int] = Field(None, alias="lineEnd")
    
    source: str  # ai, static
    category: str
    severity: str  # block, high, medium, low, info
    confidence: str  # high, medium, low
    
    title: str
    message: str
    suggestion: Optional[str] = None
    code_snippet: Optional[str] = Field(None, alias="codeSnippet")
    
    rule_id: Optional[str] = Field(None, alias="ruleId")
    ai_reasoning: Optional[str] = Field(None, alias="aiReasoning")
    ai_model: Optional[str] = Field(None, alias="aiModel")
    
    suppressed: bool = False
    suppression_reason: Optional[str] = Field(None, alias="suppressionReason")
    
    fingerprint: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "findings"
        indexes = [
            "runId",
            "prId",
            "repoId",
            "severity",
            "fingerprint",
        ]
