import React, { useEffect, useState } from 'react';
import { UserX, Check, Search, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export const AdminKYC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, kyc_status, created_at, updated_at')
        .eq('kyc_status', 'PENDING');
      if (error) throw error;
      setQueue(data || []);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, email: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: 'VERIFIED' })
        .eq('id', id);
      if (error) throw error;
      toast.success(`KYC Approved for ${email}`);
      fetchQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KYC approval failed');
    }
  };

  const handleReject = async (id: string, email: string) => {
    if (!confirm('Reject KYC?')) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: 'REJECTED' })
        .eq('id', id);
      if (error) throw error;
      toast.success(`KYC Rejected for ${email}`);
      fetchQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KYC rejection failed');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text">KYC Review Queue</h2>
          <p className="text-sm text-text-dim mt-1">Approve or reject pending identity verifications.</p>
        </div>
        <div className="flex items-center gap-3">
        <button onClick={fetchQueue} className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Search request ID..."
            className="input-dark pl-10 pr-4 py-2 w-64"
          />
        </div>
        </div>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Submission Date</th>
              <th className="px-6 py-4">Documents</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {queue.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-mono text-text-muted text-xs">{item.id.substring(0,8)}...</td>
                <td className="px-6 py-4 font-bold text-white">{item.email}</td>
                <td className="px-6 py-4 text-text-muted">{new Date(item.updated_at || item.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {(item.documents || []).length === 0 ? (
                      <span className="text-xs text-rose-400">No files</span>
                    ) : item.documents.map((doc: any) => (
                      <a key={doc.path} href={doc.url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:text-white hover:border-rose-500/40">
                        <FileText size={12} /> {doc.name}
                      </a>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500">
                      Pending
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleApprove(item.id, item.email)} className="p-2 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"><Check size={16} /></button>
                    <button onClick={() => handleReject(item.id, item.email)} className="p-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><UserX size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <UserX size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">{loading ? 'Loading KYC queue...' : 'No pending KYC requests'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
