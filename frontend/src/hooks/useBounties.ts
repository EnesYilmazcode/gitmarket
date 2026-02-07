import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Bounty } from '@/types'

export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBounties() {
      const { data } = await supabase
        .from('bounties')
        .select('*, repos(*), profiles(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      setBounties(data || [])
      setLoading(false)
    }

    fetchBounties()

    const channel = supabase
      .channel('bounties-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bounties' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('bounties')
              .select('*, repos(*), profiles(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) setBounties((prev) => [data as Bounty, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            if (payload.new.status !== 'open') {
              setBounties((prev) => prev.filter((b) => b.id !== payload.new.id))
            } else {
              setBounties((prev) =>
                prev.map((b) =>
                  b.id === payload.new.id ? { ...b, ...payload.new } : b
                )
              )
            }
          }
          if (payload.eventType === 'DELETE') {
            setBounties((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { bounties, loading }
}
