import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTradingStore } from '../stores/tradingStore';

export const useWalletSync = (pollMs = 30000) => {
  const setWallet = useTradingStore((state) => state.setWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (profile) {
        setWallet({
          balance: Number(profile.balance ?? 0),
          realizedPnL: Number(profile.realized_pnl ?? 0),
          marginUsed: Number(profile.margin_used ?? 0),
        });
      } else {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
      }
    } catch (err: any) {
      console.error('[useWalletSync] failed to load wallet:', err);
      setError(err?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [setWallet]);

  useEffect(() => {
    refetch();
    if (!pollMs) return undefined;
    const interval = window.setInterval(refetch, pollMs);
    return () => window.clearInterval(interval);
  }, [pollMs, refetch]);

  return { loading, error, refetch };
};
