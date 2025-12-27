# ===========================================
# Python Worker - GitHub Client Configuration
# ===========================================

import jwt
import time
import httpx
from typing import Optional
from github import Github, GithubIntegration
from dataclasses import dataclass
import structlog

from .settings import settings

logger = structlog.get_logger(__name__)


@dataclass
class InstallationAuth:
    """GitHub App installation authentication."""
    installation_id: int
    token: str
    expires_at: float


_installation_tokens: dict[int, InstallationAuth] = {}


def get_github_integration() -> GithubIntegration:
    """Get GitHub App integration instance."""
    return GithubIntegration(
        integration_id=int(settings.github_app_id),
        private_key=settings.github_private_key_parsed,
    )


def get_installation_token(installation_id: int) -> str:
    """Get or refresh installation access token."""
    cached = _installation_tokens.get(installation_id)
    
    # Return cached if still valid (with 5 min buffer)
    if cached and cached.expires_at > time.time() + 300:
        return cached.token
    
    integration = get_github_integration()
    auth = integration.get_access_token(installation_id)
    
    _installation_tokens[installation_id] = InstallationAuth(
        installation_id=installation_id,
        token=auth.token,
        expires_at=time.time() + 3600,  # Tokens last 1 hour
    )
    
    logger.debug("Refreshed installation token", installation_id=installation_id)
    return auth.token


def get_github_client(installation_id: int) -> Github:
    """Get authenticated GitHub client for an installation."""
    token = get_installation_token(installation_id)
    return Github(login_or_token=token)


async def get_pull_request_diff(
    installation_id: int,
    owner: str,
    repo: str,
    pull_number: int
) -> str:
    """Fetch PR diff using httpx for async support."""
    token = get_installation_token(installation_id)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3.diff",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        response.raise_for_status()
        return response.text


async def get_pull_request_files(
    installation_id: int,
    owner: str,
    repo: str,
    pull_number: int
) -> list[dict]:
    """Fetch PR files metadata."""
    token = get_installation_token(installation_id)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/files",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        response.raise_for_status()
        return response.json()


async def post_pr_review(
    installation_id: int,
    owner: str,
    repo: str,
    pull_number: int,
    comments: list[dict],
    body: Optional[str] = None
) -> dict:
    """Post a PR review with inline comments."""
    token = get_installation_token(installation_id)
    
    payload = {
        "event": "COMMENT",
        "comments": [
            {
                "path": c["path"],
                "line": c["line"],
                "body": c["body"],
                "side": "RIGHT",
            }
            for c in comments
        ],
    }
    
    if body:
        payload["body"] = body
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/reviews",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def get_file_content(
    installation_id: int,
    owner: str,
    repo: str,
    path: str,
    ref: str
) -> Optional[str]:
    """Get file content at a specific ref."""
    token = get_installation_token(installation_id)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3.raw",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            params={"ref": ref},
        )
        
        if response.status_code == 404:
            return None
            
        response.raise_for_status()
        return response.text
