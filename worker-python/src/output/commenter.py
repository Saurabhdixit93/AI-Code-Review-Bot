# ===========================================
# Python Worker - GitHub Comment Poster
# ===========================================

from typing import Optional
import structlog

from ..config import post_pr_review
from ..filters.classifier import NormalizedFinding

logger = structlog.get_logger(__name__)


SEVERITY_EMOJI = {
    "block": "🚫",
    "high": "🔴",
    "medium": "🟡",
    "low": "🔵",
}

CATEGORY_EMOJI = {
    "security": "🔒",
    "bug": "🐛",
    "perf": "⚡",
    "style": "🎨",
    "maintainability": "🧹",
}


def format_inline_comment(finding: NormalizedFinding) -> str:
    """Format finding as inline PR comment."""
    severity_emoji = SEVERITY_EMOJI.get(finding.severity, "")
    category_emoji = CATEGORY_EMOJI.get(finding.category, "")
    
    comment = f"### {severity_emoji} {finding.title}\n\n"
    comment += f"**Severity**: {finding.severity.upper()} | "
    comment += f"**Category**: {category_emoji} {finding.category}\n\n"
    comment += f"{finding.message}\n"
    
    if finding.suggestion:
        comment += f"\n**Suggestion**: {finding.suggestion}\n"
    
    if finding.source == "static" and finding.rule_id:
        comment += f"\n<sub>Rule: `{finding.rule_id}`</sub>"
    elif finding.source == "ai":
        comment += f"\n<sub>AI Review ({finding.confidence} confidence)</sub>"
    
    return comment


def format_summary_comment(
    findings: list[NormalizedFinding],
    run_id: str,
    shadow_mode: bool = False,
) -> str:
    """Format summary comment for PR."""
    active = [f for f in findings if not f.suppressed]
    
    if not active:
        return "✅ **AI Code Review**: No issues found in this PR."
    
    # Group by severity
    by_severity: dict[str, list[NormalizedFinding]] = {}
    for finding in active:
        by_severity.setdefault(finding.severity, []).append(finding)
    
    # Build summary
    lines = ["## 🤖 AI Code Review Summary\n"]
    
    if shadow_mode:
        lines.append("> ⚠️ **Shadow Mode**: This is a preview review and won't block the PR.\n")
    
    lines.append(f"Found **{len(active)}** issue(s):\n")
    
    for severity in ["block", "high", "medium", "low"]:
        if severity in by_severity:
            emoji = SEVERITY_EMOJI.get(severity, "")
            count = len(by_severity[severity])
            lines.append(f"- {emoji} **{severity.upper()}**: {count}")
    
    lines.append("\n### Details\n")
    
    for severity in ["block", "high", "medium", "low"]:
        if severity not in by_severity:
            continue
        
        for finding in by_severity[severity][:5]:  # Limit per severity
            emoji = SEVERITY_EMOJI.get(finding.severity, "")
            cat_emoji = CATEGORY_EMOJI.get(finding.category, "")
            lines.append(
                f"- {emoji} **{finding.title}** ({cat_emoji} {finding.category})"
            )
            lines.append(f"  - `{finding.file_path}:{finding.line_start or '?'}`")
    
    suppressed_count = len([f for f in findings if f.suppressed])
    if suppressed_count > 0:
        lines.append(f"\n<sub>{suppressed_count} low-priority issue(s) suppressed.</sub>")
    
    lines.append(f"\n<sub>Run ID: `{run_id[:8]}`</sub>")
    
    return "\n".join(lines)


async def post_review_comments(
    installation_id: int,
    owner: str,
    repo: str,
    pull_number: int,
    findings: list[NormalizedFinding],
    run_id: str,
    shadow_mode: bool = False,
    max_comments: int = 10,
) -> dict:
    """Post review comments to PR."""
    if shadow_mode:
        logger.info(
            "Shadow mode: skipping comment posting",
            finding_count=len(findings),
            pr=f"{owner}/{repo}#{pull_number}",
        )
        return {
            "posted": False,
            "shadow_mode": True,
            "comment_count": 0,
            "findings_total": len(findings),
        }
    
    active = [f for f in findings if not f.suppressed]
    
    if not active:
        logger.info("No active findings to post", pr=f"{owner}/{repo}#{pull_number}")
        return {
            "posted": True,
            "shadow_mode": False,
            "comment_count": 0,
            "findings_total": 0,
        }
    
    # Build inline comments for findings with line numbers
    inline_comments = []
    for finding in active[:max_comments]:
        if finding.line_start:
            inline_comments.append({
                "path": finding.file_path,
                "line": finding.line_start,
                "body": format_inline_comment(finding),
            })
    
    # Create summary
    summary = format_summary_comment(findings, run_id, shadow_mode)
    
    try:
        result = await post_pr_review(
            installation_id=installation_id,
            owner=owner,
            repo=repo,
            pull_number=pull_number,
            comments=inline_comments,
            body=summary,
        )
        
        logger.info(
            "Posted review comments",
            pr=f"{owner}/{repo}#{pull_number}",
            inline_count=len(inline_comments),
            review_id=result.get("id"),
        )
        
        return {
            "posted": True,
            "shadow_mode": False,
            "comment_count": len(inline_comments) + 1,  # +1 for summary
            "findings_total": len(active),
            "review_id": result.get("id"),
        }
    
    except Exception as e:
        logger.error(
            "Failed to post review comments",
            error=str(e),
            pr=f"{owner}/{repo}#{pull_number}",
        )
        return {
            "posted": False,
            "shadow_mode": False,
            "error": str(e),
            "comment_count": 0,
            "findings_total": len(active),
        }
