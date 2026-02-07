import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, ArrowUpRight, ArrowDownLeft, Github } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthContext } from '@/components/AuthProvider'
import { useWallet } from '@/hooks/useWallet'
import { supabase } from '@/lib/supabase'
import type { Bounty } from '@/types'

export function Profile() {
  const { user, profile, loading: authLoading } = useAuthContext()
  const { balance, transactions, loading: walletLoading } = useWallet(user?.id)
  const [myBounties, setMyBounties] = useState<Bounty[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return
    supabase
      .from('bounties')
      .select('*, repos(*)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMyBounties(data || []))
  }, [user])

  if (authLoading || walletLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="mt-6 h-40 rounded-lg" />
      </div>
    )
  }

  if (!user) return null

  // Use profile fields with auth user_metadata as fallback
  const meta = user.user_metadata || {}
  const displayName = profile?.username || meta.full_name || meta.name || meta.user_name || 'User'
  const avatarUrl = profile?.avatar_url || meta.avatar_url || ''
  const githubUsername = profile?.github_username || meta.user_name || meta.preferred_username || ''
  const email = user.email || meta.email || ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-lg">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {githubUsername && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Github className="h-3.5 w-3.5" />
              <span>@{githubUsername}</span>
            </div>
          )}
          {email && (
            <p className="text-sm text-muted-foreground">{email}</p>
          )}
        </div>
      </div>

      {/* Wallet Card */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${balance.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Available balance</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="bounties" className="mt-8">
        <TabsList>
          <TabsTrigger value="bounties">My Bounties ({myBounties.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="bounties" className="mt-4">
          {myBounties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              You haven&apos;t created any bounties yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myBounties.map((b) => (
                <Link key={b.id} to={`/bounty/${b.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {b.repos?.full_name}
                        </p>
                        <p className="font-medium">{b.issue_title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            b.status === 'open'
                              ? 'text-emerald-600'
                              : b.status === 'paid'
                                ? 'text-blue-600'
                                : ''
                          }
                        >
                          {b.status}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          ${b.amount}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-35">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {tx.amount > 0 ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}
                        <span className="text-sm capitalize truncate">
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium whitespace-nowrap ${
                        tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
