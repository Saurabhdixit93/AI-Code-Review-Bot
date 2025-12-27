# ===========================================
# Python Worker - Static Rule Engine
# ===========================================

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Callable
from enum import Enum
import structlog

from ..pipeline.diff_processor import ParsedFile, ParsedHunk

logger = structlog.get_logger(__name__)


class Severity(str, Enum):
    BLOCK = "block"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Category(str, Enum):
    BUG = "bug"
    SECURITY = "security"
    PERF = "perf"
    STYLE = "style"
    MAINTAINABILITY = "maintainability"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class StaticFinding:
    """Finding from static analysis rule."""
    rule_id: str
    rule_name: str
    file_path: str
    line_start: int
    line_end: Optional[int]
    category: Category
    severity: Severity
    confidence: Confidence
    title: str
    message: str
    suggestion: Optional[str] = None
    code_snippet: Optional[str] = None


class StaticRule(ABC):
    """Base class for static analysis rules."""
    
    id: str
    name: str
    description: str
    category: Category
    severity: Severity
    confidence: Confidence
    languages: list[str]  # Empty means all languages
    
    @abstractmethod
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        """Check a line for rule violations."""
        pass
    
    def applies_to(self, file: ParsedFile) -> bool:
        """Check if rule applies to file."""
        if not self.languages:
            return True
        return file.language in self.languages


# ===========================================
# Security Rules
# ===========================================

class SQLInjectionRule(StaticRule):
    id = "SEC001"
    name = "Potential SQL Injection"
    description = "Detects potential SQL injection vulnerabilities"
    category = Category.SECURITY
    severity = Severity.HIGH
    confidence = Confidence.MEDIUM
    languages = ["python", "javascript", "typescript", "java", "php"]
    
    PATTERNS = [
        r'execute\s*\(\s*["\'].*%s',
        r'execute\s*\(\s*f["\']',
        r'execute\s*\(\s*["\'].*\+',
        r'query\s*\(\s*["\'].*\$\{',
        r'raw\s*\(\s*["\'].*\+',
        r'\.query\s*\(\s*`.*\$\{',
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
                    title="Potential SQL injection vulnerability",
                    message="String concatenation or interpolation in SQL query may allow SQL injection attacks.",
                    suggestion="Use parameterized queries or prepared statements instead of string concatenation.",
                    code_snippet=content.strip(),
                )
        return None


class HardcodedSecretRule(StaticRule):
    id = "SEC002"
    name = "Hardcoded Secret"
    description = "Detects hardcoded secrets and API keys"
    category = Category.SECURITY
    severity = Severity.BLOCK
    confidence = Confidence.MEDIUM
    languages = []
    
    PATTERNS = [
        (r'(?:api[_-]?key|apikey)\s*[=:]\s*["\'][a-zA-Z0-9]{16,}["\']', "API key"),
        (r'(?:password|passwd|pwd)\s*[=:]\s*["\'][^"\']{6,}["\']', "password"),
        (r'(?:secret|token)\s*[=:]\s*["\'][a-zA-Z0-9]{16,}["\']', "secret/token"),
        (r'(?:aws_secret|aws_access)\s*[=:]\s*["\'][A-Za-z0-9/+=]{20,}["\']', "AWS credential"),
        (r'-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----', "private key"),
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        for pattern, secret_type in self.PATTERNS:
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
                    title=f"Hardcoded {secret_type} detected",
                    message=f"A hardcoded {secret_type} was found. This is a security risk and should be moved to environment variables.",
                    suggestion="Use environment variables or a secrets manager instead of hardcoding credentials.",
                    code_snippet="[REDACTED]",
                )
        return None


class InsecureHashRule(StaticRule):
    id = "SEC003"
    name = "Insecure Hash Algorithm"
    description = "Detects use of weak hash algorithms"
    category = Category.SECURITY
    severity = Severity.HIGH
    confidence = Confidence.HIGH
    languages = ["python", "javascript", "typescript", "java"]
    
    PATTERNS = [
        r'hashlib\.md5',
        r'hashlib\.sha1',
        r'crypto\.createHash\s*\(\s*["\']md5["\']',
        r'crypto\.createHash\s*\(\s*["\']sha1["\']',
        r'MessageDigest\.getInstance\s*\(\s*["\']MD5["\']',
        r'MessageDigest\.getInstance\s*\(\s*["\']SHA-1["\']',
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
                    title="Use of weak hash algorithm",
                    message="MD5 and SHA1 are cryptographically weak. Use SHA-256 or better for security-sensitive hashing.",
                    suggestion="Replace with SHA-256 or SHA-3 for cryptographic purposes, or bcrypt/argon2 for passwords.",
                    code_snippet=content.strip(),
                )
        return None


# ===========================================
# Bug Detection Rules  
# ===========================================

class NullCheckRule(StaticRule):
    id = "BUG001"
    name = "Missing Null Check"
    description = "Detects potential null/undefined dereferences"
    category = Category.BUG
    severity = Severity.MEDIUM
    confidence = Confidence.LOW
    languages = ["javascript", "typescript"]
    
    PATTERNS = [
        r'\.length\s*[><=]',
        r'\[\d+\]',
        r'\.map\s*\(',
        r'\.filter\s*\(',
        r'\.forEach\s*\(',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        # Skip if already has optional chaining or null check
        if "?." in content or "!= null" in content or "!== null" in content:
            return None
        
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
                    title="Potential null/undefined access",
                    message="This line accesses properties that may cause errors if the value is null or undefined.",
                    suggestion="Consider using optional chaining (?.) or adding a null check.",
                    code_snippet=content.strip(),
                )
        return None


class SwallowedExceptionRule(StaticRule):
    id = "BUG002"
    name = "Swallowed Exception"
    description = "Detects empty catch blocks that swallow exceptions"
    category = Category.BUG
    severity = Severity.MEDIUM
    confidence = Confidence.HIGH
    languages = ["python", "javascript", "typescript", "java"]
    
    PATTERNS = [
        r'except\s*:\s*pass',
        r'catch\s*\([^)]*\)\s*{\s*}',
        r'catch\s*\([^)]*\)\s*{\s*//.*\s*}',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        for pattern in self.PATTERNS:
            if re.search(pattern, content.replace("\n", " ")):
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title="Exception silently swallowed",
                    message="Empty catch block silently ignores errors, making debugging difficult.",
                    suggestion="At minimum, log the error. Consider re-throwing or handling appropriately.",
                    code_snippet=content.strip(),
                )
        return None


# ===========================================
# Performance Rules
# ===========================================

class NPlusOneQueryRule(StaticRule):
    id = "PERF001"
    name = "Potential N+1 Query"
    description = "Detects potential N+1 query patterns"
    category = Category.PERF
    severity = Severity.MEDIUM
    confidence = Confidence.LOW
    languages = ["python", "javascript", "typescript", "ruby"]
    
    PATTERNS = [
        r'for\s+.*\s+in\s+.*:\s*\n.*\.query\(',
        r'\.forEach\s*\([^)]*\)\s*=>\s*{[^}]*\.find',
        r'\.map\s*\([^)]*\)\s*=>\s*{[^}]*await.*\.get',
    ]
    
    def check(self, file: ParsedFile, hunk: ParsedHunk, line_no: int, content: str) -> Optional[StaticFinding]:
        context = "\n".join([c for _, c in hunk.additions])
        for pattern in self.PATTERNS:
            if re.search(pattern, context, re.MULTILINE):
                return StaticFinding(
                    rule_id=self.id,
                    rule_name=self.name,
                    file_path=file.path,
                    line_start=line_no,
                    line_end=line_no,
                    category=self.category,
                    severity=self.severity,
                    confidence=self.confidence,
                    title="Potential N+1 query pattern",
                    message="Database query inside a loop may cause performance issues at scale.",
                    suggestion="Consider using batch queries, joins, or eager loading.",
                    code_snippet=content.strip(),
                )
        return None


# ===========================================
# Rule Registry
# ===========================================

ALL_RULES: list[StaticRule] = [
    SQLInjectionRule(),
    HardcodedSecretRule(),
    InsecureHashRule(),
    NullCheckRule(),
    SwallowedExceptionRule(),
    NPlusOneQueryRule(),
]


def get_rules_for_file(file: ParsedFile, enabled: Optional[list[str]] = None, disabled: Optional[list[str]] = None) -> list[StaticRule]:
    """Get applicable rules for a file."""
    rules = [r for r in ALL_RULES if r.applies_to(file)]
    
    if enabled:
        rules = [r for r in rules if r.id in enabled]
    
    if disabled:
        rules = [r for r in rules if r.id not in disabled]
    
    return rules


def run_static_analysis(
    files: list[ParsedFile],
    enabled_rules: Optional[list[str]] = None,
    disabled_rules: Optional[list[str]] = None,
) -> list[StaticFinding]:
    """Run static analysis on all files."""
    findings: list[StaticFinding] = []
    
    for file in files:
        if file.is_binary:
            continue
        
        rules = get_rules_for_file(file, enabled_rules, disabled_rules)
        
        for hunk in file.hunks:
            for line_no, content in hunk.additions:
                for rule in rules:
                    finding = rule.check(file, hunk, line_no, content)
                    if finding:
                        findings.append(finding)
    
    logger.info("Static analysis complete", finding_count=len(findings))
    return findings
