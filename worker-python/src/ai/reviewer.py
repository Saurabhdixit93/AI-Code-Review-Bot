# ===========================================
# Python Worker - AI Reviewer
# ===========================================

import json
from typing import Optional
from dataclasses import dataclass
from openai import AsyncOpenAI
from pathlib import Path
import structlog

from ..config import settings
from ..pipeline.diff_processor import ParsedFile, ParsedHunk, get_hunk_context

logger = structlog.get_logger(__name__)


@dataclass
class AIFinding:
    """Finding from AI review."""
    file_path: str
    line_start: int
    line_end: Optional[int]
    category: str
    severity: str
    confidence: str
    title: str
    message: str
    suggestion: Optional[str]
    ai_reasoning: Optional[str]
    ai_model: str


def get_openai_client() -> AsyncOpenAI:
    """Get OpenAI client configured for OpenRouter."""
    return AsyncOpenAI(
        api_key=settings.ai_api_key,
        base_url=settings.ai_base_url,
    )


def load_prompt(prompt_name: str) -> str:
    """Load prompt template from file."""
    prompt_path = Path(settings.prompts_dir) / f"{prompt_name}.prompt.md"
    
    if prompt_path.exists():
        return prompt_path.read_text()
    
    # Fallback to embedded prompt
    return DEFAULT_REVIEW_PROMPT


DEFAULT_REVIEW_PROMPT = """You are an expert code reviewer. Analyze the code changes and identify real issues.

Focus on:
- Bugs and logic errors
- Security vulnerabilities
- Performance problems
- Maintainability concerns

Do NOT comment on:
- Style preferences
- Minor naming suggestions
- Trivial improvements

For each issue, provide:
- file: the file path
- line_start: starting line number
- line_end: ending line number (or same as start)
- category: bug, security, perf, or maintainability
- severity: block, high, medium, or low
- confidence: high, medium, or low
- title: brief issue title
- message: detailed explanation
- suggestion: specific fix recommendation

Return JSON array of findings. Return empty array if no issues found."""


def select_model_tier(files: list[ParsedFile]) -> tuple[str, str]:
    """Select appropriate model tier based on code analysis."""
    # Use tier 2 for security-sensitive or complex code
    security_keywords = ["auth", "password", "token", "secret", "crypto", "sql", "injection"]
    
    total_additions = sum(f.additions for f in files)
    
    for file in files:
        file_lower = file.path.lower()
        for keyword in security_keywords:
            if keyword in file_lower:
                return settings.ai_model_tier2, "tier2"
    
    # Use tier 2 for larger changes
    if total_additions > 200:
        return settings.ai_model_tier2, "tier2"
    
    return settings.ai_model_tier1, "tier1"


def build_review_context(files: list[ParsedFile], static_findings: list = None) -> str:
    """Build context string for AI review."""
    context_parts = []
    
    for file in files:
        if file.is_binary:
            continue
        
        file_context = f"\n## File: {file.path} ({file.language})\n"
        file_context += f"Status: {file.status}, +{file.additions}/-{file.deletions}\n\n"
        
        for i, hunk in enumerate(file.hunks):
            file_context += f"### Hunk {i + 1}:\n```\n"
            file_context += get_hunk_context(hunk)
            file_context += "\n```\n\n"
        
        context_parts.append(file_context)
    
    # Add static findings as signals
    if static_findings:
        context_parts.append("\n## Static Analysis Signals:\n")
        for finding in static_findings[:5]:  # Limit to avoid token bloat
            context_parts.append(f"- {finding.title} at {finding.file_path}:{finding.line_start}\n")
    
    return "".join(context_parts)


async def run_ai_review(
    files: list[ParsedFile],
    static_findings: list = None,
    ai_mode: str = "balanced",
    model_override: Optional[str] = None,
) -> tuple[list[AIFinding], dict]:
    """Run AI review on parsed files."""
    if not files:
        return [], {"model": None, "tokens_in": 0, "tokens_out": 0}
    
    # Select model
    if model_override:
        model = model_override
        tier = "override"
    else:
        model, tier = select_model_tier(files)
    
    # Load prompt
    prompt_name = "review"
    if ai_mode == "security":
        prompt_name = "security"
    elif ai_mode == "performance":
        prompt_name = "performance"
    
    system_prompt = load_prompt(prompt_name)
    
    # Build context
    context = build_review_context(files, static_findings)
    
    # Truncate if too long
    max_context_tokens = settings.ai_max_tokens * 2  # Rough estimate
    if len(context) > max_context_tokens * 4:  # ~4 chars per token
        context = context[: max_context_tokens * 4] + "\n\n[Context truncated...]"
    
    client = get_openai_client()
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Review these code changes:\n\n{context}"},
            ],
            max_tokens=settings.ai_max_tokens,
            temperature=settings.ai_temperature,
            response_format={"type": "json_object"},
        )
        
        usage = {
            "model": model,
            "tier": tier,
            "tokens_in": response.usage.prompt_tokens if response.usage else 0,
            "tokens_out": response.usage.completion_tokens if response.usage else 0,
        }
        
        # Parse response
        content = response.choices[0].message.content
        findings = parse_ai_response(content, model)
        
        logger.info(
            "AI review complete",
            model=model,
            finding_count=len(findings),
            tokens_in=usage["tokens_in"],
            tokens_out=usage["tokens_out"],
        )
        
        return findings, usage
    
    except Exception as e:
        logger.error("AI review failed", error=str(e), model=model)
        return [], {"model": model, "error": str(e), "tokens_in": 0, "tokens_out": 0}


def parse_ai_response(content: str, model: str) -> list[AIFinding]:
    """Parse AI response into findings."""
    try:
        data = json.loads(content)
        
        # Handle both direct array and object with findings key
        if isinstance(data, list):
            raw_findings = data
        elif isinstance(data, dict) and "findings" in data:
            raw_findings = data["findings"]
        else:
            raw_findings = []
        
        findings = []
        for raw in raw_findings:
            try:
                finding = AIFinding(
                    file_path=raw.get("file", raw.get("file_path", "")),
                    line_start=int(raw.get("line_start", raw.get("line", 0))),
                    line_end=int(raw.get("line_end", raw.get("line_start", raw.get("line", 0)))),
                    category=raw.get("category", "maintainability"),
                    severity=raw.get("severity", "medium"),
                    confidence=raw.get("confidence", "medium"),
                    title=raw.get("title", "AI Review Finding"),
                    message=raw.get("message", ""),
                    suggestion=raw.get("suggestion"),
                    ai_reasoning=raw.get("reasoning"),
                    ai_model=model,
                )
                findings.append(finding)
            except (KeyError, ValueError, TypeError) as e:
                logger.warning("Failed to parse AI finding", error=str(e), raw=raw)
                continue
        
        return findings
    
    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI response as JSON", error=str(e))
        return []
