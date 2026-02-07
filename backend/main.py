from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import repos, bounties, wallet
from backend.dependencies import get_current_user, get_supabase_admin

app = FastAPI(title="GitMarket API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repos.router, prefix="/api")
app.include_router(bounties.router, prefix="/api")
app.include_router(wallet.router, prefix="/api")


@app.get("/api/me")
async def get_me(user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = (
        sb.table("profiles").select("*").eq("id", user["id"]).single().execute()
    )
    return result.data


@app.get("/api/health")
async def health():
    return {"status": "ok"}
