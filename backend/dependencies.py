from fastapi import Depends, HTTPException, Header
from supabase import create_client, Client
import jwt

from backend.config import settings

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
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return {"id": payload["sub"], "email": payload.get("email")}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
