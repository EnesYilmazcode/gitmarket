from fastapi import APIRouter, HTTPException, Query, Depends

from backend.dependencies import get_supabase_admin
from backend.services.github import parse_github_url, fetch_repo, fetch_issues

router = APIRouter(prefix="/repos", tags=["repos"])


@router.get("/search")
async def search_repo(url: str = Query(...)):
    try:
        owner, name = parse_github_url(url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid GitHub URL")

    try:
        gh_repo = await fetch_repo(owner, name)
    except Exception:
        raise HTTPException(status_code=404, detail="Repository not found on GitHub")

    sb = get_supabase_admin()

    # Upsert the repo
    repo_data = {
        "github_id": gh_repo["id"],
        "owner": owner.lower(),
        "name": name.lower(),
        "full_name": gh_repo["full_name"],
        "description": gh_repo.get("description"),
        "stars": gh_repo.get("stargazers_count", 0),
        "language": gh_repo.get("language"),
        "url": gh_repo["html_url"],
    }
    result = (
        sb.table("repos")
        .upsert(repo_data, on_conflict="github_id")
        .execute()
    )
    repo = result.data[0]

    # Fetch issues from GitHub
    try:
        gh_issues = await fetch_issues(owner, name)
    except Exception:
        gh_issues = []

    # Get existing bounties for this repo
    bounties_result = (
        sb.table("bounties")
        .select("*")
        .eq("repo_id", repo["id"])
        .eq("status", "open")
        .execute()
    )
    bounty_map = {}
    for b in bounties_result.data:
        bounty_map[b["issue_number"]] = b

    # Enrich issues with bounty data
    issues = []
    for issue in gh_issues:
        issues.append(
            {
                "number": issue["number"],
                "title": issue["title"],
                "html_url": issue["html_url"],
                "state": issue["state"],
                "labels": [
                    {"name": l["name"], "color": l.get("color", "ccc")}
                    for l in issue.get("labels", [])
                ],
                "user": {
                    "login": issue["user"]["login"],
                    "avatar_url": issue["user"]["avatar_url"],
                },
                "created_at": issue["created_at"],
                "comments": issue.get("comments", 0),
                "bounty": bounty_map.get(issue["number"]),
            }
        )

    return {"repo": repo, "issues": issues}
