import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { supabase } from '../../lib/supabase';
import { safeLegacyApiFetch, safeJson } from '../../../../lib/backendMigration';

export const Transactions = () => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState('All');
  const { requests } = useTransactionStore();
  const [user, setUser] = useState<any>(null);
  const [serverRequests, setServerRequests] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Pull transactions from Supabase for this user
  useEffect(() => {
    const loadMine = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session?.access_token) return;
        const response = await safeLegacyApiFetch('/api/transactions?scope=mine', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) return;
        const result = await safeJson<any>(response, {});
        setServerRequests(result.transactions || []);
      } catch {
        // Silent failure: local store still renders previously created requests.
      }
    };
    loadMine();
    const interval = window.setInterval(loadMine, 8000);
    return () => window.clearInterval(interval);
  }, []);

  // Prefer server records (authoritative for status / admin instructions),
  // fall back to the local zustand store (covers the brief moment right after submit).
  const baseList = serverRequests.length > 0
    ? serverRequests.map((req: any) => ({
        id: req.id,
        userId: req.user_id,        // Supabase snake_case
        userEmail: req.user_email,
        userName: req.user_name,
        type: req.type,
        amount: req.amount,
        currency: req.currency || 'USD',
        method: req.method,
        instructions: req.instructions,
        status: req.status,
        date: req.created_at,       // Supabase uses created_at, not date
      }))
    : requests.filter(req => req.userId === (user?.id || 'unknown') || !user);

  // Format real requests
  const myRequests = baseList
    .map(req => ({
      ...req,
      asset: req.currency,
      tx: req.id.slice(0, 8),
      date: req.date ? new Date(req.date).toLocaleString() : '—',
      valAmount: req.type === 'Withdrawal' ? -req.amount : req.amount
    }));

  const transactions = myRequests.filter((tx: any) => {
    if (filter === 'All') return true;
    if (filter === 'Deposits' && tx.type === 'Deposit') return true;
    if (filter === 'Withdrawals' && tx.type === 'Withdrawal') return true;
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'Pending':
        return 'bg-orange-500/10 text-orange-500';
      case 'Processing':
        return 'bg-blue-500/10 text-blue-500';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl font-light italic tracking-tight text-text mb-8">{t('transactions')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-8">
          <div className="md:col-span-8 flex gap-2 bg-surface p-1 rounded-xl w-fit border border-border">
            {['All', 'Deposits', 'Withdrawals'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-gold text-black shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="md:col-span-4 relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
             <input type="text" placeholder={t('search')} className="input-dark py-2 pl-9 text-xs" />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Asset</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Admin Response</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Ref</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                        <ArrowDownLeft size={20} className="text-text-dim" />
                      </div>
                      <p className="text-sm font-medium text-text-muted">No transactions yet</p>
                      <p className="text-xs text-text-dim">Your deposit and withdrawal history will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {tx.type === 'Deposit' && <ArrowDownLeft size={14} className="text-success" />}
                       {tx.type === 'Withdrawal' && <ArrowUpRight size={14} className="text-danger" />}
                       <span className="font-bold text-text">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-text-muted">{tx.asset}</td>
                  <td className={`px-6 py-4 font-mono font-bold ${tx.valAmount > 0 ? 'text-success' : 'text-danger'}`}>
                    {tx.valAmount > 0 ? '+' : ''}{tx.valAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-text-muted text-xs">{(tx as any).method || '—'}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(tx.status)}`}>
                       {tx.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted max-w-[220px]">
                    {(tx as any).instructions
                      ? <span className="font-mono break-words whitespace-pre-wrap">{(tx as any).instructions}</span>
                      : <span className="text-text-dim italic">Pending review</span>}
                  </td>
                  <td className="px-6 py-4 text-text-dim text-xs">{tx.date}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gold/70 hover:text-gold cursor-pointer transition-colors">{tx.tx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};