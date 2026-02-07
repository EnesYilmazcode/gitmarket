import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types'

export function useWallet(userId: string | undefined) {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchWallet() {
      const [profileRes, txRes] = await Promise.all([
        supabase.from('profiles').select('balance').eq('id', userId!).single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false }),
      ])
      setBalance(profileRes.data?.balance ?? 0)
      setTransactions(txRes.data || [])
      setLoading(false)
    }

    fetchWallet()

    const channel = supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setBalance(payload.new.balance)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { balance, transactions, loading }
}
