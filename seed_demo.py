"""Seed demo data: fake users, bounties, and submissions for hackathon demo."""

import uuid
from backend.config import settings
from supabase import create_client

sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

FAKE_USERS = [
    {
        "email": "alice@demo.gitmarket.dev",
        "username": "alice-dev",
        "avatar_url": "https://api.dicebear.com/9.x/avataaars/svg?seed=alice",
        "github_username": "alice-dev",
    },
    {
        "email": "bob@demo.gitmarket.dev",
        "username": "bob-codes",
        "avatar_url": "https://api.dicebear.com/9.x/avataaars/svg?seed=bob",
        "github_username": "bob-codes",
    },
    {
        "email": "carol@demo.gitmarket.dev",
        "username": "carol-hacker",
        "avatar_url": "https://api.dicebear.com/9.x/avataaars/svg?seed=carol",
        "github_username": "carol-hacker",
    },
]


def create_fake_users():
    """Create fake auth users + profiles via Supabase admin API."""
    user_ids = []
    for u in FAKE_USERS:
        # Check if profile with this username already exists
        existing = sb.table("profiles").select("id").eq("username", u["username"]).execute()
        if existing.data:
            print(f"  User {u['username']} already exists, skipping")
            user_ids.append(existing.data[0]["id"])
            continue

        # Create auth user (triggers handle_new_user which creates profile)
        result = sb.auth.admin.create_user(
            {
                "email": u["email"],
                "email_confirm": True,
                "user_metadata": {
                    "user_name": u["username"],
                    "avatar_url": u["avatar_url"],
                    "full_name": u["username"],
                },
            }
        )
        uid = result.user.id
        # Update profile with correct github_username
        sb.table("profiles").update(
            {"github_username": u["github_username"]}
        ).eq("id", uid).execute()
        print(f"  Created user {u['username']} ({uid})")
        user_ids.append(uid)
    return user_ids


def get_existing_bounties():
    """Get all open bounties."""
    result = sb.table("bounties").select("*, repos(*)").eq("status", "open").execute()
    return result.data


def get_existing_repos():
    """Get all repos in the database."""
    result = sb.table("repos").select("*").execute()
    return result.data


def seed_submissions(user_ids, bounties):
    """Create submissions from fake users on existing bounties."""
    count = 0
    for bounty in bounties:
        # Pick a fake user to submit (rotate through them)
        solver_id = user_ids[count % len(user_ids)]
        # Don't submit if solver is the creator
        if solver_id == bounty["creator_id"]:
            solver_id = user_ids[(count + 1) % len(user_ids)]

        # Check if submission already exists
        existing = (
            sb.table("submissions")
            .select("id")
            .eq("bounty_id", bounty["id"])
            .eq("solver_id", solver_id)
            .execute()
        )
        if existing.data:
            print(f"  Submission on bounty #{bounty['id']} already exists, skipping")
            count += 1
            continue

        repo_name = bounty.get("repos", {}).get("full_name", "unknown/repo")
        issue_num = bounty["issue_number"]

        sb.table("submissions").insert(
            {
                "bounty_id": bounty["id"],
                "solver_id": solver_id,
                "pr_url": f"https://github.com/{repo_name}/pull/{issue_num + 100}",
                "comment": f"Fixed the issue. Tests passing locally.",
                "status": "pending",
            }
        ).execute()
        print(f"  Submission on bounty #{bounty['id']} ({bounty['issue_title'][:40]}...)")
        count += 1


def seed_extra_bounties(user_ids, repos):
    """Create bounties from fake users on existing repos to make platform look active."""
    extra_bounties = [
        {"issue_number": 29001, "issue_title": "Fix memory leak in production builds", "amount": 75},
        {"issue_number": 29002, "issue_title": "Add dark mode support", "amount": 120},
        {"issue_number": 29003, "issue_title": "Improve TypeScript type inference", "amount": 60},
        {"issue_number": 29004, "issue_title": "Fix SSR hydration mismatch warning", "amount": 90},
        {"issue_number": 29005, "issue_title": "Add WebSocket reconnection logic", "amount": 45},
        {"issue_number": 29006, "issue_title": "Optimize bundle size for mobile", "amount": 100},
    ]

    if not repos:
        print("  No repos found, skipping extra bounties")
        return

    count = 0
    for b in extra_bounties:
        repo = repos[count % len(repos)]
        creator_id = user_ids[count % len(user_ids)]

        # Check if bounty already exists
        existing = (
            sb.table("bounties")
            .select("id")
            .eq("repo_id", repo["id"])
            .eq("issue_number", b["issue_number"])
            .execute()
        )
        if existing.data:
            print(f"  Bounty '{b['issue_title'][:30]}...' already exists, skipping")
            count += 1
            continue

        # Deduct from fake user's balance
        profile = sb.table("profiles").select("balance").eq("id", creator_id).single().execute()
        if profile.data["balance"] < b["amount"]:
            print(f"  {user_ids[count % len(user_ids)]} has insufficient balance, skipping")
            count += 1
            continue

        sb.table("profiles").update(
            {"balance": profile.data["balance"] - b["amount"]}
        ).eq("id", creator_id).execute()

        sb.table("bounties").insert(
            {
                "repo_id": repo["id"],
                "issue_number": b["issue_number"],
                "issue_title": b["issue_title"],
                "issue_url": f"https://github.com/{repo['full_name']}/issues/{b['issue_number']}",
                "creator_id": creator_id,
                "amount": b["amount"],
                "status": "open",
            }
        ).execute()

        sb.table("transactions").insert(
            {
                "user_id": creator_id,
                "amount": -b["amount"],
                "type": "bounty_placed",
                "description": f"Placed bounty on {b['issue_title']}",
            }
        ).execute()

        print(f"  Created bounty: '{b['issue_title'][:40]}' (${b['amount']}) on {repo['full_name']}")
        count += 1


def get_real_user_profile():
    """Get the profile of a real (non-demo) user to assign bounties to."""
    # Get all profiles that are NOT the fake demo users
    fake_emails = [u["email"] for u in FAKE_USERS]
    
    # Get all users from auth
    all_users = sb.auth.admin.list_users()
    
    for user in all_users:
        if user.email not in fake_emails:
            # Found a real user, get their profile
            profile = sb.table("profiles").select("*").eq("id", user.id).execute()
            if profile.data:
                return profile.data[0]
    
    return None


def seed_bounties_for_real_user(real_user_id, repos):
    """Create bounties where the real user is the creator."""
    bounties_for_user = [
        {"issue_number": 39001, "issue_title": "Implement user authentication flow", "amount": 150},
        {"issue_number": 39002, "issue_title": "Add responsive mobile navigation", "amount": 80},
        {"issue_number": 39003, "issue_title": "Fix database connection pooling", "amount": 100},
        {"issue_number": 39004, "issue_title": "Optimize API response times", "amount": 120},
        {"issue_number": 39005, "issue_title": "Add unit tests for core features", "amount": 90},
    ]

    if not repos:
        print("  No repos found, skipping bounties for real user")
        return

    count = 0
    for b in bounties_for_user:
        repo = repos[count % len(repos)]

        # Check if bounty already exists
        existing = (
            sb.table("bounties")
            .select("id")
            .eq("repo_id", repo["id"])
            .eq("issue_number", b["issue_number"])
            .execute()
        )
        if existing.data:
            print(f"  Bounty '{b['issue_title'][:30]}...' already exists, skipping")
            count += 1
            continue

        # Check user's balance
        profile = sb.table("profiles").select("balance").eq("id", real_user_id).single().execute()
        if profile.data["balance"] < b["amount"]:
            print(f"  Insufficient balance for bounty '{b['issue_title'][:30]}...', skipping")
            count += 1
            continue

        # Deduct from user's balance
        sb.table("profiles").update(
            {"balance": profile.data["balance"] - b["amount"]}
        ).eq("id", real_user_id).execute()

        # Create bounty
        sb.table("bounties").insert(
            {
                "repo_id": repo["id"],
                "issue_number": b["issue_number"],
                "issue_title": b["issue_title"],
                "issue_url": f"https://github.com/{repo['full_name']}/issues/{b['issue_number']}",
                "creator_id": real_user_id,
                "amount": b["amount"],
                "status": "open",
            }
        ).execute()

        # Create transaction
        sb.table("transactions").insert(
            {
                "user_id": real_user_id,
                "amount": -b["amount"],
                "type": "bounty_placed",
                "description": f"Placed bounty on {b['issue_title']}",
            }
        ).execute()

        print(f"  Created bounty for real user: '{b['issue_title'][:40]}' (${b['amount']}) on {repo['full_name']}")
        count += 1


if __name__ == "__main__":
    print("Creating fake users...")
    user_ids = create_fake_users()

    print("\nFetching existing data...")
    bounties = get_existing_bounties()
    repos = get_existing_repos()
    print(f"  Found {len(bounties)} open bounties, {len(repos)} repos")

    print("\nSeeding submissions on your bounties...")
    seed_submissions(user_ids, bounties)

    print("\nSeeding extra bounties from fake users...")
    seed_extra_bounties(user_ids, repos)

    print("\nGetting real user profile...")
    real_user = get_real_user_profile()
    if real_user:
        print(f"  Found real user: {real_user['username']} ({real_user['id']})")
        print("\nSeeding bounties for real user (you)...")
        seed_bounties_for_real_user(real_user["id"], repos)
    else:
        print("  No real user found (only demo users exist)")

    print("\nDone! Refresh the app to see the new data.")
