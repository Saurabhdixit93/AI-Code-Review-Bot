# ===========================================
# Python Worker - Performance Rules
# ===========================================

import re
from typing import Optional
from .engine import StaticRule, StaticFinding, Category, Severity, Confidence
from ..pipeline.diff_processor import ParsedFile, ParsedHunk


class NestedLoopRule(StaticRule):
    """Detect deeply nested loops that may indicate O(n²+) complexity."""
    id = "PERF002"
    name = "Nested Loop"
    description = "Detects deeply nested loops that may cause performance issues"
    category = Category.PERF
    severity = Severity.MEDIUM
    confidence = Confidence.LOW
    languages = ["python", "javascript", "typescript", "java"]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        # Look for loop inside loop patterns
        context = "\n".join([c for _, c in hunk.additions])
        
        # Count indentation levels with loops
        loop_patterns = [
            r'for\s+.*:',      # Python
            r'for\s*\(',       # JS/Java
            r'while\s+.*:',    # Python
            r'while\s*\(',     # JS/Java
        ]
        
        loop_count = 0
        for pattern in loop_patterns:
            loop_count += len(re.findall(pattern, context))
        
        # Only flag if this specific line is a loop and context has multiple
        if loop_count >= 2:
            for pattern in loop_patterns:
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
                        title="Nested loops detected",
                        message="Nested loops can lead to O(n²) or worse time complexity.",
                        suggestion="Consider using maps/sets for lookups, or restructuring the algorithm.",
                        code_snippet=content.strip()[:100],
                    )
        return None


class StringConcatInLoopRule(StaticRule):
    """Detect string concatenation in loops."""
    id = "PERF003"
    name = "String Concatenation in Loop"
    description = "Detects inefficient string building patterns"
    category = Category.PERF
    severity = Severity.MEDIUM
    confidence = Confidence.MEDIUM
    languages = ["python", "javascript", "java"]
    
    PATTERNS = [
        r'\+=\s*["\']',
        r'\+=\s*`',
        r'\.concat\s*\(',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        # Check if we're likely in a loop context
        context = "\n".join([c for _, c in hunk.additions])
        in_loop = any(re.search(p, context) for p in [r'for\s', r'while\s', r'\.forEach', r'\.map\('])
        
        if in_loop:
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
                        title="String concatenation in loop",
                        message="String concatenation in loops creates many intermediate strings.",
                        suggestion="Use array join() or StringBuilder. In Python, use list append with join.",
                        code_snippet=content.strip()[:100],
                    )
        return None


class UnboundedQueryRule(StaticRule):
    """Detect database queries without limits."""
    id = "PERF004"
    name = "Unbounded Query"
    description = "Detects database queries that may return too many results"
    category = Category.PERF
    severity = Severity.MEDIUM
    confidence = Confidence.LOW
    languages = ["python", "javascript", "typescript", "java"]
    
    PATTERNS = [
        r'\.find\s*\(\s*\)',           # Empty find()
        r'\.findAll\s*\(\s*\)',
        r'SELECT\s+\*\s+FROM',
        r'\.all\s*\(\s*\)',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        # Skip if limit is present
        if 'limit' in content.lower() or 'take' in content.lower():
            return None
            
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
                    title="Potentially unbounded database query",
                    message="Queries without limits can cause performance and memory issues at scale.",
                    suggestion="Add a LIMIT clause or use pagination for potentially large result sets.",
                    code_snippet=content.strip()[:100],
                )
        return None


# Export all performance rules
PERFORMANCE_RULES = [
    NestedLoopRule(),
    StringConcatInLoopRule(),
    UnboundedQueryRule(),
]
