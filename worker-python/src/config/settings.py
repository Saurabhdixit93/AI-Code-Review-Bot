# ===========================================
# Python Worker - Settings Configuration
# ===========================================

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache
from pathlib import Path


# Find the .env file
def get_env_file_path() -> str:
    """Get the path to .env file, checking current and parent directories."""
    # Start from the project root (where settings.py is located)
    current_dir = Path(__file__).parent.parent.parent
    
    # List of places to look: current root, parent root (monorepo)
    search_paths = [
        current_dir / ".env",
        current_dir.parent / ".env",
    ]
    
    for path in search_paths:
        if path.exists():
            return str(path)
            
    # Fallback to current working directory
    return ".env"


class Settings(BaseSettings):
    """Application settings with validation from environment variables."""
    
    # Application
    node_env: str = Field(default="development", alias="NODE_ENV")
    
    # Database
    mongodb_uri: str = Field(..., alias="MONGODB_URI")
    mongodb_db_name: str = Field(default="code_review_bot", alias="MONGODB_DB_NAME")
    
    # Redis
    redis_url: str = Field(..., alias="REDIS_URL")
    
    # GitHub App
    github_app_id: str = Field(..., alias="GITHUB_APP_ID")
    github_app_private_key: str = Field(..., alias="GITHUB_APP_PRIVATE_KEY")
    
    # AI Configuration (OpenRouter)
    ai_provider: str = Field(default="openrouter", alias="AI_PROVIDER")
    ai_base_url: str = Field(default="https://openrouter.ai/api/v1", alias="AI_BASE_URL")
    ai_api_key: str = Field(..., alias="AI_API_KEY")
    ai_model_tier1: str = Field(default="openai/gpt-3.5-turbo", alias="AI_MODEL_TIER1")
    ai_model_tier2: str = Field(default="openai/gpt-4-turbo", alias="AI_MODEL_TIER2")
    ai_max_tokens: int = Field(default=4096, alias="AI_MAX_TOKENS")
    ai_temperature: float = Field(default=0.3, alias="AI_TEMPERATURE")
    
    # Encryption
    encryption_key: str = Field(..., alias="ENCRYPTION_KEY")
    
    # Analysis Configuration
    max_pr_files: int = Field(default=100, alias="MAX_PR_FILES")
    max_pr_lines: int = Field(default=5000, alias="MAX_PR_LINES")
    max_comments_per_pr: int = Field(default=10, alias="MAX_COMMENTS_PER_PR")
    max_file_size_kb: int = Field(default=500, alias="MAX_FILE_SIZE_KB")
    
    # Worker Configuration
    worker_concurrency: int = Field(default=4, alias="WORKER_CONCURRENCY")
    job_timeout_seconds: int = Field(default=300, alias="JOB_TIMEOUT_SECONDS")
    
    # Paths
    # Default to current directory's src/prompts
    prompts_dir: str = Field(
        default=str(Path(__file__).parent.parent / "prompts"), 
        alias="PROMPTS_DIR"
    )
    
    class Config:
        env_file = get_env_file_path()
        env_file_encoding = "utf-8"
        extra = "ignore"
        populate_by_name = True
    
    @property
    def github_private_key_parsed(self) -> str:
        """Parse private key with proper line breaks."""
        return self.github_app_private_key.replace("\\n", "\n")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
