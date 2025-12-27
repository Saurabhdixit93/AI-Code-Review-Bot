# ===========================================
# Python Worker - AI Response Parser
# ===========================================

import json
import re
from typing import Optional
import structlog

logger = structlog.get_logger(__name__)


def extract_json_from_response(response_text: str) -> Optional[list[dict]]:
    """
    Extract JSON array from AI response, handling various formats.
    """
    # Try to find JSON in markdown code blocks
    code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
    if code_block_match:
        json_str = code_block_match.group(1).strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Try to find raw JSON array
    array_match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', response_text)
    if array_match:
        try:
            return json.loads(array_match.group())
        except json.JSONDecodeError:
            pass
    
    # Try the entire response as JSON
    try:
        result = json.loads(response_text)
        if isinstance(result, list):
            return result
        if isinstance(result, dict) and 'findings' in result:
            return result['findings']
    except json.JSONDecodeError:
        pass
    
    logger.warning("Could not extract JSON from response")
    return None


def validate_finding(finding: dict) -> bool:
    """Validate that a finding has required fields."""
    required_fields = ['file_path', 'title', 'message']
    
    for field in required_fields:
        if field not in finding or not finding[field]:
            return False
    
    return True


def normalize_finding(finding: dict) -> dict:
    """Normalize finding fields to expected format."""
    return {
        'file_path': finding.get('file_path', finding.get('path', '')),
        'line_start': finding.get('line_start', finding.get('line', finding.get('start_line'))),
        'line_end': finding.get('line_end', finding.get('end_line')),
        'category': normalize_category(finding.get('category', 'bug')),
        'severity': normalize_severity(finding.get('severity', 'medium')),
        'confidence': normalize_confidence(finding.get('confidence', 'medium')),
        'title': finding.get('title', 'Issue detected'),
        'message': finding.get('message', finding.get('description', '')),
        'suggestion': finding.get('suggestion', finding.get('fix', finding.get('recommendation'))),
    }


def normalize_category(category: str) -> str:
    """Normalize category to valid enum value."""
    category_map = {
        'security': 'security',
        'sec': 'security',
        'vulnerability': 'security',
        'bug': 'bug',
        'error': 'bug',
        'logic': 'bug',
        'perf': 'perf',
        'performance': 'perf',
        'efficiency': 'perf',
        'style': 'style',
        'formatting': 'style',
        'lint': 'style',
        'maintainability': 'maintainability',
        'readability': 'maintainability',
        'complexity': 'maintainability',
    }
    return category_map.get(category.lower(), 'bug')


def normalize_severity(severity: str) -> str:
    """Normalize severity to valid enum value."""
    severity_map = {
        'critical': 'block',
        'blocking': 'block',
        'block': 'block',
        'high': 'high',
        'major': 'high',
        'medium': 'medium',
        'moderate': 'medium',
        'warning': 'medium',
        'low': 'low',
        'minor': 'low',
        'info': 'low',
        'suggestion': 'low',
    }
    return severity_map.get(severity.lower(), 'medium')


def normalize_confidence(confidence: str) -> str:
    """Normalize confidence to valid enum value."""
    confidence_map = {
        'high': 'high',
        'certain': 'high',
        'definite': 'high',
        'medium': 'medium',
        'moderate': 'medium',
        'probable': 'medium',
        'low': 'low',
        'uncertain': 'low',
        'possible': 'low',
    }
    return confidence_map.get(confidence.lower(), 'medium')


def parse_ai_response(
    response_text: str,
    model_name: str,
) -> tuple[list[dict], dict]:
    """
    Parse AI response and return validated findings.
    Returns (findings, metadata)
    """
    raw_findings = extract_json_from_response(response_text)
    
    if raw_findings is None:
        return [], {'parse_error': True, 'raw_length': len(response_text)}
    
    validated = []
    for raw in raw_findings:
        if validate_finding(raw):
            normalized = normalize_finding(raw)
            normalized['ai_model'] = model_name
            validated.append(normalized)
    
    metadata = {
        'total_raw': len(raw_findings),
        'validated': len(validated),
        'filtered': len(raw_findings) - len(validated),
    }
    
    logger.info("Parsed AI response", **metadata)
    return validated, metadata
