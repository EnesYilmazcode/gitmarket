import { BountyCard } from '@/components/BountyCard'
import { RepoSearchBar } from '@/components/RepoSearchBar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBounties } from '@/hooks/useBounties'

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
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">No open bounties yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Search for a repo above to create the first one!
          </p>
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
