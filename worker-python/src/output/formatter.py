# ===========================================
# Python Worker - Comment Formatter
# ===========================================

from typing import Optional
from ..filters.classifier import NormalizedFinding

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


def format_finding_markdown(finding: NormalizedFinding) -> str:
    """Format a single finding as markdown for PR comment."""
    sev = SEVERITY_EMOJI.get(finding.severity, "")
    cat = CATEGORY_EMOJI.get(finding.category, "")
    
    lines = [
        f"### {sev} {finding.title}",
        f"",
        f"**Severity**: {finding.severity.upper()} | **Category**: {cat} {finding.category} | **Confidence**: {finding.confidence}",
        f"",
        finding.message,
    ]
    
    if finding.code_snippet:
        lines.extend([
            "",
            "```",
            finding.code_snippet.strip(),
            "```",
        ])
    
    if finding.suggestion:
        lines.extend([
            "",
            f"**💡 Suggestion**: {finding.suggestion}",
        ])
    
    # Add metadata footer
    if finding.source == "static" and finding.rule_id:
        lines.append(f"\n<sub>Rule: `{finding.rule_id}`</sub>")
    elif finding.source == "ai" and finding.ai_model:
        lines.append(f"\n<sub>AI Analysis ({finding.ai_model})</sub>")
    
    return "\n".join(lines)


def format_summary_table(findings: list[NormalizedFinding]) -> str:
    """Format findings summary as markdown table."""
    active = [f for f in findings if not f.suppressed]
    
    if not active:
        return "✅ No issues found in this PR."
    
    # Group by severity
    by_severity: dict[str, list[NormalizedFinding]] = {}
    for f in active:
        by_severity.setdefault(f.severity, []).append(f)
    
    lines = [
        "| Severity | Count | Top Issues |",
        "|----------|-------|------------|",
    ]
    
    for sev in ["block", "high", "medium", "low"]:
        if sev not in by_severity:
            continue
        
        findings_list = by_severity[sev]
        emoji = SEVERITY_EMOJI.get(sev, "")
        count = len(findings_list)
        top = ", ".join([f.title[:30] for f in findings_list[:3]])
        if len(findings_list) > 3:
            top += f" (+{len(findings_list) - 3} more)"
        
        lines.append(f"| {emoji} {sev.upper()} | {count} | {top} |")
    
    return "\n".join(lines)


def format_file_section(
    file_path: str,
    findings: list[NormalizedFinding],
) -> str:
    """Format findings for a single file."""
    lines = [f"### `{file_path}`", ""]
    
    for finding in findings:
        sev = SEVERITY_EMOJI.get(finding.severity, "")
        line_info = f"L{finding.line_start}" if finding.line_start else ""
        lines.append(f"- {sev} **{finding.title}** {line_info}")
        lines.append(f"  {finding.message[:100]}{'...' if len(finding.message) > 100 else ''}")
    
    return "\n".join(lines)


def format_full_report(
    findings: list[NormalizedFinding],
    run_id: str,
    shadow_mode: bool = False,
) -> str:
    """Format complete review report as markdown."""
    active = [f for f in findings if not f.suppressed]
    suppressed_count = len([f for f in findings if f.suppressed])
    
    lines = [
        "## 🤖 AI Code Review Report",
        "",
    ]
    
    if shadow_mode:
        lines.append("> ⚠️ **Shadow Mode**: This review is for testing only and won't block the PR.")
        lines.append("")
    
    if not active:
        lines.append("✅ **No issues found!** This code looks good to merge.")
        return "\n".join(lines)
    
    # Summary
    lines.append(f"Found **{len(active)}** issue(s) to review:")
    lines.append("")
    lines.append(format_summary_table(findings))
    lines.append("")
    
    # Group by file
    by_file: dict[str, list[NormalizedFinding]] = {}
    for f in active:
        by_file.setdefault(f.file_path, []).append(f)
    
    lines.append("---")
    lines.append("")
    
    for file_path, file_findings in by_file.items():
        lines.append(format_file_section(file_path, file_findings[:5]))
        if len(file_findings) > 5:
            lines.append(f"  ... and {len(file_findings) - 5} more in this file")
        lines.append("")
    
    # Footer
    lines.append("---")
    if suppressed_count > 0:
        lines.append(f"<sub>{suppressed_count} low-priority issue(s) suppressed</sub>")
    lines.append(f"<sub>Run ID: `{run_id[:8]}`</sub>")
    
    return "\n".join(lines)
