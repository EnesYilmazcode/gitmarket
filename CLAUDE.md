# GitMarket

A marketplace where people can place bounties on GitHub issues and reward developers who solve them.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend:** FastAPI (Python) deployed as Vercel serverless function
- **Database/Auth:** Supabase (Postgres, GitHub OAuth, Realtime, RLS)
- **Deployment:** Single Vercel monorepo

## Project Structure

```
gitmarket/
├── api/index.py           # Vercel serverless entry point (imports backend.main)
├── frontend/              # Vite React SPA
│   └── src/
│       ├── pages/         # Landing, Dashboard, RepoPage, BountyDetail, Profile, AuthCallback
│       ├── components/    # Navbar, BountyCard, RepoSearchBar, PlaceBountyDialog, SubmitSolutionDialog, WalletBadge, AuthProvider
│       ├── components/ui/ # shadcn/ui primitives (button, card, input, badge, dialog, avatar, etc.)
│       ├── hooks/         # useAuth, useBounties (realtime), useWallet (realtime)
│       ├── lib/           # supabase.ts (client), api.ts (fetch wrapper), utils.ts
│       └── types/         # TypeScript interfaces for all entities
├── backend/               # FastAPI app
│   ├── main.py            # App factory with CORS and router mounts
│   ├── config.py          # pydantic-settings env config
│   ├── dependencies.py    # JWT auth middleware + Supabase service-role client
│   ├── schemas.py         # Pydantic request models
│   ├── routers/
│   │   ├── repos.py       # GET /api/repos/search - GitHub repo + issues fetch
│   │   ├── bounties.py    # CRUD bounties + submissions + approve/reject
│   │   └── wallet.py      # GET /api/wallet - balance + transaction history
│   └── services/
│       └── github.py      # GitHub API wrapper (httpx) + URL parser
├── supabase/migrations/   # SQL schema, triggers, RLS, RPC functions
├── vercel.json            # Single-project deployment config
└── requirements.txt       # Python dependencies
```

## Commands

- **Frontend dev:** `cd frontend && npm run dev` (runs on :5173, proxies /api to :8000)
- **Frontend build:** `cd frontend && npm run build`
- **Frontend type-check:** `cd frontend && npx tsc -b`
- **Backend dev:** `uvicorn backend.main:app --reload` (from project root, runs on :8000)

## Environment

- Root `.env` — backend vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, GITHUB_TOKEN
- `frontend/.env` — frontend vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Both are gitignored. See `.env.example` for the template.
- Supabase project: jwsvjiadhmttkrxnvwiz

## Architecture Notes

- Frontend reads directly from Supabase (fast + realtime) via anon key
- Writes go through FastAPI (business logic + atomic RPC calls) via service role key
- GitHub API calls are proxied through FastAPI to keep tokens server-side
- Database functions `place_bounty()` and `approve_submission()` ensure atomic transactions
- Every user starts with $1000 fake balance on signup (DB trigger `handle_new_user`)
- Supabase Realtime enabled on `bounties` and `profiles` tables for live updates
- Vite dev server proxies `/api/*` to `localhost:8000` for local development
- Featured repos (react, next.js, supabase, tailwindcss, vscode, deno) shown on Landing + Dashboard

## Completed

- [x] Frontend scaffold (Vite + React + TS + Tailwind v4 + shadcn/ui)
- [x] All 6 pages: Landing, AuthCallback, Dashboard, RepoPage, BountyDetail, Profile
- [x] All components: Navbar, BountyCard, RepoSearchBar, PlaceBountyDialog, SubmitSolutionDialog, WalletBadge, AuthProvider
- [x] All 3 hooks: useAuth (GitHub OAuth), useBounties (realtime), useWallet (realtime)
- [x] Backend scaffold (FastAPI + routers + services)
- [x] 10 API endpoints: me, repo search, bounty CRUD, submissions, approve/reject, wallet
- [x] Supabase migration: 5 tables, indexes, RLS, triggers, 2 RPC functions
- [x] GitHub OAuth working (sign in, profile auto-created with $1000)
- [x] Featured repos on Landing + Dashboard pages
- [x] Vercel config for single monorepo deployment
- [x] .gitignore, .env.example, CLAUDE.md, README.md
