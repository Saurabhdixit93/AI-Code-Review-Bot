# ===========================================
# Python Worker - Finding Classifier & Deduplicator
# ===========================================

import hashlib
from dataclasses import dataclass
from typing import Union
import structlog

from ..rules.engine import StaticFinding
from ..ai.reviewer import AIFinding

logger = structlog.get_logger(__name__)


@dataclass
class NormalizedFinding:
    """Normalized finding for storage and output."""
    run_id: str
    file_path: str
    line_start: int | None
    line_end: int | None
    source: str  # static | ai
    category: str
    severity: str
    confidence: str
    title: str
    message: str
    suggestion: str | None
    code_snippet: str | None
    rule_id: str | None
    ai_reasoning: str | None
    ai_model: str | None
    suppressed: bool
    suppression_reason: str | None
    fingerprint: str


def generate_fingerprint(
    file_path: str,
    line_start: int | None,
    source: str,
    title: str,
    rule_id: str | None = None,
) -> str:
    """Generate unique fingerprint for deduplication."""
    components = [
        file_path,
        str(line_start or 0),
        source,
        rule_id or "",
        title[:50],  # Truncate long titles
    ]
    raw = "|".join(components)
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def normalize_static_finding(finding: StaticFinding, run_id: str) -> NormalizedFinding:
    """Normalize static finding to common format."""
    return NormalizedFinding(
        run_id=run_id,
        file_path=finding.file_path,
        line_start=finding.line_start,
        line_end=finding.line_end,
        source="static",
        category=finding.category.value,
        severity=finding.severity.value,
        confidence=finding.confidence.value,
        title=finding.title,
        message=finding.message,
        suggestion=finding.suggestion,
        code_snippet=finding.code_snippet,
        rule_id=finding.rule_id,
        ai_reasoning=None,
        ai_model=None,
        suppressed=False,
        suppression_reason=None,
        fingerprint=generate_fingerprint(
            finding.file_path,
            finding.line_start,
            "static",
            finding.title,
            finding.rule_id,
        ),
    )


def normalize_ai_finding(finding: AIFinding, run_id: str) -> NormalizedFinding:
    """Normalize AI finding to common format."""
    return NormalizedFinding(
        run_id=run_id,
        file_path=finding.file_path,
        line_start=finding.line_start,
        line_end=finding.line_end,
        source="ai",
        category=finding.category,
        severity=finding.severity,
        confidence=finding.confidence,
        title=finding.title,
        message=finding.message,
        suggestion=finding.suggestion,
        code_snippet=None,
        rule_id=None,
        ai_reasoning=finding.ai_reasoning,
        ai_model=finding.ai_model,
        suppressed=False,
        suppression_reason=None,
        fingerprint=generate_fingerprint(
            finding.file_path,
            finding.line_start,
            "ai",
            finding.title,
        ),
    )


def deduplicate_findings(findings: list[NormalizedFinding]) -> list[NormalizedFinding]:
    """Remove duplicate findings based on fingerprint."""
    seen: set[str] = set()
    unique: list[NormalizedFinding] = []
    
    for finding in findings:
        if finding.fingerprint not in seen:
            seen.add(finding.fingerprint)
            unique.append(finding)
    
    duplicates_removed = len(findings) - len(unique)
    if duplicates_removed > 0:
        logger.info("Deduplicated findings", removed=duplicates_removed)
    
    return unique


def should_suppress(finding: NormalizedFinding, min_severity: str) -> tuple[bool, str | None]:
    """Check if finding should be suppressed."""
    severity_order = {"block": 4, "high": 3, "medium": 2, "low": 1}
    
    # Suppress if below minimum severity
    if severity_order.get(finding.severity, 0) < severity_order.get(min_severity, 0):
        return True, f"Below minimum severity ({min_severity})"
    
    # Suppress low confidence AI findings for non-critical issues
    if (
        finding.source == "ai"
        and finding.confidence == "low"
        and finding.severity in ("low", "medium")
    ):
        return True, "Low confidence AI finding for non-critical issue"
    
    # Suppress vague findings
    vague_patterns = [
        "consider",
        "might want to",
        "could be improved",
        "you may",
    ]
    message_lower = finding.message.lower()
    for pattern in vague_patterns:
        if pattern in message_lower and finding.severity == "low":
            return True, "Vague low-severity suggestion"
    
    return False, None


def filter_and_classify(
    static_findings: list[StaticFinding],
    ai_findings: list[AIFinding],
    run_id: str,
    min_severity: str = "low",
    max_findings: int = 50,
) -> tuple[list[NormalizedFinding], dict]:
    """Filter, classify, and limit findings."""
    # Normalize all findings
    normalized: list[NormalizedFinding] = []
    
    for finding in static_findings:
        normalized.append(normalize_static_finding(finding, run_id))
    
    for finding in ai_findings:
        normalized.append(normalize_ai_finding(finding, run_id))
    
    # Deduplicate
    normalized = deduplicate_findings(normalized)
    
    # Apply suppression rules
    suppressed_count = 0
    for finding in normalized:
        should_supp, reason = should_suppress(finding, min_severity)
        if should_supp:
            finding.suppressed = True
            finding.suppression_reason = reason
            suppressed_count += 1
    
    # Sort by severity (block > high > medium > low) then source (static first)
    severity_order = {"block": 0, "high": 1, "medium": 2, "low": 3}
    source_order = {"static": 0, "ai": 1}
    
    normalized.sort(
        key=lambda f: (
            f.suppressed,  # Non-suppressed first
            severity_order.get(f.severity, 4),
            source_order.get(f.source, 2),
            f.file_path,
            f.line_start or 0,
        )
    )
    
    # Limit to max findings (but keep track of total)
    active_findings = [f for f in normalized if not f.suppressed]
    limited = len(active_findings) > max_findings
    
    if limited:
        # Keep most important findings
        active_findings = active_findings[:max_findings]
        # Re-mark excess as suppressed
        excess_fingerprints = {f.fingerprint for f in active_findings}
        for finding in normalized:
            if not finding.suppressed and finding.fingerprint not in excess_fingerprints:
                finding.suppressed = True
                finding.suppression_reason = "Exceeded maximum findings limit"
    
    stats = {
        "total": len(normalized),
        "static": len([f for f in normalized if f.source == "static"]),
        "ai": len([f for f in normalized if f.source == "ai"]),
        "suppressed": len([f for f in normalized if f.suppressed]),
        "active": len([f for f in normalized if not f.suppressed]),
        "limited": limited,
    }
    
    logger.info("Findings filtered and classified", **stats)
    
    return normalized, stats
