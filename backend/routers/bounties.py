from fastapi import APIRouter, HTTPException, Depends

from backend.dependencies import get_current_user, get_supabase_admin
from backend.schemas import CreateBountyRequest, CreateSubmissionRequest

router = APIRouter(prefix="/bounties", tags=["bounties"])


@router.get("")
async def list_bounties():
    sb = get_supabase_admin()
    result = (
        sb.table("bounties")
        .select("*, repos(*), profiles(*)")
        .eq("status", "open")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{bounty_id}")
async def get_bounty(bounty_id: int):
    sb = get_supabase_admin()
    bounty_result = (
        sb.table("bounties")
        .select("*, repos(*), profiles(*)")
        .eq("id", bounty_id)
        .single()
        .execute()
    )
    if not bounty_result.data:
        raise HTTPException(status_code=404, detail="Bounty not found")

    submissions_result = (
        sb.table("submissions")
        .select("*, profiles(*)")
        .eq("bounty_id", bounty_id)
        .order("created_at", desc=False)
        .execute()
    )

    return {
        "bounty": bounty_result.data,
        "submissions": submissions_result.data,
    }


@router.post("")
async def create_bounty(
    body: CreateBountyRequest, user: dict = Depends(get_current_user)
):
    if body.amount < 5:
        raise HTTPException(status_code=400, detail="Minimum bounty is $5")

    sb = get_supabase_admin()

    try:
        result = sb.rpc(
            "place_bounty",
            {
                "p_creator_id": user["id"],
                "p_repo_id": body.repo_id,
                "p_issue_number": body.issue_number,
                "p_issue_title": body.issue_title,
                "p_issue_url": body.issue_url,
                "p_amount": body.amount,
            },
        ).execute()
        bounty_id = result.data
    except Exception as e:
        msg = str(e)
        if "Insufficient balance" in msg:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        raise HTTPException(status_code=400, detail=msg)

    return {"id": bounty_id}


@router.delete("/{bounty_id}")
async def cancel_bounty(bounty_id: int, user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()

    bounty = (
        sb.table("bounties").select("*").eq("id", bounty_id).single().execute()
    )
    if not bounty.data:
        raise HTTPException(status_code=404, detail="Bounty not found")
    if bounty.data["creator_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your bounty")
    if bounty.data["status"] != "open":
        raise HTTPException(status_code=400, detail="Bounty is not open")

    amount = bounty.data["amount"]

    # Refund
    sb.table("profiles").update(
        {"balance": sb.table("profiles").select("balance").eq("id", user["id"]).single().execute().data["balance"] + amount}
    ).eq("id", user["id"]).execute()

    sb.table("bounties").update({"status": "cancelled"}).eq("id", bounty_id).execute()

    sb.table("transactions").insert(
        {
            "user_id": user["id"],
            "amount": amount,
            "type": "bounty_cancelled",
            "bounty_id": bounty_id,
            "description": f"Cancelled bounty on {bounty.data['issue_title']}",
        }
    ).execute()

    return {"ok": True}


@router.post("/{bounty_id}/submissions")
async def create_submission(
    bounty_id: int,
    body: CreateSubmissionRequest,
    user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()

    bounty = (
        sb.table("bounties").select("*").eq("id", bounty_id).single().execute()
    )
    if not bounty.data:
        raise HTTPException(status_code=404, detail="Bounty not found")
    if bounty.data["status"] != "open":
        raise HTTPException(status_code=400, detail="Bounty is not open")
    if bounty.data["creator_id"] == user["id"]:
        raise HTTPException(
            status_code=400, detail="Cannot submit to your own bounty"
        )

    try:
        result = (
            sb.table("submissions")
            .insert(
                {
                    "bounty_id": bounty_id,
                    "solver_id": user["id"],
                    "pr_url": body.pr_url,
                    "comment": body.comment,
                }
            )
            .execute()
        )
    except Exception as e:
        if "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=400, detail="You already submitted to this bounty"
            )
        raise

    return result.data[0]


@router.post("/{bounty_id}/submissions/{submission_id}/approve")
async def approve_submission(
    bounty_id: int,
    submission_id: int,
    user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()

    try:
        sb.rpc(
            "approve_submission",
            {
                "p_approver_id": user["id"],
                "p_bounty_id": bounty_id,
                "p_submission_id": submission_id,
            },
        ).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"ok": True}


@router.post("/{bounty_id}/submissions/{submission_id}/reject")
async def reject_submission(
    bounty_id: int,
    submission_id: int,
    user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()

    bounty = (
        sb.table("bounties").select("*").eq("id", bounty_id).single().execute()
    )
    if not bounty.data:
        raise HTTPException(status_code=404, detail="Bounty not found")
    if bounty.data["creator_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can reject")

    sb.table("submissions").update({"status": "rejected"}).eq(
        "id", submission_id
    ).execute()

    return {"ok": True}
