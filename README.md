# GitMarket

A marketplace where anyone can place bounties on GitHub issues and reward developers who solve them.

> Built for [Builders Week](https://builders-week.devpost.com/) hackathon.

## What it does

GitMarket lets open-source maintainers and contributors fund the issues that matter. Users sign in with GitHub, search for any public repository, and place bounties on open issues. Developers browse available bounties, submit their pull request as a solution, and get paid when the bounty creator approves it.

Every new user starts with $1,000 in platform currency to place bounties and reward contributors.

## How it works

1. **Sign in** with GitHub OAuth
2. **Search** for any public GitHub repository by URL
3. **Browse issues** and place bounties on the ones you want solved
4. **Solve issues** and submit your PR link to claim a bounty
5. **Approve solutions** to pay out the bounty to the solver

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase |
| Deployment | Vercel |

## Supabase Features Used

- **Authentication** -- GitHub OAuth provider for seamless sign-in
- **Database** -- PostgreSQL with 5 tables (profiles, repos, bounties, submissions, transactions), indexes, and constraints
- **Row Level Security (RLS)** -- Fine-grained access policies on every table
- **Database Functions (RPC)** -- `place_bounty()` and `approve_submission()` for atomic financial transactions
- **Database Triggers** -- Auto-create user profile with $1,000 welcome bonus on signup
- **Realtime** -- Live bounty feed and wallet balance updates via Postgres Changes

## Project Structure

```
gitmarket/
├── frontend/          # Vite + React SPA
│   └── src/
│       ├── pages/     # Landing, Dashboard, Repo, BountyDetail, Profile
│       ├── components/# Navbar, BountyCard, dialogs, WalletBadge
│       ├── hooks/     # useAuth, useBounties, useWallet (realtime)
│       └── lib/       # Supabase client, API wrapper
├── backend/           # FastAPI
│   ├── routers/       # repos, bounties, wallet endpoints
│   └── services/      # GitHub API integration
├── api/index.py       # Vercel serverless entry point
├── supabase/          # SQL migration with schema, RLS, triggers, RPC
└── vercel.json        # Single-project deployment config
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project
- A [GitHub OAuth App](https://github.com/settings/developers)

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/EnesYilmazcode/gitmarket.git
   cd gitmarket
   ```

2. Create environment files from the example
   ```bash
   cp .env.example .env
   cp .env.example frontend/.env
   ```
   Fill in your Supabase credentials in `.env` (backend) and `frontend/.env` (frontend uses `VITE_` prefixed vars).

3. Run the SQL migration in your Supabase project's SQL Editor
   - Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it

4. Enable GitHub OAuth in Supabase
   - Supabase Dashboard > Authentication > Providers > GitHub
   - Paste your GitHub OAuth App's Client ID and Client Secret

5. Install dependencies and run
   ```bash
   # Frontend
   cd frontend && npm install && npm run dev

   # Backend (from project root, in a separate terminal)
   pip install -r requirements.txt
   uvicorn backend.main:app --reload
   ```

6. Open http://localhost:5173

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `frontend/.env` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` | Supabase anon/public key |
| `SUPABASE_URL` | `.env` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | `.env` | Supabase JWT signing secret |
| `GITHUB_TOKEN` | `.env` | GitHub PAT for API rate limits (optional) |

## Deployment

Deployed as a single Vercel project. The frontend builds as static files and the backend runs as a Python serverless function at `/api/*`.
