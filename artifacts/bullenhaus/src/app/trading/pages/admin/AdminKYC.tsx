import React, { useEffect, useState } from 'react';
import {
  UserX, Check, RefreshCw, ShieldCheck, Eye, Download,
  FileText, Image as ImageIcon, ChevronDown, ChevronUp,
  DollarSign, Clock, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface KycDoc {
  type: string;
  name: string;
  path: string;
  contentType: string;
}

interface KycUser {
  id: string;
  email: string;
  full_name: string | null;
  kyc_status: string;
  kyc_documents: KycDoc[] | null;
  balance: number | null;
  created_at: string;
  updated_at: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    PENDING:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    VERIFIED:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
    UNVERIFIED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${map[status] || map.UNVERIFIED}`}>
      {status}
    </span>
  );
};

const DocViewer: React.FC<{ doc: KycDoc; userId: string }> = ({ doc, userId }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (url) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.path, 60 * 30);
      if (error) throw error;
      setUrl(data.signedUrl);
    } catch (e: any) {
      toast.error(`Could not load: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isImage = doc.contentType?.startsWith('image/');
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/8">
      <Icon size={14} className="text-text-dim shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{doc.type.replace('_', ' ')}</p>
        <p className="text-[10px] text-text-dim truncate">{doc.name}</p>
      </div>
      <div className="flex gap-1">
        {isImage && url ? (
          <a href={url} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-primary/10 text-text-muted hover:text-accent-primary transition-all"
            title="View">
            <Eye size={12} />
          </a>
        ) : (
          <button onClick={load} disabled={loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-primary/10 text-text-muted hover:text-accent-primary transition-all disabled:opacity-40"
            title="Load URL">
            {loading
              ? <span className="block w-3 h-3 border border-text-dim border-t-transparent rounded-full animate-spin" />
              : <Eye size={12} />}
          </button>
        )}
        {url && (
          <a href={url} download={doc.name}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-secondary/10 text-text-muted hover:text-accent-secondary transition-all"
            title="Download">
            <Download size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

const KycRow: React.FC<{
  item: KycUser;
  onApprove: (id: string, email: string) => void;
  onReject:  (id: string, email: string) => void;
}> = ({ item, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const docs: KycDoc[] = Array.isArray(item.kyc_documents) ? item.kyc_documents : [];

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-6 py-4">
          <p className="font-bold text-text text-sm">{item.full_name || '—'}</p>
          <p className="text-[10px] text-text-dim mt-0.5">{item.email}</p>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={item.kyc_status} />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-accent-secondary" />
            <span className="font-mono font-bold text-text text-sm">
              {item.balance != null
                ? Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '0.00'}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${docs.length > 0 ? 'text-accent-primary' : 'text-text-dim'}`}>
            <FileText size={11} /> {docs.length} file{docs.length !== 1 ? 's' : ''}
          </span>
        </td>
        <td className="px-6 py-4 text-text-dim text-xs font-mono">
          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
        </td>
        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-2 items-center">
            <button
              onClick={() => onApprove(item.id, item.email)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold text-[10px] uppercase tracking-wider transition-all"
            >
              <Check size={11} /> Approve
            </button>
            <button
              onClick={() => onReject(item.id, item.email)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-bold text-[10px] uppercase tracking-wider transition-all"
            >
              <XCircle size={11} /> Reject
            </button>
            <span className="text-text-dim ml-1">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="px-6 pb-4 pt-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  {docs.length === 0 ? (
                    <p className="text-xs text-text-dim text-center py-2">No documents uploaded yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {docs.map((doc, i) => (
                        <DocViewer key={i} doc={doc} userId={item.id} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

export const AdminKYC = () => {
  const [users, setUsers]     = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState<'PENDING' | 'ALL'>('PENDING');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('users')
        .select('id, email, full_name, kyc_status, kyc_documents, balance, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (filter === 'PENDING') q = q.eq('kyc_status', 'PENDING');
      const { data, error } = await q;
      if (error) throw error;
      setUsers(data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const handleApprove = async (id: string, email: string) => {
    try {
      const { error } = await supabase.from('users').update({ kyc_status: 'VERIFIED' }).eq('id', id);
      if (error) throw error;
      toast.success(`KYC approved for ${email}`);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string, email: string) => {
    if (!confirm(`Reject KYC for ${email}?`)) return;
    try {
      const { error } = await supabase.from('users').update({ kyc_status: 'REJECTED' }).eq('id', id);
      if (error) throw error;
      toast.success(`KYC rejected for ${email}`);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Rejection failed');
    }
  };

  const pendingCount = users.filter(u => u.kyc_status === 'PENDING').length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text flex items-center gap-3">
            <ShieldCheck className="text-accent-primary" size={22} /> KYC Review
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Review client identity documents and approve or reject verifications.
            {filter === 'PENDING' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px] font-bold">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-black/30 border border-border rounded-xl">
            {(['PENDING', 'ALL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                {f === 'PENDING' ? <><Clock size={10} className="inline mr-1" />Pending</> : 'All Users'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">KYC Status</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Documents</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <UserX size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">
                      {loading ? 'Loading...' : filter === 'PENDING' ? 'No pending KYC requests' : 'No users found'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : users.map(item => (
              <KycRow
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
