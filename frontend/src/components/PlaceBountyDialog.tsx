import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import type { GitHubIssue } from '@/types'

interface PlaceBountyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issue: GitHubIssue | null
  repoId: number
  onSuccess: () => void
}

export function PlaceBountyDialog({
  open,
  onOpenChange,
  issue,
  repoId,
  onSuccess,
}: PlaceBountyDialogProps) {
  const { profile, refreshProfile } = useAuthContext()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issue || !profile) return

    const value = parseInt(amount, 10)
    if (isNaN(value) || value < 5) {
      toast.error('Minimum bounty is $5')
      return
    }
    if (value > profile.balance) {
      toast.error('Insufficient balance')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/bounties', {
        repo_id: repoId,
        issue_number: issue.number,
        issue_title: issue.title,
        issue_url: issue.html_url,
        amount: value,
      })
      toast.success(`$${value} bounty placed on #${issue.number}`)
      refreshProfile()
      onSuccess()
      onOpenChange(false)
      setAmount('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place bounty')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place a Bounty</DialogTitle>
          <DialogDescription>
            {issue && `#${issue.number} - ${issue.title}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                min={5}
                max={profile?.balance}
                placeholder="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Your balance: ${profile?.balance.toLocaleString() || 0} &middot; Min: $5
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Placing...' : 'Place Bounty'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
