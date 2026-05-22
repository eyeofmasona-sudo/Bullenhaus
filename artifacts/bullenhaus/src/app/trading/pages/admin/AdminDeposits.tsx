import React, { useEffect, useState } from 'react';
import { Download, MessageSquare, RefreshCw, Users } from 'lucide-react';
import { TxStatus } from '../../stores/transactionStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export const AdminDeposits = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const deposits = requests.filter(r => r.type === 'Deposit');
  const [instructionTexts, setInstructionTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id: string, status: TxStatus) => {
    try {
      const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success(`Request marked as ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update request');
    }
  };

  const handleSendInstructions = async (id: string) => {
    const text = instructionTexts[id];
    if (!text?.trim()) { toast.error('Instructions cannot be empty'); return; }
    try {
      const { error } = await supabase.from('transactions').update({ instructions: text }).eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(req => req.id === id ? { ...req, instructions: text } : req));
      toast.success('Instructions sent to client');
      setInstructionTexts(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send instructions');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text flex items-center gap-3">
            <Download className="text-success" size={22} /> Deposit Requests
          </h2>
          <p className="text-sm text-text-muted mt-1">Review and approve incoming deposit requests.</p>
        </div>
        <button onClick={fetchRequests} className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4 font-bold">User</th>
              <th className="px-6 py-4 font-bold">Amount</th>
              <th className="px-6 py-4 font-bold">Method</th>
              <th className="px-6 py-4 font-bold">Status / Instructions</th>
              <th className="px-6 py-4 font-bold">Created</th>
              <th className="px-6 py-4 font-bold">Updated</th>
              <th className="px-6 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {deposits.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <Users size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">
                      {loading ? 'Loading deposits...' : 'No deposit requests'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : deposits.map(req => (
              <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-text font-sans">{req.user_name || '—'}</p>
                  <p className="text-[10px] text-text-dim mt-0.5">{req.user_email || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-text font-bold">${Number(req.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-text-dim">{req.currency || 'USD'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface border border-border text-text-muted">
                    {req.method || 'Other'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mb-2 inline-block ${
                    req.status === 'Completed' || req.status === 'Approved' ? 'bg-success/10 text-success' :
                    req.status === 'Pending' ? 'bg-warning/10 text-warning' :
                    req.status === 'Rejected' ? 'bg-danger/10 text-danger' :
                    'bg-info/10 text-info'
                  }`}>{req.status}</span>
                  {req.instructions ? (
                    <p className="text-[10px] text-text-muted max-w-[200px] truncate">
                      <span className="text-success font-bold">Sent: </span>{req.instructions}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1 w-[200px]">
                      <input
                        type="text"
                        placeholder="Card, IBAN, or payment link..."
                        value={instructionTexts[req.id] || ''}
                        onChange={e => setInstructionTexts(p => ({ ...p, [req.id]: e.target.value }))}
                        className="input-dark py-1 text-[10px]"
                      />
                      {instructionTexts[req.id] && (
                        <button onClick={() => handleSendInstructions(req.id)} className="btn-gold py-1 text-[10px] flex items-center justify-center gap-1">
                          <MessageSquare size={10} /> Send
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-text-dim">
                  {req.created_at ? new Date(req.created_at).toLocaleString() : '—'}
                </td>
                <td className="px-6 py-4 text-text-dim">
                  {req.updated_at ? new Date(req.updated_at).toLocaleString() : '—'}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleAction(req.id, 'Completed')} className="px-3 py-1 rounded bg-success/10 text-success hover:bg-success/20 font-bold text-[10px] uppercase transition-all">
                    Approve
                  </button>
                  <button onClick={() => handleAction(req.id, 'Rejected')} className="px-3 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 font-bold text-[10px] uppercase transition-all">
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
