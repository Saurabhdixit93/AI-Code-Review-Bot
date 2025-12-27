# ===========================================
# Python Worker - Noise Filter
# ===========================================

import re
from typing import Optional
import structlog

from .classifier import NormalizedFinding

logger = structlog.get_logger(__name__)


# Patterns for findings that are often noise
NOISE_PATTERNS = [
    r"consider using",
    r"might want to",
    r"you could",
    r"it would be better",
    r"style preference",
    r"naming convention",
    r"whitespace",
    r"trailing space",
    r"missing newline",
    r"line too long",
    r"indentation",
]

# Files that typically generate false positives
NOISY_FILES = [
    r"\.test\.(js|ts|py)$",
    r"\.spec\.(js|ts)$",
    r"_test\.py$",
    r"test_.*\.py$",
    r"__mocks__/",
    r"fixtures/",
    r"\.stories\.(js|ts|tsx)$",
    r"\.config\.(js|ts|mjs)$",
]


def is_noise_pattern(message: str) -> bool:
    """Check if the finding message matches known noise patterns."""
    message_lower = message.lower()
    for pattern in NOISE_PATTERNS:
        if re.search(pattern, message_lower):
            return True
    return False


def is_noisy_file(file_path: str) -> bool:
    """Check if the file typically generates noisy findings."""
    for pattern in NOISY_FILES:
        if re.search(pattern, file_path):
            return True
    return False


def calculate_noise_score(finding: NormalizedFinding) -> float:
    """
    Calculate a noise score from 0 to 1.
    Higher score = more likely to be noise.
    """
    score = 0.0
    
    # Low severity + low confidence = likely noise
    if finding.severity == 'low':
        score += 0.3
    if finding.confidence == 'low':
        score += 0.3
    
    # AI findings with vague messages
    if finding.source == 'ai':
        if is_noise_pattern(finding.message):
            score += 0.3
    
    # Noisy file paths
    if is_noisy_file(finding.file_path):
        score += 0.2
    
    # Style category often noise
    if finding.category == 'style':
        score += 0.2
    
    return min(score, 1.0)


def filter_noise(
    findings: list[NormalizedFinding],
    threshold: float = 0.6,
) -> tuple[list[NormalizedFinding], list[NormalizedFinding]]:
    """
    Filter out noisy findings.
    Returns (kept, filtered) tuple.
    """
    kept: list[NormalizedFinding] = []
    filtered: list[NormalizedFinding] = []
    
    for finding in findings:
        noise_score = calculate_noise_score(finding)
        
        if noise_score >= threshold:
            # Mark as suppressed
            finding.suppressed = True
            finding.suppression_reason = f"Noise filter (score: {noise_score:.2f})"
            filtered.append(finding)
        else:
            kept.append(finding)
    
    if filtered:
        logger.info(
            "Noise filter applied",
            kept=len(kept),
            filtered=len(filtered),
        )
    
    return kept, filtered


def deduplicate_across_runs(
    new_findings: list[NormalizedFinding],
    existing_fingerprints: set[str],
) -> list[NormalizedFinding]:
    """
    Remove findings that appeared in previous runs.
    Useful for incremental PRs.
    """
    unique: list[NormalizedFinding] = []
    
    for finding in new_findings:
        if finding.fingerprint not in existing_fingerprints:
            unique.append(finding)
        else:
            finding.suppressed = True
            finding.suppression_reason = "Already reported in previous run"
    
    if len(unique) < len(new_findings):
        logger.info(
            "Deduplicated across runs",
            new=len(new_findings),
            unique=len(unique),
        )
    
    return unique
