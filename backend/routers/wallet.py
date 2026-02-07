from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user, get_supabase_admin

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("")
async def get_wallet(user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()

    profile = (
        sb.table("profiles")
        .select("balance")
        .eq("id", user["id"])
        .single()
        .execute()
    )

    transactions = (
        sb.table("transactions")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "balance": profile.data["balance"] if profile.data else 0,
        "transactions": transactions.data,
    }
