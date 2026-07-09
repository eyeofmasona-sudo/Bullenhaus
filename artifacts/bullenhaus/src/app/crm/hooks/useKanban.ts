import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

// 7-stage pipeline (matches migration 24)
export const KANBAN_STAGES = [
  { value: 'NEW',              label: 'New',            color: '#64748b' },
  { value: 'NO_ANSWER',        label: 'No Answer',      color: '#f59e0b' },
  { value: 'IN_PROGRESS',      label: 'In Progress',    color: '#3b82f6' },
  { value: 'AWAITING_DEPOSIT', label: 'Awaiting Deposit', color: '#a855f7' },
  { value: 'DEPOSITED',        label: 'Deposited',      color: '#10b981' },
  { value: 'CLOSED',           label: 'Closed',         color: '#06b6d4' },
  { value: 'LOST',             label: 'Lost',           color: '#ef4444' },
] as const;

export type KanbanStage = typeof KANBAN_STAGES[number]['value'];

const LEADS_SELECT = 'id, first_name, last_name, email, phone, country, stage, capacity, acquisition_source, notes, created_at, assigned_agent_id';

function mapLead(row: any) {
  return {
    ...row,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    country: row.country ?? row.acquisition_source?.country ?? null,
    acquisitionSource: row.acquisition_source ?? {},
  };
}

export interface KanbanFilters {
  agentId?: string | null;
  source?: string | null;
  search?: string;
  vipOnly?: boolean;
}

export function useKanban(filters: KanbanFilters = {}) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const CHUNK = 1000;
      let from = 0;
      let all: any[] = [];

      while (true) {
        let q = supabase
          .from('leads')
          .select(LEADS_SELECT)
          .order('created_at', { ascending: false })
          .range(from, from + CHUNK - 1);

        if (filters.search) {
          q = q.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
        if (filters.agentId) {
          q = q.eq('assigned_agent_id', filters.agentId);
        }
        if (filters.source) {
          q = q.eq('acquisition_source->>channel', filters.source);
        }

        const { data: chunk, error: dbError } = await q;
        if (dbError) throw new Error(dbError.message);

        const batch = chunk ?? [];
        all = all.concat(batch);
        if (batch.length < CHUNK) break;
        from += CHUNK;
      }

      setLeads(all.map(mapLead));
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.agentId, filters.source]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  // Group leads by stage
  const grouped: Record<string, any[]> = {};
  for (const s of KANBAN_STAGES) grouped[s.value] = [];
  for (const lead of leads) {
    const stage = lead.stage || 'NEW';
    if (grouped[stage]) grouped[stage].push(lead);
  }

  // Move a lead to a new stage (DnD). Logs to lead_stage_history.
  const moveLead = useCallback(async (leadId: string, fromStage: string, toStage: KanbanStage) => {
    if (fromStage === toStage) return;
    setMoving(leadId);
    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: toStage } : l));
    try {
      const { error: updErr } = await supabase
        .from('leads')
        .update({ stage: toStage })
        .eq('id', leadId);
      if (updErr) throw new Error(updErr.message);

      // Log to history (best-effort, non-blocking)
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('lead_stage_history').insert({
        lead_id: leadId,
        from_stage: fromStage,
        to_stage: toStage,
        changed_by: user?.id || null,
      });
    } catch (err: any) {
      // Revert on error
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: fromStage } : l));
      setError(err.message);
      throw err;
    } finally {
      setMoving(null);
    }
  }, []);

  // Stage counters
  const counts: Record<string, number> = {};
  for (const s of KANBAN_STAGES) counts[s.value] = grouped[s.value]?.length || 0;

  return { leads, grouped, counts, loading, error, moving, refetch: fetchLeads, moveLead };
}
