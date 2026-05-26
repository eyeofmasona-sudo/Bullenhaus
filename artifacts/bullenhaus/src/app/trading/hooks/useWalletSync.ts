import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTradingStore } from '../stores/tradingStore';

export const useWalletSync = (pollMs = 30000) => {
  const setWallet = useTradingStore((state) => state.setWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const destroyed = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user?.id) {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
        return;
      }

      const { data: profile, error: dbError } = await supabase
        .from('users')
        .select('balance, realized_pnl, margin_used')
        .eq('id', session.user.id)
        .maybeSingle();

      if (dbError) throw dbError;

      setWallet(
        profile
          ? {
              balance: Number(profile.balance ?? 0),
              realizedPnL: Number(profile.realized_pnl ?? 0),
              marginUsed: Number(profile.margin_used ?? 0),
            }
          : { balance: 0, realizedPnL: 0, marginUsed: 0 },
      );
    } catch (err: any) {
      console.error('[useWalletSync] failed to load wallet:', err);
      setError(err?.message || 'Failed to load wallet');
      setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
    } finally {
      setLoading(false);
    }
  }, [setWallet]);

  useEffect(() => {
    if (!supabase) return;

    refetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
      } else {
        refetch();
      }
    });

    // Real-time subscription for instant balance updates
    destroyed.current = false;
    const setupRealtimeSync = async () => {
      if (destroyed.current) return;
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user?.id || destroyed.current) return;

      const ch = supabase
        .channel(`wallet-sync-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${session.user.id}`,
          },
          (payload) => {
            if (destroyed.current) return;
            const updated = payload.new as any;
            setWallet({
              balance: Number(updated.balance ?? 0),
              realizedPnL: Number(updated.realized_pnl ?? 0),
              marginUsed: Number(updated.margin_used ?? 0),
            });
          }
        )
        .subscribe((status) => {
          if (destroyed.current) return;
          if (status === 'SUBSCRIBED') {
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            setError('Real-time sync unavailable');
            // Fallback to polling
            if (pollMs && !pollIntervalRef.current) {
              pollIntervalRef.current = window.setInterval(refetch, pollMs);
            }
          }
        });

      channelRef.current = ch;
    };

    setupRealtimeSync().catch(() => {
      // Fallback to polling if realtime setup fails
      if (pollMs && !pollIntervalRef.current) {
        pollIntervalRef.current = window.setInterval(refetch, pollMs);
      }
    });

    // Also set up polling as a safety net (every 30 seconds)
    if (pollMs && !pollIntervalRef.current) {
      pollIntervalRef.current = window.setInterval(refetch, pollMs);
    }

    return () => {
      destroyed.current = true;
      subscription.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
      }
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pollMs, refetch, setWallet]);

  return { loading, error, refetch };
};
