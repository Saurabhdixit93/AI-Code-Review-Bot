# ===========================================
# Python Worker - Context Builder
# ===========================================

from dataclasses import dataclass
from typing import Optional
import structlog

from .diff_processor import ParsedFile
from .hunk_extractor import ExtractedHunk
from ..config import get_file_content

logger = structlog.get_logger(__name__)


@dataclass
class FileContext:
    """Context for a file including surrounding code."""
    file_path: str
    language: str
    full_content: Optional[str]
    imports: list[str]
    class_definitions: list[str]
    function_signatures: list[str]


@dataclass 
class AnalysisContext:
    """Full context for AI analysis."""
    pr_title: str
    pr_description: str
    file_contexts: list[FileContext]
    hunks: list[ExtractedHunk]
    static_findings: list[dict]


async def build_file_context(
    installation_id: int,
    owner: str,
    repo: str,
    ref: str,
    file_path: str,
    language: str,
) -> Optional[FileContext]:
    """Build context for a single file by fetching full content."""
    try:
        content = await get_file_content(installation_id, owner, repo, file_path, ref)
        
        if content is None:
            return None
        
        # Extract imports (simplified detection)
        imports = []
        class_defs = []
        func_sigs = []
        
        for line in content.split('\n')[:100]:  # Check first 100 lines
            line_stripped = line.strip()
            if language == 'python':
                if line_stripped.startswith('import ') or line_stripped.startswith('from '):
                    imports.append(line_stripped)
                elif line_stripped.startswith('class '):
                    class_defs.append(line_stripped)
                elif line_stripped.startswith('def '):
                    func_sigs.append(line_stripped)
            elif language in ('javascript', 'typescript'):
                if 'import ' in line_stripped or 'require(' in line_stripped:
                    imports.append(line_stripped)
                elif 'class ' in line_stripped:
                    class_defs.append(line_stripped)
                elif 'function ' in line_stripped or '=>' in line_stripped:
                    func_sigs.append(line_stripped[:80])
        
        return FileContext(
            file_path=file_path,
            language=language,
            full_content=content[:10000],  # Limit content size
            imports=imports[:10],
            class_definitions=class_defs[:5],
            function_signatures=func_sigs[:10],
        )
    except Exception as e:
        logger.warning("Failed to fetch file context", file=file_path, error=str(e))
        return None


async def build_analysis_context(
    installation_id: int,
    owner: str,
    repo: str,
    head_sha: str,
    pr_title: str,
    pr_description: str,
    files: list[ParsedFile],
    hunks: list[ExtractedHunk],
    static_findings: list[dict],
) -> AnalysisContext:
    """Build full context for AI analysis."""
    file_contexts: list[FileContext] = []
    
    # Fetch context for top files by additions
    top_files = sorted(files, key=lambda f: f.additions, reverse=True)[:10]
    
    for file in top_files:
        if file.is_binary or file.status == 'deleted':
            continue
            
        context = await build_file_context(
            installation_id,
            owner,
            repo,
            head_sha,
            file.path,
            file.language,
        )
        if context:
            file_contexts.append(context)
    
    logger.info(
        "Built analysis context",
        file_count=len(file_contexts),
        hunk_count=len(hunks),
    )
    
    return AnalysisContext(
        pr_title=pr_title,
        pr_description=pr_description or '',
        file_contexts=file_contexts,
        hunks=hunks,
        static_findings=static_findings,
    )


def format_context_for_prompt(context: AnalysisContext, max_tokens: int = 8000) -> str:
    """Format context into a string for AI prompt."""
    parts = []
    
    if context.pr_title:
        parts.append(f"## PR: {context.pr_title}\n")
    
    if context.pr_description:
        parts.append(f"Description: {context.pr_description[:500]}\n")
    
    # Add file contexts
    parts.append("\n## Changed Files\n")
    for fc in context.file_contexts:
        parts.append(f"\n### {fc.file_path} ({fc.language})\n")
        if fc.imports:
            parts.append("Imports: " + ", ".join(fc.imports[:5]) + "\n")
    
    # Add hunks
    parts.append("\n## Code Changes\n")
    char_count = sum(len(p) for p in parts)
    
    for hunk in context.hunks:
        hunk_text = f"\n### {hunk.file_path}:{hunk.start_line}-{hunk.end_line}\n"
        hunk_text += "```diff\n" + hunk.raw_diff[:500] + "\n```\n"
        
        if char_count + len(hunk_text) > max_tokens * 4:  # ~4 chars per token
            parts.append("\n[Additional hunks truncated...]\n")
            break
            
        parts.append(hunk_text)
        char_count += len(hunk_text)
    
    # Add static findings as signals
    if context.static_findings:
        parts.append("\n## Static Analysis Signals\n")
        for f in context.static_findings[:5]:
            parts.append(f"- {f.get('title', 'Issue')} at {f.get('file_path')}:{f.get('line_start')}\n")
    
    return "".join(parts)
