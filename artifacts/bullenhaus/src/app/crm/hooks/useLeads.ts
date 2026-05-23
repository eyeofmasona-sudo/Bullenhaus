import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

const LEADS_SELECT = 'id, first_name, last_name, email, phone, stage, capacity, acquisition_source, notes, created_at';

function mapLead(row: any) {
  return {
    ...row,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    acquisitionSource: row.acquisition_source ?? {},
  };
}

export function useLeads(page = 1, limit = 50, search = '') {
  const [data, setData]       = useState<any[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('leads')
        .select(LEADS_SELECT)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: leads, error: dbError } = await q;
      if (dbError) throw new Error(dbError.message);

      const rows = (leads ?? []).map(mapLead);
      const grouped = {
        'New Inquiries': rows.filter((l: any) => l.stage === 'NEW_INQUIRY'),
        'In Discussion': rows.filter((l: any) => l.stage === 'IN_DISCUSSION'),
        'Pending KYC':   rows.filter((l: any) => l.stage === 'PENDING_KYC'),
        'Funded (FTD)':  rows.filter((l: any) => l.stage === 'FUNDED'),
      };

      setData(rows);
      setMeta({ page, limit, total: rows.length, grouped });
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  return { leads: data, meta, loading, error, refetch: fetchLeads };
}
