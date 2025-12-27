# ===========================================
# Python Worker - Diff Processor
# ===========================================

import re
from dataclasses import dataclass, field
from typing import Optional
from unidiff import PatchSet, PatchedFile, Hunk
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class ParsedHunk:
    """Parsed diff hunk with line information."""
    old_start: int
    old_lines: int
    new_start: int
    new_lines: int
    additions: list[tuple[int, str]] = field(default_factory=list)  # (line_no, content)
    deletions: list[tuple[int, str]] = field(default_factory=list)
    context: list[tuple[int, str]] = field(default_factory=list)
    raw_content: str = ""


@dataclass
class ParsedFile:
    """Parsed file diff with all hunks."""
    path: str
    old_path: Optional[str]
    status: str  # added, modified, deleted, renamed
    language: str
    additions: int
    deletions: int
    hunks: list[ParsedHunk] = field(default_factory=list)
    is_binary: bool = False


# File extension to language mapping
LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".jsx": "javascript",
    ".tsx": "typescript",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".sh": "shell",
    ".bash": "shell",
}

# Patterns for files to exclude
EXCLUDED_PATTERNS = [
    r"package-lock\.json$",
    r"yarn\.lock$",
    r"pnpm-lock\.yaml$",
    r"Gemfile\.lock$",
    r"poetry\.lock$",
    r"composer\.lock$",
    r"Cargo\.lock$",
    r"\.min\.js$",
    r"\.min\.css$",
    r"\.map$",
    r"\.d\.ts$",
    r"__pycache__/",
    r"node_modules/",
    r"vendor/",
    r"\.git/",
    r"\.svn/",
    r"dist/",
    r"build/",
    r"\.next/",
    r"coverage/",
]


def detect_language(path: str) -> str:
    """Detect programming language from file extension."""
    for ext, lang in LANGUAGE_MAP.items():
        if path.endswith(ext):
            return lang
    return "unknown"


def should_exclude_file(path: str, custom_patterns: Optional[list[str]] = None) -> bool:
    """Check if file should be excluded from analysis."""
    patterns = EXCLUDED_PATTERNS + (custom_patterns or [])
    
    for pattern in patterns:
        if re.search(pattern, path):
            return True
    
    return False


def parse_diff(diff_text: str, excluded_patterns: Optional[list[str]] = None) -> list[ParsedFile]:
    """Parse unified diff text into structured format."""
    try:
        patch_set = PatchSet(diff_text)
    except Exception as e:
        logger.error("Failed to parse diff", error=str(e))
        return []
    
    parsed_files: list[ParsedFile] = []
    
    for patched_file in patch_set:
        path = patched_file.path
        
        # Handle old/new paths for renames
        if patched_file.source_file and patched_file.target_file:
            old_path = patched_file.source_file.lstrip("a/")
            new_path = patched_file.target_file.lstrip("b/")
            path = new_path
        else:
            old_path = None
        
        # Skip excluded files
        if should_exclude_file(path, excluded_patterns):
            logger.debug("Excluding file from analysis", path=path)
            continue
        
        # Determine status
        if patched_file.is_added_file:
            status = "added"
        elif patched_file.is_removed_file:
            status = "deleted"
        elif old_path and old_path != path:
            status = "renamed"
        else:
            status = "modified"
        
        # Check for binary
        is_binary = patched_file.is_binary_file
        
        parsed_file = ParsedFile(
            path=path,
            old_path=old_path,
            status=status,
            language=detect_language(path),
            additions=patched_file.added,
            deletions=patched_file.removed,
            is_binary=is_binary,
        )
        
        if not is_binary:
            for hunk in patched_file:
                parsed_hunk = parse_hunk(hunk)
                parsed_file.hunks.append(parsed_hunk)
        
        parsed_files.append(parsed_file)
    
    logger.info(
        "Parsed diff",
        file_count=len(parsed_files),
        total_additions=sum(f.additions for f in parsed_files),
        total_deletions=sum(f.deletions for f in parsed_files),
    )
    
    return parsed_files


def parse_hunk(hunk: Hunk) -> ParsedHunk:
    """Parse a single hunk into structured format."""
    parsed = ParsedHunk(
        old_start=hunk.source_start,
        old_lines=hunk.source_length,
        new_start=hunk.target_start,
        new_lines=hunk.target_length,
        raw_content=str(hunk),
    )
    
    current_new_line = hunk.target_start
    current_old_line = hunk.source_start
    
    for line in hunk:
        if line.is_added:
            parsed.additions.append((current_new_line, line.value.rstrip("\n")))
            current_new_line += 1
        elif line.is_removed:
            parsed.deletions.append((current_old_line, line.value.rstrip("\n")))
            current_old_line += 1
        else:
            parsed.context.append((current_new_line, line.value.rstrip("\n")))
            current_new_line += 1
            current_old_line += 1
    
    return parsed


def get_changed_line_numbers(parsed_file: ParsedFile) -> set[int]:
    """Get all line numbers with additions in a file."""
    lines = set()
    
    for hunk in parsed_file.hunks:
        for line_no, _ in hunk.additions:
            lines.add(line_no)
    
    return lines


def get_hunk_context(hunk: ParsedHunk, context_lines: int = 3) -> str:
    """Build context string for a hunk including surrounding lines."""
    lines = []
    
    # Add context before
    for line_no, content in hunk.context[:context_lines]:
        lines.append(f"  {line_no}: {content}")
    
    # Add changes
    for line_no, content in hunk.deletions:
        lines.append(f"- {line_no}: {content}")
    
    for line_no, content in hunk.additions:
        lines.append(f"+ {line_no}: {content}")
    
    # Add context after
    remaining_context = hunk.context[context_lines:]
    for line_no, content in remaining_context[:context_lines]:
        lines.append(f"  {line_no}: {content}")
    
    return "\n".join(lines)
