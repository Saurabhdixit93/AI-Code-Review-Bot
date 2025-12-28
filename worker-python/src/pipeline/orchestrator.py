import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any
import structlog
from beanie import PydanticObjectId

from ..config import (
    get_pull_request_diff,
    settings,
)
from ..models.Organization import Organization
from ..models.Repository import Repository
from ..models.PullRequest import PullRequest
from ..models.Run import Run
from ..models.Finding import Finding
from .diff_processor import parse_diff, ParsedFile
from ..rules.engine import run_static_analysis, StaticFinding
from ..ai.reviewer import run_ai_review, AIFinding
from ..filters.classifier import filter_and_classify, NormalizedFinding
from ..output.commenter import post_review_comments

logger = structlog.get_logger(__name__)


@dataclass
class AnalysisConfig:
    """Configuration for analysis run."""
    max_comments: int = 10
    min_severity: str = "low"
    shadow_mode: bool = True
    enable_static: bool = True
    enable_ai: bool = True
    ai_mode: str = "balanced"
    ai_model_override: Optional[str] = None
    excluded_paths: Optional[list[str]] = None
    excluded_file_patterns: Optional[list[str]] = None
    enabled_rules: Optional[list[str]] = None
    disabled_rules: Optional[list[str]] = None


@dataclass
class AnalysisResult:
    """Result of analysis run."""
    run_id: str
    status: str  # completed, failed, skipped
    reason: Optional[str]
    error: Optional[str]
    findings: list[NormalizedFinding]
    metrics: dict
    posted: bool


async def load_analysis_context(
    pr_id: str,
    repo_id: str,
    org_id: str,
) -> dict:
    """Load all context needed for analysis."""
    # Get org
    org = await Organization.get(PydanticObjectId(org_id))
    if not org:
        raise ValueError(f"Organization not found: {org_id}")
    
    # Get repo
    repo = await Repository.get(PydanticObjectId(repo_id))
    if not repo:
        raise ValueError(f"Repository not found: {repo_id}")
    
    # Get PR
    pr = await PullRequest.get(PydanticObjectId(pr_id))
    if not pr:
        raise ValueError(f"Pull Request not found: {pr_id}")
    
    owner, repo_name = repo.full_name.split("/")
    config = repo.config
    
    return {
        "installation_id": org.installation_id,
        "owner": owner,
        "repo_name": repo_name,
        "pr_number": pr.pr_number,
        "head_sha": pr.head_sha,
        "base_sha": pr.base_sha,
        "config": AnalysisConfig(
            max_comments=config.max_comments,
            min_severity=config.min_severity,
            shadow_mode=config.run_mode == "shadow",
            enable_static=True, # Assuming always enabled if not in config
            enable_ai=config.enable_ai,
            ai_mode=config.ai_mode,
            ai_model_override=config.ai_model_override,
            excluded_paths=config.excluded_paths,
            excluded_file_patterns=config.excluded_file_patterns,
            enabled_rules=config.enabled_rules,
            disabled_rules=config.disabled_rules,
        ),
    }


async def update_run_status(
    run_id: str,
    status: str,
    reason: Optional[str] = None,
    error: Optional[str] = None,
    metrics: Optional[dict] = None,
) -> None:
    """Update run status in database."""
    run = await Run.get(PydanticObjectId(run_id))
    if not run:
        return

    run.status = status
    run.reason = reason
    run.error = error
    run.updated_at = datetime.utcnow()

    if metrics:
        run.files_analyzed = metrics.get("files_analyzed", 0)
        run.lines_analyzed = metrics.get("lines_analyzed", 0)
        run.hunks_analyzed = metrics.get("hunks_analyzed", 0)
        run.findings_total = metrics.get("findings_total", 0)
        run.findings_static = metrics.get("findings_static", 0)
        run.findings_ai = metrics.get("findings_ai", 0)
        run.findings_suppressed = metrics.get("findings_suppressed", 0)
        run.token_count_input = metrics.get("tokens_in", 0)
        run.token_count_output = metrics.get("tokens_out", 0)
        run.token_cost = metrics.get("token_cost", 0)
        run.ai_model_used = metrics.get("ai_model")
        run.ai_tier = metrics.get("ai_tier")

    await run.save()


async def save_findings(run_id: str, findings: list[NormalizedFinding]) -> None:
    """Save findings to database."""
    run = await Run.get(PydanticObjectId(run_id), fetch_links=True)
    if not run:
        return

    docs = []
    for finding in findings:
        doc = Finding(
            run_id=PydanticObjectId(run_id),
            pr_id=run.pr_id.id if run.pr_id else None,
            repo_id=run.pr_id.repo_id.id if run.pr_id and run.pr_id.repo_id else None,
            file_path=finding.file_path,
            line_start=finding.line_start,
            line_end=finding.line_end,
            source=finding.source,
            category=finding.category,
            severity=finding.severity,
            confidence=finding.confidence,
            title=finding.title,
            message=finding.message,
            suggestion=finding.suggestion,
            code_snippet=finding.code_snippet,
            rule_id=finding.rule_id,
            ai_reasoning=finding.ai_reasoning,
            ai_model=finding.ai_model,
            suppressed=finding.suppressed,
            suppression_reason=finding.suppression_reason,
            fingerprint=finding.fingerprint,
        )
        docs.append(doc)
    
    if docs:
        await Finding.insert_many(docs)


async def run_analysis(
    pr_id: str,
    repo_id: str,
    org_id: str,
    pr_number: int,
    head_sha: str,
    run_id: str,
    run_mode: str,
) -> AnalysisResult:
    """Main analysis pipeline orchestrator."""
    started_at = datetime.utcnow()
    
    logger.info(
        "Starting analysis",
        run_id=run_id,
        pr_id=pr_id,
        pr_number=pr_number,
        run_mode=run_mode,
    )
    
    try:
        # Mark as running
        run = await Run.get(PydanticObjectId(run_id))
        if run:
            run.status = "running"
            run.started_at = datetime.utcnow()
            await run.save()
        
        # Load context
        context = await load_analysis_context(pr_id, repo_id, org_id)
        config = context["config"]
        
        # Override shadow mode from run_mode
        if run_mode == "shadow":
            config.shadow_mode = True
        elif run_mode == "active":
            config.shadow_mode = False
        
        # Fetch diff
        logger.info("Fetching PR diff")
        diff_text = await get_pull_request_diff(
            context["installation_id"],
            context["owner"],
            context["repo_name"],
            context["pr_number"],
        )
        
        # Parse diff
        parsed_files = parse_diff(diff_text, config.excluded_file_patterns)
        
        if not parsed_files:
            logger.info("No analyzable files in diff")
            await update_run_status(run_id, "skipped", reason="No analyzable files in diff")
            return AnalysisResult(
                run_id=run_id,
                status="skipped",
                reason="No analyzable files in diff",
                error=None,
                findings=[],
                metrics={},
                posted=False,
            )
        
        # Calculate metrics
        files_count = len(parsed_files)
        lines_count = sum(f.additions + f.deletions for f in parsed_files)
        hunks_count = sum(len(f.hunks) for f in parsed_files)
        
        # Run static analysis
        static_findings: list[StaticFinding] = []
        if config.enable_static:
            logger.info("Running static analysis")
            static_findings = run_static_analysis(
                parsed_files,
                config.enabled_rules,
                config.disabled_rules,
            )
        
        # Run AI review
        ai_findings: list[AIFinding] = []
        ai_usage = {"model": None, "tokens_in": 0, "tokens_out": 0}
        
        if config.enable_ai:
            logger.info("Running AI review")
            ai_findings, ai_usage = await run_ai_review(
                parsed_files,
                static_findings,
                config.ai_mode,
                config.ai_model_override,
            )
        
        # Filter and classify
        logger.info("Filtering and classifying findings")
        normalized_findings, filter_stats = filter_and_classify(
            static_findings,
            ai_findings,
            run_id,
            config.min_severity,
            config.max_comments * 5,  # Keep extra for storage
        )
        
        # Save findings
        logger.info("Saving findings to database")
        await save_findings(run_id, normalized_findings)
        
        # Post comments
        logger.info("Posting review comments")
        post_result = await post_review_comments(
            context["installation_id"],
            context["owner"],
            context["repo_name"],
            context["pr_number"],
            normalized_findings,
            run_id,
            config.shadow_mode,
            config.max_comments,
        )
        
        # Update run with metrics
        metrics = {
            "files_analyzed": files_count,
            "lines_analyzed": lines_count,
            "hunks_analyzed": hunks_count,
            "findings_total": filter_stats["total"],
            "findings_static": filter_stats["static"],
            "findings_ai": filter_stats["ai"],
            "findings_suppressed": filter_stats["suppressed"],
            "tokens_in": ai_usage.get("tokens_in", 0),
            "tokens_out": ai_usage.get("tokens_out", 0),
            "token_cost": 0,  # Calculate based on model pricing
            "ai_model": ai_usage.get("model"),
            "ai_tier": ai_usage.get("tier"),
        }
        
        await update_run_status(run_id, "completed", metrics=metrics)
        
        duration_ms = int((datetime.utcnow() - started_at).total_seconds() * 1000)
        run = await Run.get(PydanticObjectId(run_id))
        if run:
            run.duration_ms = duration_ms
            run.completed_at = datetime.utcnow()
            await run.save()
        
        logger.info(
            "Analysis completed",
            run_id=run_id,
            duration_ms=duration_ms,
            findings_total=filter_stats["total"],
            findings_active=filter_stats["active"],
            posted=post_result["posted"],
        )
        
        return AnalysisResult(
            run_id=run_id,
            status="completed",
            reason=None,
            error=None,
            findings=normalized_findings,
            metrics=metrics,
            posted=post_result["posted"],
        )
    
    except Exception as e:
        logger.error("Analysis failed", run_id=run_id, error=str(e))
        await update_run_status(run_id, "failed", error=str(e))
        
        return AnalysisResult(
            run_id=run_id,
            status="failed",
            reason=None,
            error=str(e),
            findings=[],
            metrics={},
            posted=False,
        )
