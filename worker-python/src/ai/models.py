# ===========================================
# Python Worker - AI Model Selection
# ===========================================

from dataclasses import dataclass
from enum import Enum
from typing import Optional
import structlog

from ..config import settings

logger = structlog.get_logger(__name__)


class ModelTier(Enum):
    TIER_1 = "tier1"  # Fast, cheap (GPT-3.5, Claude Instant, Gemini Flash)
    TIER_2 = "tier2"  # Thorough, higher quality (GPT-4, Claude 3, Gemini Pro)


@dataclass
class ModelConfig:
    name: str
    tier: ModelTier
    max_tokens: int
    context_window: int
    cost_per_1k_input: float
    cost_per_1k_output: float


AVAILABLE_MODELS = {
    # OpenAI via OpenRouter
    "gpt-4-turbo-preview": ModelConfig(
        name="gpt-4-turbo-preview",
        tier=ModelTier.TIER_2,
        max_tokens=4096,
        context_window=128000,
        cost_per_1k_input=0.01,
        cost_per_1k_output=0.03,
    ),
    "gpt-3.5-turbo": ModelConfig(
        name="gpt-3.5-turbo",
        tier=ModelTier.TIER_1,
        max_tokens=4096,
        context_window=16385,
        cost_per_1k_input=0.0005,
        cost_per_1k_output=0.0015,
    ),
    # Anthropic via OpenRouter
    "claude-3-sonnet": ModelConfig(
        name="anthropic/claude-3-sonnet",
        tier=ModelTier.TIER_2,
        max_tokens=4096,
        context_window=200000,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
    ),
    "claude-3-haiku": ModelConfig(
        name="anthropic/claude-3-haiku",
        tier=ModelTier.TIER_1,
        max_tokens=4096,
        context_window=200000,
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.00125,
    ),
    # Google via OpenRouter
    "gemini-pro": ModelConfig(
        name="google/gemini-pro",
        tier=ModelTier.TIER_2,
        max_tokens=8192,
        context_window=30720,
        cost_per_1k_input=0.0005,
        cost_per_1k_output=0.0015,
    ),
}


def get_model_for_task(
    task_type: str,
    ai_mode: str,
    override: Optional[str] = None,
) -> ModelConfig:
    """
    Select appropriate model based on task and mode.
    
    task_type: 'review' | 'security' | 'performance'
    ai_mode: 'fast' | 'balanced' | 'thorough'
    override: Specific model name to use
    """
    if override and override in AVAILABLE_MODELS:
        return AVAILABLE_MODELS[override]
    
    # Get configured models
    tier1_model = settings.ai_model_tier1
    tier2_model = settings.ai_model_tier2
    
    # Mode-based selection
    if ai_mode == "fast":
        # Always use Tier 1
        return AVAILABLE_MODELS.get(tier1_model, AVAILABLE_MODELS["gpt-3.5-turbo"])
    
    if ai_mode == "thorough":
        # Always use Tier 2
        return AVAILABLE_MODELS.get(tier2_model, AVAILABLE_MODELS["gpt-4-turbo-preview"])
    
    # Balanced mode: task-based selection
    if task_type == "security":
        # Security always gets Tier 2
        return AVAILABLE_MODELS.get(tier2_model, AVAILABLE_MODELS["gpt-4-turbo-preview"])
    
    # Default to Tier 1 for balanced mode
    return AVAILABLE_MODELS.get(tier1_model, AVAILABLE_MODELS["gpt-3.5-turbo"])


def should_use_tier2(
    total_lines: int,
    has_security_signals: bool,
    language: str,
) -> bool:
    """
    Determine if we should upgrade to Tier 2 model.
    """
    # Always use Tier 2 for security-sensitive code
    if has_security_signals:
        return True
    
    # Use Tier 2 for complex changes
    if total_lines > 200:
        return True
    
    # Use Tier 2 for security-sensitive languages
    security_languages = {"go", "rust", "c", "cpp", "java"}
    if language.lower() in security_languages:
        return True
    
    return False


def calculate_cost(
    model: ModelConfig,
    input_tokens: int,
    output_tokens: int,
) -> float:
    """Calculate API cost for a request."""
    input_cost = (input_tokens / 1000) * model.cost_per_1k_input
    output_cost = (output_tokens / 1000) * model.cost_per_1k_output
    return input_cost + output_cost
