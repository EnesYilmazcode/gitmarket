import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { SubmitSolutionDialog } from '@/components/SubmitSolutionDialog'
import { useAuthContext } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import type { Bounty, Submission } from '@/types'

interface BountyDetailData {
  bounty: Bounty
  submissions: Submission[]
}

export function BountyDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, refreshProfile } = useAuthContext()
  const [data, setData] = useState<BountyDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchBounty = useCallback(async () => {
    try {
      const result = await api.get<BountyDetailData>(`/bounties/${id}`)
      setData(result)
    } catch {
      toast.error('Failed to load bounty')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBounty()
  }, [fetchBounty])

  async function handleApprove(submissionId: number) {
    try {
      await api.post(`/bounties/${id}/submissions/${submissionId}/approve`, {})
      toast.success('Submission approved! Bounty paid out.')
      refreshProfile()
      fetchBounty()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  async function handleReject(submissionId: number) {
    try {
      await api.post(`/bounties/${id}/submissions/${submissionId}/reject`, {})
      toast.success('Submission rejected')
      fetchBounty()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-32 rounded-lg" />
      </div>
    )
  }

  if (!data) return null

  const { bounty, submissions } = data
  const isCreator = user?.id === bounty.creator_id
  const hasSubmitted = submissions.some((s) => s.solver_id === user?.id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link to={`/repo/${bounty.repos?.owner}/${bounty.repos?.name}`} className="hover:underline">
                {bounty.repos?.full_name}
              </Link>
              {' '}&middot; #{bounty.issue_number}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{bounty.issue_title}</h1>
          </div>
          <Badge
            className={
              bounty.status === 'open'
                ? 'bg-emerald-100 text-emerald-700'
                : bounty.status === 'paid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
            }
          >
            ${bounty.amount} &middot; {bounty.status}
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Posted by</span>
          <Avatar className="h-5 w-5">
            <AvatarImage src={bounty.profiles?.avatar_url || ''} />
            <AvatarFallback className="text-[10px]">
              {bounty.profiles?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{bounty.profiles?.username}</span>
          <span>&middot;</span>
          <a
            href={bounty.issue_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            View on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Actions */}
      {bounty.status === 'open' && user && !isCreator && !hasSubmitted && (
        <div className="mb-6">
          <Button onClick={() => setDialogOpen(true)}>Submit a Solution</Button>
        </div>
      )}

      {/* Submissions */}
      <div>
        <h2 className="text-lg font-semibold">
          Submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No submissions yet. Be the first to solve this issue!
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {submissions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sub.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {sub.profiles?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{sub.profiles?.username}</p>
                      <a
                        href={sub.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {sub.pr_url}
                      </a>
                      {sub.comment && (
                        <p className="mt-1 text-xs text-muted-foreground">{sub.comment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.status === 'pending' && isCreator && bounty.status === 'open' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-emerald-600"
                          onClick={() => handleApprove(sub.id)}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive"
                          onClick={() => handleReject(sub.id)}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          sub.status === 'approved'
                            ? 'text-emerald-600'
                            : sub.status === 'rejected'
                              ? 'text-destructive'
                              : ''
                        }
                      >
                        {sub.status}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SubmitSolutionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bountyId={bounty.id}
        onSuccess={fetchBounty}
      />
    </div>
  )
}
