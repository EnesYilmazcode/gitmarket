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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface SubmitSolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bountyId: number
  onSuccess: () => void
}

export function SubmitSolutionDialog({
  open,
  onOpenChange,
  bountyId,
  onSuccess,
}: SubmitSolutionDialogProps) {
  const [prUrl, setPrUrl] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub PR URL')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/bounties/${bountyId}/submissions`, {
        pr_url: prUrl,
        comment: comment || null,
      })
      toast.success('Solution submitted!')
      onSuccess()
      onOpenChange(false)
      setPrUrl('')
      setComment('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Solution</DialogTitle>
          <DialogDescription>
            Link your pull request that solves this issue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Pull Request URL</label>
              <Input
                placeholder="https://github.com/owner/repo/pull/123"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                placeholder="Brief description of your solution..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
