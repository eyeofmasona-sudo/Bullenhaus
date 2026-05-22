import { useState, useEffect, useCallback } from 'react';
import { fetchTable } from '../../../lib/supabase/frontendData';

export function useClients(page = 1, limit = 50, search = '') {
  const [data, setData]       = useState<any[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: clients, error: dbError } = await fetchTable<any>('clients', (q) =>
        q.select('*').or(`full_name.ilike.%${search}%,email.ilike.%${search}%`).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
      );
      if (dbError) throw new Error(dbError);

      setData(clients);
      setMeta({ page, limit, total: clients.length });
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchClients().catch(() => {});
  }, [fetchClients]);

  return { clients: data, meta, loading, error, refetch: fetchClients };
}
