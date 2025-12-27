# ===========================================
# Python Worker - AI Prompts Module
# ===========================================

import os
from pathlib import Path
from functools import lru_cache


from ..config.settings import settings


PROMPT_DIR = Path(settings.prompts_dir)


@lru_cache(maxsize=10)
def load_prompt(prompt_name: str) -> str:
    """Load a prompt template from the shared prompts directory."""
    prompt_path = PROMPT_DIR / f"{prompt_name}.prompt.md"
    
    if not prompt_path.exists():
        # Fallback to inline defaults
        return get_default_prompt(prompt_name)
    
    return prompt_path.read_text()


def get_default_prompt(prompt_name: str) -> str:
    """Get default prompt if file not found."""
    defaults = {
        "review": """You are an expert code reviewer. Analyze the following code changes and identify:
- Security vulnerabilities
- Bugs or logic errors
- Performance issues
- Code quality concerns

Provide specific, actionable feedback with line numbers. Format as JSON array.""",
        
        "security": """You are a security expert. Focus on identifying:
- SQL injection
- XSS vulnerabilities
- Authentication/authorization issues
- Hardcoded secrets
- Insecure dependencies

Provide CWE IDs where applicable. Format as JSON array.""",
        
        "performance": """You are a performance engineer. Identify:
- N+1 query patterns
- Memory leaks
- Inefficient algorithms
- Blocking operations
- Resource exhaustion risks

Estimate impact where possible. Format as JSON array.""",
    }
    return defaults.get(prompt_name, defaults["review"])


def build_review_prompt(
    diff_content: str,
    language: str,
    context: str = "",
    static_signals: list[dict] = None,
) -> str:
    """Build the full prompt for code review."""
    base_prompt = load_prompt("review")
    
    parts = [
        base_prompt,
        "",
        f"## Language: {language}",
        "",
    ]
    
    if context:
        parts.extend([
            "## Context",
            context,
            "",
        ])
    
    if static_signals:
        parts.extend([
            "## Static Analysis Signals",
            "The following issues were detected by static rules:",
        ])
        for signal in static_signals[:5]:
            parts.append(f"- {signal.get('title')} at line {signal.get('line_start')}")
        parts.append("")
    
    parts.extend([
        "## Code Changes",
        "```diff",
        diff_content[:8000],  # Truncate very large diffs
        "```",
        "",
        "## Response Format",
        "Respond with a JSON array of findings:",
        "```json",
        "[",
        '  {',
        '    "file_path": "path/to/file.py",',
        '    "line_start": 10,',
        '    "line_end": 12,',
        '    "category": "security|bug|perf|style|maintainability",',
        '    "severity": "block|high|medium|low",',
        '    "confidence": "high|medium|low",',
        '    "title": "Brief issue title",',
        '    "message": "Detailed explanation",',
        '    "suggestion": "How to fix (optional)"',
        '  }',
        ']',
        "```",
    ])
    
    return "\n".join(parts)


def build_security_prompt(diff_content: str, language: str) -> str:
    """Build security-focused review prompt."""
    base_prompt = load_prompt("security")
    
    return f"""{base_prompt}

## Language: {language}

## Code Changes
```diff
{diff_content[:8000]}
```

Respond with JSON array of security findings with CWE IDs."""


def build_performance_prompt(diff_content: str, language: str) -> str:
    """Build performance-focused review prompt."""
    base_prompt = load_prompt("performance")
    
    return f"""{base_prompt}

## Language: {language}

## Code Changes
```diff
{diff_content[:8000]}
```

Respond with JSON array of performance findings with impact estimates."""


def estimate_tokens(text: str) -> int:
    """Rough estimate of token count (about 4 chars per token)."""
    return len(text) // 4
