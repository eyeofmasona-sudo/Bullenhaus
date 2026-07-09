import { useState, useEffect, useCallback } from 'react';
import { getLeadCounts, getLeadsPage, getUsersLeadPage, searchLeads, updateLeadStatus, LEAD_PAGE_SIZE } from '../../trading/services/leadsService';

const LEAD_STAGE_DEFS = [
  ['New Inquiries', 'NEW_INQUIRY'],
  ['In Discussion', 'IN_DISCUSSION'],
  ['Pending KYC', 'PENDING_KYC'],
  ['Funded (FTD)', 'FUNDED'],
] as const;

const USER_STAGE_DEFS = [
  ['New Inquiries', 'NEW_INQUIRY'],
  ['Pending KYC', 'PENDING_KYC'],
  ['Approved', 'APPROVED'],
  ['Rejected', 'REJECTED'],
] as const;

function groupRows(rows: any[], defs: readonly (readonly [string, string])[]) {
  return Object.fromEntries(defs.map(([label, stage]) => [label, rows.filter((l: any) => l.stage === stage)]));
}

function countsFromGroups(grouped: Record<string, any[]>) {
  return Object.fromEntries(Object.entries(grouped).map(([label, rows]) => [label, rows.length]));
}

export function useLeads(page = 1, limit = 50, search = '') {
  const [data, setData]       = useState<any[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [stagePages, setStagePages] = useState<Record<string, number>>({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (search.trim().length >= 2) {
        const rows = await searchLeads(search);
        const derivedMode = rows.some((row: any) => row.pipelineSource === 'users');
        const grouped = groupRows(rows, derivedMode ? USER_STAGE_DEFS : LEAD_STAGE_DEFS);
        setData(rows);
        setStagePages({});
        setMeta({
          page,
          limit: Math.min(limit, 50),
          total: rows.length,
          grouped,
          stageCounts: countsFromGroups(grouped),
          searchMode: true,
          derivedMode,
          stageWritable: !derivedMode,
          hasMore: false,
        });
        return;
      }

      const [pageResults, countResults] = await Promise.all([
        Promise.allSettled(LEAD_STAGE_DEFS.map(([, stage]) => getLeadsPage({ stage, page: 0, pageSize: LEAD_PAGE_SIZE }))),
        Promise.allSettled(LEAD_STAGE_DEFS.map(([, stage]) => getLeadCounts({ stage }))),
      ]);

      const pages = pageResults.map((result) => result.status === 'fulfilled' ? result.value : null);
      const allLeadQueriesFailed = pages.every(pageResult => !pageResult);
      const leadRows = pages.flatMap(pageResult => pageResult?.rows ?? []);

      if (allLeadQueriesFailed || leadRows.length === 0) {
        const fallback = await getUsersLeadPage({ page: 0, pageSize: 100 });
        const grouped = groupRows(fallback.rows, USER_STAGE_DEFS);
        setData(fallback.rows);
        setStagePages({ users: 0 });
        setMeta({
          page: 1,
          limit: 100,
          total: fallback.count,
          grouped,
          stageCounts: countsFromGroups(grouped),
          searchMode: false,
          derivedMode: true,
          stageWritable: false,
          hasMore: fallback.hasMore,
        });
        return;
      }

      const grouped = Object.fromEntries(LEAD_STAGE_DEFS.map(([label], i) => [label, pages[i]?.rows ?? []]));
      const stageCounts = Object.fromEntries(LEAD_STAGE_DEFS.map(([label], i) => [
        label,
        countResults[i].status === 'fulfilled' ? countResults[i].value : (grouped[label]?.length ?? 0),
      ]));
      const rows = Object.values(grouped).flat();

      setData(rows);
      setStagePages(Object.fromEntries(LEAD_STAGE_DEFS.map(([label]) => [label, 0])));
      setMeta({
        page: 1,
        limit: LEAD_PAGE_SIZE,
        total: Object.values(stageCounts).reduce((s: number, n: any) => s + Number(n || 0), 0),
        grouped,
        stageCounts,
        searchMode: false,
        derivedMode: false,
        stageWritable: true,
        hasMore: false,
      });
    } catch (err: any) {
      console.error('[useLeads] Failed to load leads', err);
      setError('Unable to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  const loadMoreStage = useCallback(async (stageLabel: string) => {
    if (!meta || meta.searchMode) return;
    if (meta.derivedMode) {
      const nextPage = (stagePages.users ?? 0) + 1;
      const res = await getUsersLeadPage({ page: nextPage, pageSize: 100 });
      const nextGrouped = groupRows(res.rows, USER_STAGE_DEFS);
      setMeta((prev: any) => {
        const grouped = { ...(prev?.grouped ?? {}) };
        Object.entries(nextGrouped).forEach(([label, rows]) => {
          grouped[label] = [...(grouped[label] ?? []), ...(rows as any[])];
        });
        return {
          ...prev,
          grouped,
          stageCounts: countsFromGroups(grouped),
          hasMore: res.hasMore,
        };
      });
      setData((prev) => [...prev, ...res.rows]);
      setStagePages(prev => ({ ...prev, users: nextPage }));
      return;
    }

    const stageMap: Record<string, string> = {
      'New Inquiries': 'NEW_INQUIRY',
      'In Discussion': 'IN_DISCUSSION',
      'Pending KYC': 'PENDING_KYC',
      'Funded (FTD)': 'FUNDED',
    };
    const stage = stageMap[stageLabel];
    if (!stage) return;
    const nextPage = (stagePages[stageLabel] ?? 0) + 1;
    const res = await getLeadsPage({ stage, page: nextPage, pageSize: LEAD_PAGE_SIZE });
    setMeta((prev: any) => {
      const grouped = { ...(prev?.grouped ?? {}) };
      grouped[stageLabel] = [...(grouped[stageLabel] ?? []), ...res.rows];
      return { ...prev, grouped };
    });
    setData((prev) => [...prev, ...res.rows]);
    setStagePages(prev => ({ ...prev, [stageLabel]: nextPage }));
  }, [meta, stagePages]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  return { leads: data, meta, loading, error, refetch: fetchLeads, loadMoreStage };
}

export const LEAD_STAGES = [
  { value: 'NEW_INQUIRY',   label: 'New Inquiry'   },
  { value: 'IN_DISCUSSION', label: 'In Discussion' },
  { value: 'PENDING_KYC',   label: 'Pending KYC'   },
  { value: 'FUNDED',        label: 'Funded (FTD)'  },
] as const;

export type LeadStage = typeof LEAD_STAGES[number]['value'];

export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
  await updateLeadStatus(leadId, stage);
}
