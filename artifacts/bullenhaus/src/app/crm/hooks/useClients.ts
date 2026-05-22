import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';

export interface CRMClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  totalBalance: number;
  tier: 'Titanium' | 'Platinum' | 'Silver';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kyc_status: string;
  updatedAt: string;
  createdAt: string;
}

function mapUser(u: any): CRMClient {
  const raw = u.full_name || u.email.split('@')[0];
  const parts = raw.trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ') || '';
  const balance = Number(u.balance) || 0;

  const tier: CRMClient['tier'] =
    balance >= 100_000 ? 'Titanium' :
    balance >= 10_000  ? 'Platinum' :
    'Silver';

  const riskScore: CRMClient['riskScore'] =
    balance === 0 ? 'LOW' :
    balance < 1_000 ? 'MEDIUM' :
    balance < 5_000 ? 'MEDIUM' :
    'LOW';

  return {
    id: u.id,
    firstName,
    lastName,
    email: u.email,
    phone: u.phone ?? null,
    company: null,
    totalBalance: balance,
    tier,
    riskScore,
    kyc_status: u.kyc_status ?? 'PENDING',
    updatedAt: u.updated_at ?? u.created_at,
    createdAt: u.created_at,
  };
}

export function useClients(page = 1, limit = 50, search = '') {
  const [data, setData]       = useState<CRMClient[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('users')
        .select('id, email, full_name, balance, kyc_status, created_at, updated_at')
        .eq('role', 'client')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: rows, error: dbError } = await q;
      if (dbError) throw new Error(dbError.message);

      const clients = (rows ?? []).map(mapUser);
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

export interface ClientTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  created_at: string;
}

export async function fetchClientTransactions(userId: string): Promise<ClientTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, status, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as ClientTransaction[];
}
