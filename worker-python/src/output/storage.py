import json
from datetime import datetime
from typing import Optional, List, Set, Dict, Any
import structlog
from beanie import PydanticObjectId

from ..models.Run import Run
from ..models.Finding import Finding
from ..models.PullRequest import PullRequest
from ..models.Repository import Repository
from ..filters.classifier import NormalizedFinding

logger = structlog.get_logger(__name__)


async def create_run(
    pr_id: str,
    run_mode: str,
    triggered_by: str,
) -> str:
    """Create a new analysis run record."""
    run = Run(
        pr_id=PydanticObjectId(pr_id),
        status="pending",
        run_mode=run_mode,
        triggered_by=triggered_by,
        created_at=datetime.utcnow(),
    )
    await run.insert()
    logger.info("Created run", run_id=str(run.id), pr_id=pr_id)
    return str(run.id)


async def update_run_started(run_id: str) -> None:
    """Mark run as started."""
    run = await Run.get(PydanticObjectId(run_id))
    if run:
        run.status = "running"
        run.started_at = datetime.utcnow()
        await run.save()


async def update_run_completed(
    run_id: str,
    metrics: dict,
) -> None:
    """Mark run as completed with metrics."""
    run = await Run.get(PydanticObjectId(run_id))
    if not run:
        return

    now = datetime.utcnow()
    duration = 0
    if run.started_at:
        duration = int((now - run.started_at).total_seconds() * 1000)

    run.status = "completed"
    run.completed_at = now
    run.duration_ms = duration
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
    logger.info("Run completed", run_id=run_id)


async def update_run_failed(
    run_id: str,
    error: str,
) -> None:
    """Mark run as failed with error."""
    run = await Run.get(PydanticObjectId(run_id))
    if run:
        run.status = "failed"
        run.error = error
        run.completed_at = datetime.utcnow()
        await run.save()
    logger.error("Run failed", run_id=run_id, error=error)


async def update_run_skipped(
    run_id: str,
    reason: str,
) -> None:
    """Mark run as skipped with reason."""
    run = await Run.get(PydanticObjectId(run_id))
    if run:
        run.status = "skipped"
        run.reason = reason
        run.completed_at = datetime.utcnow()
        await run.save()
    logger.info("Run skipped", run_id=run_id, reason=reason)


async def save_finding(finding: NormalizedFinding) -> str:
    """Save a single finding to the database."""
    # We need to fetch pr_id and repo_id from the run
    run = await Run.get(PydanticObjectId(finding.run_id), fetch_links=True)
    
    doc = Finding(
        run_id=PydanticObjectId(finding.run_id),
        pr_id=run.pr_id.id if run and run.pr_id else None,
        repo_id=run.pr_id.repo_id.id if run and run.pr_id and run.pr_id.repo_id else None,
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
    await doc.insert()
    return str(doc.id)


async def save_findings_batch(findings: List[NormalizedFinding]) -> int:
    """Save multiple findings efficiently."""
    if not findings:
        return 0
    
    # Efficient batch saving might need optimization if we need pr_id/repo_id
    # For now, following the pattern of save_finding
    count = 0
    for finding in findings:
        await save_finding(finding)
        count += 1
    
    logger.info("Saved findings", count=count)
    return count


async def get_run_findings(
    run_id: str,
    only_active: bool = True,
) -> List[Dict[str, Any]]:
    """Get all findings for a run."""
    query: Dict[str, Any] = {"runId": PydanticObjectId(run_id)}
    if only_active:
        query["suppressed"] = False
    
    findings = await Finding.find(query).sort("severity", "createdAt").to_list()
    return [f.dict(by_alias=True) for f in findings]


async def get_existing_fingerprints(pr_id: str) -> Set[str]:
    """Get fingerprints from previous runs on same PR."""
    # Find all completed runs for this PR
    runs = await Run.find({"prId": PydanticObjectId(pr_id), "status": "completed"}).to_list()
    run_ids = [r.id for r in runs]
    
    if not run_ids:
        return set()
    
    # Find all findings for these runs
    findings = await Finding.find({"runId": {"$in": run_ids}}).to_list()
    return {f.fingerprint for f in findings if f.fingerprint}


async def get_run_stats(org_id: str, days: int = 30) -> Dict[str, Any]:
    """Get aggregate run statistics for an organization."""
    # In MongoDB, we'd use aggregation for this across multiple collections
    # But since repo information is in its own collection, we need to find them first
    repos = await Repository.find({"orgId": PydanticObjectId(org_id)}).to_list()
    repo_ids = [r.id for r in repos]
    
    prs = await PullRequest.find({"repoId": {"$in": repo_ids}}).to_list()
    pr_ids = [p.id for p in prs]
    
    # Now aggregate runs for these PRs
    # This might be slow if there are many PRs
    pipeline = [
        {"$match": {"prId": {"$in": pr_ids}}},
        {"$group": {
            "_id": None,
            "total_runs": {"$sum": 1},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
            "failed": {"$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}},
            "avg_duration": {"$avg": "$durationMs"},
            "total_findings": {"$sum": "$findingsTotal"},
            "total_cost": {"$sum": "$tokenCost"},
        }}
    ]
    
    results = await Run.aggregate(pipeline).to_list()
    if not results:
        return {
            "total_runs": 0,
            "completed": 0,
            "failed": 0,
            "avg_duration_ms": 0.0,
            "total_findings": 0,
            "total_cost": 0.0,
        }
    
    res = results[0]
    return {
        "total_runs": res.get("total_runs", 0),
        "completed": res.get("completed", 0),
        "failed": res.get("failed", 0),
        "avg_duration_ms": float(res.get("avg_duration") or 0.0),
        "total_findings": res.get("total_findings", 0),
        "total_cost": float(res.get("total_cost") or 0.0),
    }
