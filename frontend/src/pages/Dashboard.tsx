import { Link } from 'react-router-dom'
import { Star, ExternalLink } from 'lucide-react'
import { BountyCard } from '@/components/BountyCard'
import { RepoSearchBar } from '@/components/RepoSearchBar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBounties } from '@/hooks/useBounties'

const FEATURED_REPOS = [
  { owner: 'facebook', name: 'react', desc: 'A JavaScript library for building user interfaces', language: 'JavaScript', stars: '232k' },
  { owner: 'vercel', name: 'next.js', desc: 'The React Framework for the Web', language: 'JavaScript', stars: '131k' },
  { owner: 'supabase', name: 'supabase', desc: 'The open source Firebase alternative', language: 'TypeScript', stars: '76k' },
  { owner: 'tailwindlabs', name: 'tailwindcss', desc: 'A utility-first CSS framework', language: 'TypeScript', stars: '86k' },
  { owner: 'microsoft', name: 'vscode', desc: 'Visual Studio Code', language: 'TypeScript', stars: '167k' },
  { owner: 'denoland', name: 'deno', desc: 'A modern runtime for JavaScript and TypeScript', language: 'Rust', stars: '101k' },
]

export function Dashboard() {
  const { bounties, loading } = useBounties()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse Bounties</h1>
      </div>
      <div className="mt-4">
        <RepoSearchBar />
      </div>

      {loading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : bounties.length === 0 ? (
        <div className="mt-12">
          <p className="text-center text-muted-foreground">No open bounties yet.</p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Pick a repo below to browse issues and create the first bounty!
          </p>

          <h2 className="mt-10 text-lg font-semibold">Explore Repositories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_REPOS.map((repo) => (
              <Link key={`${repo.owner}/${repo.name}`} to={`/repo/${repo.owner}/${repo.name}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{repo.owner}/{repo.name}</p>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{repo.desc}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{repo.language}</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3" /> {repo.stars}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {bounties.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      )}
    </div>
  )
}
