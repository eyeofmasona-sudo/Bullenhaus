import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

const LEADS_SELECT = 'id, first_name, last_name, email, phone, country, stage, capacity, acquisition_source, notes, created_at';

function mapLead(row: any) {
  return {
    ...row,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    country: row.country ?? row.acquisition_source?.country ?? null,
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
      // Supabase/PostgREST caps a single request to a page window, so the
      // board previously showed only the first slice. Page through ALL
      // matching leads in chunks so the full base is visible.
      const CHUNK = 1000;
      const SAFETY_MAX = 100_000;
      let from = 0;
      let all: any[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        let q = supabase
          .from('leads')
          .select(LEADS_SELECT)
          .order('created_at', { ascending: false })
          .range(from, from + CHUNK - 1);

        if (search) {
          q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: chunk, error: dbError } = await q;
        if (dbError) throw new Error(dbError.message);

        const batch = chunk ?? [];
        all = all.concat(batch);
        if (batch.length < CHUNK || from + CHUNK >= SAFETY_MAX) break;
        from += CHUNK;
      }

      const rows = all.map(mapLead);
      const grouped = {
        'New':              rows.filter((l: any) => l.stage === 'NEW'),
        'No Answer':        rows.filter((l: any) => l.stage === 'NO_ANSWER'),
        'In Progress':      rows.filter((l: any) => l.stage === 'IN_PROGRESS'),
        'Awaiting Deposit': rows.filter((l: any) => l.stage === 'AWAITING_DEPOSIT'),
        'Deposited':        rows.filter((l: any) => l.stage === 'DEPOSITED'),
        'Closed':           rows.filter((l: any) => l.stage === 'CLOSED'),
        'Lost':             rows.filter((l: any) => l.stage === 'LOST'),
      };

      setData(rows);
      setMeta({ page: 1, limit: rows.length, total: rows.length, grouped });
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  return { leads: data, meta, loading, error, refetch: fetchLeads };
}

export const LEAD_STAGES = [
  { value: 'NEW',              label: 'New'              },
  { value: 'NO_ANSWER',        label: 'No Answer'        },
  { value: 'IN_PROGRESS',      label: 'In Progress'      },
  { value: 'AWAITING_DEPOSIT', label: 'Awaiting Deposit' },
  { value: 'DEPOSITED',        label: 'Deposited'        },
  { value: 'CLOSED',           label: 'Closed'           },
  { value: 'LOST',             label: 'Lost'             },
] as const;

export type LeadStage = typeof LEAD_STAGES[number]['value'];

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ stage })
    .eq('id', leadId);
  if (error) throw new Error(error.message);
}

// UI/UX update: 2026-07-01T12:41:59Z
