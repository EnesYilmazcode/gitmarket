import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, Star, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaceBountyDialog } from '@/components/PlaceBountyDialog'
import { useAuthContext } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import type { GitHubIssue, RepoSearchResult } from '@/types'

export function RepoPage() {
  const { owner, name } = useParams<{ owner: string; name: string }>()
  const { user } = useAuthContext()
  const [data, setData] = useState<RepoSearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bountyIssue, setBountyIssue] = useState<GitHubIssue | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function fetchRepo() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.get<RepoSearchResult>(
        `/repos/search?url=https://github.com/${owner}/${name}`
      )
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepo()
  }, [owner, name])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { repo, issues } = data

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Repo Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{repo.full_name}</h1>
          <a href={repo.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
        {repo.description && (
          <p className="mt-1 text-muted-foreground">{repo.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          {repo.language && (
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 fill-current" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            {repo.stars.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Issues List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">
          Open Issues ({issues.length})
        </h2>
        {issues.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No open issues found.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {issues.map((issue) => (
              <Card key={issue.number}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {issue.title}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        #{issue.number}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {issue.labels.map((label) => (
                        <Badge
                          key={label.name}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: `#${label.color}`,
                            color: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    {issue.bounty ? (
                      <Link to={`/bounty/${issue.bounty.id}`}>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                          ${issue.bounty.amount} bounty
                        </Badge>
                      </Link>
                    ) : user ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBountyIssue(issue)
                          setDialogOpen(true)
                        }}
                      >
                        Place Bounty
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PlaceBountyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        issue={bountyIssue}
        repoId={repo.id}
        onSuccess={fetchRepo}
      />
    </div>
  )
}
