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

      setWallet(
        profile
          ? {
              balance: Number(profile.balance ?? 0),
              realizedPnL: Number(profile.realized_pnl ?? 0),
              marginUsed: Number(profile.margin_used ?? 0),
            }
          : { balance: 0, realizedPnL: 0, marginUsed: 0 },
      );

      // Trigger load of positions and orders from Supabase DB
      await useTradingStore.getState().fetchPositionsAndOrders();
    } catch (err: any) {
      console.error('[useWalletSync] failed to load wallet:', err);
      setError(err?.message || 'Failed to load wallet');
      setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
    } finally {
      setLoading(false);
    }
  }, [setWallet]);

  useEffect(() => {
    refetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
      } else {
        refetch();
      }
    });

    if (!pollMs) {
      return () => subscription.unsubscribe();
    }

    const interval = window.setInterval(refetch, pollMs);
    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [pollMs, refetch, setWallet]);

  return { loading, error, refetch };
};
