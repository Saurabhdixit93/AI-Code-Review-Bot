# ===========================================
# Python Worker - Security Rules
# ===========================================

import re
from typing import Optional
from .engine import StaticRule, StaticFinding, Category, Severity, Confidence
from ..pipeline.diff_processor import ParsedFile, ParsedHunk


class CommandInjectionRule(StaticRule):
    """Detect potential command injection vulnerabilities."""
    id = "SEC004"
    name = "Command Injection"
    description = "Detects potential command injection via shell execution"
    category = Category.SECURITY
    severity = Severity.HIGH
    confidence = Confidence.MEDIUM
    languages = ["python", "javascript", "typescript", "ruby"]
    
    PATTERNS = [
        r'os\.system\s*\(',
        r'subprocess\.call\s*\([^)]*shell\s*=\s*True',
        r'subprocess\.Popen\s*\([^)]*shell\s*=\s*True',
        r'exec\s*\([^)]*\$\{',
        r'child_process\.exec\s*\(',
        r'`\$\{.*\}`',
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
                    title="Potential command injection vulnerability",
                    message="User input may be passed to shell execution. This can allow arbitrary command execution.",
                    suggestion="Use subprocess with a list of arguments instead of shell=True. Validate and sanitize all user input.",
                    code_snippet=content.strip()[:100],
                )
        return None


class PathTraversalRule(StaticRule):
    """Detect potential path traversal vulnerabilities."""
    id = "SEC005"
    name = "Path Traversal"
    description = "Detects potential path traversal/directory traversal attacks"
    category = Category.SECURITY
    severity = Severity.HIGH
    confidence = Confidence.MEDIUM
    languages = ["python", "javascript", "typescript", "java", "php"]
    
    PATTERNS = [
        r'open\s*\([^)]*\+',
        r'fs\.readFile\s*\([^)]*\+',
        r'readFileSync\s*\([^)]*\+',
        r'\.\./',
        r'path\.join\s*\([^)]*req\.',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        for pattern in self.PATTERNS:
            if re.search(pattern, content):
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title="Potential path traversal vulnerability",
                    message="File path constructed with user input may allow access to unauthorized files.",
                    suggestion="Validate that resolved paths stay within expected directories. Use path.resolve() and compare with base path.",
                    code_snippet=content.strip()[:100],
                )
        return None


class XSSRule(StaticRule):
    """Detect potential XSS vulnerabilities."""
    id = "SEC006"
    name = "Cross-Site Scripting (XSS)"
    description = "Detects potential XSS via unsafe HTML rendering"
    category = Category.SECURITY
    severity = Severity.HIGH
    confidence = Confidence.MEDIUM
    languages = ["javascript", "typescript", "python"]
    
    PATTERNS = [
        r'dangerouslySetInnerHTML',
        r'\.innerHTML\s*=',
        r'\.outerHTML\s*=',
        r'document\.write\s*\(',
        r'\|safe\s*\}\}',  # Jinja2 safe filter
        r'v-html\s*=',    # Vue.js
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        for pattern in self.PATTERNS:
            if re.search(pattern, content):
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title="Potential XSS vulnerability",
                    message="Rendering unescaped HTML can allow script injection attacks.",
                    suggestion="Sanitize HTML content before rendering. Use DOMPurify or similar library.",
                    code_snippet=content.strip()[:100],
                )
        return None


# Export all security rules
SECURITY_RULES = [
    CommandInjectionRule(),
    PathTraversalRule(),
    XSSRule(),
]
