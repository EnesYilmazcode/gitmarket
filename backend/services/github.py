import re

import httpx

from backend.config import settings

GITHUB_API = "https://api.github.com"


def parse_github_url(url: str) -> tuple[str, str]:
    match = re.match(
        r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/\s]+?)(?:\.git)?(?:/.*)?$",
        url,
    )
    if match:
        return match.group(1), match.group(2)
    match = re.match(r"^([^/\s]+)/([^/\s]+)$", url.strip())
    if match:
        return match.group(1), match.group(2)
    raise ValueError("Invalid GitHub URL or owner/repo format")


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


async def fetch_repo(owner: str, name: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{name}", headers=_headers()
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_issues(owner: str, name: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{name}/issues",
            headers=_headers(),
            params={"state": "open", "per_page": 30, "sort": "updated"},
        )
        resp.raise_for_status()
        return [i for i in resp.json() if "pull_request" not in i]
