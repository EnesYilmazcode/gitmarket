import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Bounty } from '@/types'

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <Link to={`/bounty/${bounty.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {bounty.repos?.full_name}
              </p>
              <p className="mt-1 font-medium leading-snug">
                {bounty.issue_title}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={bounty.profiles?.avatar_url || ''} />
                  <AvatarFallback className="text-[8px]">
                    {bounty.profiles?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{bounty.profiles?.username}</span>
                <span>&middot;</span>
                <span>{timeAgo(bounty.created_at)}</span>
              </div>
            </div>
            <Badge className="shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              ${bounty.amount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
