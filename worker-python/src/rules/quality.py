# ===========================================
# Python Worker - Quality Rules
# ===========================================

import re
from typing import Optional
from .engine import StaticRule, StaticFinding, Category, Severity, Confidence
from ..pipeline.diff_processor import ParsedFile, ParsedHunk


class TodoFIXMERule(StaticRule):
    """Detect TODO/FIXME/HACK comments in new code."""
    id = "QUAL001"
    name = "TODO/FIXME Comment"
    description = "Detects TODO, FIXME, HACK comments that may need attention"
    category = Category.MAINTAINABILITY
    severity = Severity.LOW
    confidence = Confidence.HIGH
    languages = []
    
    PATTERNS = [
        r'TODO[:\s]',
        r'FIXME[:\s]',
        r'HACK[:\s]',
        r'XXX[:\s]',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        content_upper = content.upper()
        for pattern in self.PATTERNS:
            if re.search(pattern, content_upper):
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title="TODO/FIXME comment found",
                    message="This comment indicates incomplete or temporary code that may need follow-up.",
                    suggestion="Create a tracking issue if this requires future work, or address it now if possible.",
                    code_snippet=content.strip()[:100],
                )
        return None


class DebugCodeRule(StaticRule):
    """Detect debug code that shouldn't be committed."""
    id = "QUAL002"
    name = "Debug Code"
    description = "Detects debug statements that may have been left accidentally"
    category = Category.MAINTAINABILITY
    severity = Severity.MEDIUM
    confidence = Confidence.MEDIUM
    languages = ["python", "javascript", "typescript"]
    
    PATTERNS = [
        r'console\.log\s*\(',
        r'console\.debug\s*\(',
        r'debugger;',
        r'print\s*\(["\']debug',
        r'pdb\.set_trace\s*\(',
        r'breakpoint\s*\(',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        for pattern in self.PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title="Debug code detected",
                    message="Debug statements should typically be removed before merging to production.",
                    suggestion="Remove debug code or use a proper logging framework instead.",
                    code_snippet=content.strip()[:100],
                )
        return None


class MagicNumberRule(StaticRule):
    """Detect magic numbers that should be constants."""
    id = "QUAL003"  
    name = "Magic Number"
    description = "Detects hardcoded numbers that may be better as named constants"
    category = Category.MAINTAINABILITY
    severity = Severity.LOW
    confidence = Confidence.LOW
    languages = ["python", "javascript", "typescript", "java"]
    
    # Only flag larger numbers, skip common ones
    EXEMPT_NUMBERS = {0, 1, 2, 10, 100, 1000}
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        # Find numbers in comparisons or assignments
        matches = re.findall(r'[=<>]\s*(\d{3,})\b', content)
        
        for match in matches:
            num = int(match)
            if num not in self.EXEMPT_NUMBERS:
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title=f"Magic number {num} detected",
                    message="Hardcoded numbers can be unclear. Consider using a named constant.",
                    suggestion=f"Extract {num} to a named constant that explains its meaning.",
                    code_snippet=content.strip()[:100],
                )
        return None


# Export all quality rules
QUALITY_RULES = [
    TodoFIXMERule(),
    DebugCodeRule(),
    MagicNumberRule(),
]
