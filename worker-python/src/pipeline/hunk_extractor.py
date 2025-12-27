# ===========================================
# Python Worker - Hunk Extractor
# ===========================================

from dataclasses import dataclass
from typing import Optional
import structlog

from .diff_processor import ParsedFile, ParsedHunk

logger = structlog.get_logger(__name__)


@dataclass
class ExtractedHunk:
    """Hunk with additional context for analysis."""
    file_path: str
    language: str
    hunk_index: int
    start_line: int
    end_line: int
    added_lines: list[tuple[int, str]]
    deleted_lines: list[tuple[int, str]] 
    context_before: list[str]
    context_after: list[str]
    raw_diff: str


def extract_hunks(files: list[ParsedFile]) -> list[ExtractedHunk]:
    """Extract all hunks from parsed files with context."""
    extracted: list[ExtractedHunk] = []
    
    for file in files:
        if file.is_binary:
            continue
            
        for i, hunk in enumerate(file.hunks):
            context_before = []
            context_after = []
            
            # Get context lines
            for line_no, content in hunk.context:
                if line_no < hunk.new_start:
                    context_before.append(content)
                else:
                    context_after.append(content)
            
            extracted_hunk = ExtractedHunk(
                file_path=file.path,
                language=file.language,
                hunk_index=i,
                start_line=hunk.new_start,
                end_line=hunk.new_start + hunk.new_lines - 1,
                added_lines=hunk.additions,
                deleted_lines=hunk.deletions,
                context_before=context_before[-3:],  # Last 3 context lines before
                context_after=context_after[:3],     # First 3 context lines after
                raw_diff=hunk.raw_content,
            )
            extracted.append(extracted_hunk)
    
    logger.info("Extracted hunks", hunk_count=len(extracted))
    return extracted


def filter_hunks_for_analysis(
    hunks: list[ExtractedHunk],
    min_additions: int = 1,
    max_hunks: int = 50,
) -> list[ExtractedHunk]:
    """Filter hunks to only those worth analyzing."""
    # Filter out hunks with no additions
    filtered = [h for h in hunks if len(h.added_lines) >= min_additions]
    
    # Sort by size (larger hunks often more important)
    filtered.sort(key=lambda h: len(h.added_lines), reverse=True)
    
    # Limit total hunks
    if len(filtered) > max_hunks:
        filtered = filtered[:max_hunks]
        logger.info("Limited hunks for analysis", original=len(hunks), limited=max_hunks)
    
    return filtered


def group_hunks_by_file(hunks: list[ExtractedHunk]) -> dict[str, list[ExtractedHunk]]:
    """Group hunks by file path for per-file processing."""
    groups: dict[str, list[ExtractedHunk]] = {}
    
    for hunk in hunks:
        if hunk.file_path not in groups:
            groups[hunk.file_path] = []
        groups[hunk.file_path].append(hunk)
    
    return groups
