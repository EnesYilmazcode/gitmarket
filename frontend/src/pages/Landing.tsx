import { ArrowRight, DollarSign, GitBranch, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RepoSearchBar } from '@/components/RepoSearchBar'
import { BountyCard } from '@/components/BountyCard'
import { useBounties } from '@/hooks/useBounties'
import { useAuthContext } from '@/components/AuthProvider'

export function Landing() {
  const { bounties } = useBounties()
  const { user, signInWithGitHub } = useAuthContext()
  const recent = bounties.slice(0, 6)

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Fund the issues that matter
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Put bounties on GitHub issues, reward developers who solve them.
          Open source, powered by real incentives.
        </p>
        <div className="mx-auto mt-8 max-w-lg">
          <RepoSearchBar />
        </div>
        {!user && (
          <div className="mt-6">
            <Button variant="outline" onClick={signInWithGitHub} className="gap-2">
              Sign in with GitHub to get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid gap-8 pb-16 sm:grid-cols-3">
        {[
          {
            icon: GitBranch,
            title: 'Pick any repo',
            desc: 'Paste a GitHub URL and browse its open issues.',
          },
          {
            icon: DollarSign,
            title: 'Place a bounty',
            desc: 'Fund issues you care about with any amount.',
          },
          {
            icon: Users,
            title: 'Earn by solving',
            desc: 'Submit your PR and get paid when it\'s approved.',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border p-6">
            <f.icon className="h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Recent Bounties */}
      {recent.length > 0 && (
        <section className="pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Bounties</h2>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recent.map((b) => (
              <BountyCard key={b.id} bounty={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
