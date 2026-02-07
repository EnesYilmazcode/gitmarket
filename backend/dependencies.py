import logging

import httpx
from fastapi import HTTPException, Header
from supabase import create_client, Client

from backend.config import settings

logger = logging.getLogger(__name__)

_supabase_admin: Client | None = None


def get_supabase_admin() -> Client:
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_admin


async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
) -> dict:
    token = authorization.replace("Bearer ", "")
    if not token:
        print("[AUTH] No token after stripping Bearer prefix")
        raise HTTPException(status_code=401, detail="Missing token")
    print(f"[AUTH] Token received ({len(token)} chars)")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            },
        )

    if resp.status_code != 200:
        print(f"[AUTH] Supabase rejected token: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    print("[AUTH] Token validated successfully")

    user = resp.json()
    return {"id": user["id"], "email": user.get("email")}
