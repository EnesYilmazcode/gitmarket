import { Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function WalletBadge({ balance }: { balance: number }) {
  return (
    <Badge variant="secondary" className="gap-1 px-2.5 py-1 text-sm font-medium">
      <Wallet className="h-3.5 w-3.5" />
      ${balance.toLocaleString()}
    </Badge>
  )
}
