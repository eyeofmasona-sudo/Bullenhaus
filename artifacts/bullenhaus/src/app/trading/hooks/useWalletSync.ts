import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTradingStore } from '../stores/tradingStore';
import { safeLegacyApiFetch, safeJson } from '../../../lib/backendMigration';

export const useWalletSync = (pollMs = 30000) => {
  const setWallet = useTradingStore((state) => state.setWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
        return;
      }

      const response = await safeLegacyApiFetch('/api/users?scope=wallet', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await safeJson<any>(response, {});
      if (!response.ok) throw new Error(result.message || 'Кошелёк временно недоступен во время миграции backend.');

      if (profile) {
        setWallet({
          balance:      Number(profile.balance ?? 0),
          realizedPnL:  Number(profile.realized_pnl ?? 0),
          marginUsed:   Number(profile.margin_used ?? 0),
        });
      } else {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
      }
    } catch {
      // Silently keep current wallet state on error
      setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
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