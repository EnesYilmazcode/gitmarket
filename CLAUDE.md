# GitMarket

A marketplace where people can place bounties on GitHub issues and reward developers who solve them.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python) deployed as Vercel serverless function
- **Database/Auth:** Supabase (Postgres, GitHub OAuth, Realtime, RLS)
- **Deployment:** Single Vercel monorepo

## Project Structure

```
gitmarket/
├── api/index.py           # Vercel serverless entry point (imports backend.main)
├── frontend/              # Vite React SPA
│   └── src/
│       ├── pages/         # Route pages (Landing, Dashboard, RepoPage, BountyDetail, Profile)
│       ├── components/    # Shared components (Navbar, BountyCard, dialogs)
│       ├── components/ui/ # shadcn/ui primitives
│       ├── hooks/         # useAuth, useBounties, useWallet
│       ├── lib/           # supabase client, api wrapper, utils
│       └── types/         # TypeScript interfaces
├── backend/               # FastAPI app
│   ├── main.py            # App factory with CORS and router mounts
│   ├── config.py          # Environment settings
│   ├── dependencies.py    # JWT auth + Supabase admin client
│   ├── routers/           # repos, bounties, wallet
│   ├── services/          # github API wrapper
│   └── schemas.py         # Pydantic models
├── supabase/migrations/   # SQL schema, triggers, RLS, RPC functions
├── vercel.json            # Deployment config
└── requirements.txt       # Python dependencies
```

## Commands

- **Frontend dev:** `cd frontend && npm run dev`
- **Frontend build:** `cd frontend && npm run build`
- **Backend dev:** `cd backend && uvicorn backend.main:app --reload` (from project root)

## Architecture Notes

- Frontend reads directly from Supabase (fast + realtime) via anon key
- Writes go through FastAPI (business logic + atomic RPC calls) via service role key
- GitHub API calls are proxied through FastAPI to keep tokens server-side
- Database functions `place_bounty()` and `approve_submission()` ensure atomic transactions
- Every user starts with $1000 fake balance on signup (DB trigger)
- Supabase Realtime on `bounties` and `profiles` tables for live updates
