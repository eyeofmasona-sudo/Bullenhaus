import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  ShieldCheck, Search, RefreshCw, Loader2, FileText, Image as ImageIcon,
  Check, X, AlertTriangle, ArrowUp, User, Clock, History,
} from 'lucide-react';
import { useKycReviews, KYC_STATUSES, KYC_DECISIONS } from '../hooks/useKycReviews';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { supabase } from '../../../lib/supabase/browserClient';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

function StatusBadge({ status }: { status: string }) {
  const s = KYC_STATUSES.find((st) => st.value === status);
  return (
    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded" style={{ color: s?.color, backgroundColor: (s?.color || '#64748b') + '15' }}>
      {s?.label || status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Document preview (creates signed URL from kyc-documents bucket)
// ---------------------------------------------------------------------------
function KycDoc({ doc, userId }: { doc: any, userId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isImage = doc.contentType?.startsWith('image/');

  const load = async () => {
    if (url) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(doc.path, 1800);
      if (error) throw new Error(error.message);
      setUrl(data.signedUrl);
    } catch (e: any) {
      toast.error(`Failed to load ${doc.type}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const Icon = isImage ? ImageIcon : FileText;
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-white/5">
        <div className="flex items-center gap-1.5">
          <Icon size={10} className="text-gold/70" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-aura-platinum">{doc.type?.replace(/_/g, ' ')}</span>
        </div>
        <span className="text-[8px] text-aura-platinum/40 truncate max-w-[100px]">{doc.name}</span>
      </div>
      <div className="aspect-[4/3] bg-black/40 flex items-center justify-center">
        {isImage && url ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={doc.name} className="max-h-full max-w-full object-contain hover:opacity-80" />
          </a>
        ) : (
          <button onClick={load} disabled={loading} className="text-aura-platinum/50 hover:text-gold text-[10px]">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={20} />}
            <p className="mt-1">{loading ? 'Loading…' : 'View document'}</p>
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Row
// ---------------------------------------------------------------------------
function ClientRow({ client, onOpen, isActive }: { client: any, onOpen: () => void, isActive: boolean }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className={`group w-full text-left flex items-center gap-3 rounded-lg border p-3 transition-all ${
        isActive ? 'border-gold/40 bg-gold/5' : 'border-white/5 bg-[#15151A]/60 hover:border-white/10'
      }`}
    >
      <div className="p-2 rounded-lg bg-white/5 text-gold/70">
        <ShieldCheck size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-aura-platinum">{client.full_name || client.email}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-[10px] text-aura-platinum/50">{client.email}</span>
          {client.country && <span className="text-[9px] text-aura-platinum/40">· {client.country}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {client.docs.length > 0 && (
          <span className="text-[9px] text-gold/70 flex items-center gap-0.5">
            <FileText size={9} /> {client.docs.length}
          </span>
        )}
        <StatusBadge status={client.kyc_status} />
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Detail Drawer
// ---------------------------------------------------------------------------
function KycDetail({ client, reviews, loadingReviews, onClose, onSubmit }: {
  client: any;
  reviews: any[];
  loadingReviews: boolean;
  onClose: () => void;
  onSubmit: (decision: string, reason: string, flags: string[]) => Promise<void>;
}) {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [flags, setFlags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleFlag = (f: string) => {
    setFlags((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleSubmit = async () => {
    if (!decision) { toast.error('Select a decision'); return; }
    setSubmitting(true);
    try {
      await onSubmit(decision, reason, flags);
      toast.success(`KYC ${decision}`);
      setDecision(''); setReason(''); setFlags([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!client) return null;

  const commonFlags = ['name_mismatch', 'expired_document', 'low_quality', 'missing_selfie', 'missing_proof_of_address', 'suspicious_document'];

  return (
    <Drawer isOpen={!!client} onClose={onClose} title="KYC Review" width="max-w-2xl">
      <div className="space-y-4">
        {/* Client info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={client.kyc_status} />
            <span className="text-[10px] text-aura-platinum/50">Updated {timeAgo(client.updated_at)}</span>
          </div>
          <h3 className="font-serif text-xl text-aura-platinum">{client.full_name || client.email}</h3>
          <p className="text-[11px] text-aura-platinum/50">{client.email}</p>
          {client.agentName && <p className="text-[10px] text-gold/70 mt-0.5">Agent: {client.agentName}</p>}
        </div>

        {/* Documents */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-2">Documents ({client.docs.length})</p>
          {client.docs.length === 0 ? (
            <div className="rounded-lg border border-white/5 bg-black/30 p-6 text-center text-[11px] text-aura-platinum/40">
              No documents uploaded
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {client.docs.map((doc: any, i: number) => (
                <KycDoc key={i} doc={doc} userId={client.id} />
              ))}
            </div>
          )}
        </div>

        {/* Decision form */}
        <div className="rounded-lg border border-white/5 bg-black/20 p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60">Compliance Decision</p>

          {/* Decision buttons */}
          <div className="grid grid-cols-2 gap-2">
            {KYC_DECISIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDecision(d.value)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition ${
                  decision === d.value ? 'border-2' : 'border-white/10 hover:border-white/20'
                }`}
                style={decision === d.value ? { borderColor: d.color, color: d.color, backgroundColor: d.color + '15' } : {}}
              >
                {d.value === 'approved' && <Check size={12} />}
                {d.value === 'rejected' && <X size={12} />}
                {d.value === 'needs_more_info' && <AlertTriangle size={12} />}
                {d.value === 'escalated' && <ArrowUp size={12} />}
                {d.label}
              </button>
            ))}
          </div>

          {/* Risk flags */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-aura-platinum/50 mb-1.5">Risk Flags</p>
            <div className="flex flex-wrap gap-1.5">
              {commonFlags.map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  className={`text-[9px] px-2 py-0.5 rounded border transition ${
                    flags.includes(f) ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'text-aura-platinum/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  {f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Reason / notes for this decision…"
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
          />

          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || !decision} className="w-full">
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Submit Decision
          </Button>
        </div>

        {/* Review history */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-2 flex items-center gap-1.5">
            <History size={10} /> Review History
          </p>
          {loadingReviews ? (
            <div className="text-center py-3"><Loader2 size={14} className="animate-spin text-gold/40 mx-auto" /></div>
          ) : reviews.length === 0 ? (
            <p className="text-[11px] text-aura-platinum/40 text-center py-3">No reviews yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {reviews.map((r) => {
                const dec = KYC_DECISIONS.find((d) => d.value === r.decision);
                return (
                  <div key={r.id} className="rounded-lg border border-white/5 bg-[#15151A] p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: dec?.color, backgroundColor: (dec?.color || '#64748b') + '15' }}>
                        {dec?.label || r.decision}
                      </span>
                      <span className="text-[9px] text-aura-platinum/40">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-[10px] text-aura-platinum/60">By {r.reviewerName}</p>
                    {r.reason && <p className="text-[11px] text-aura-platinum/80 mt-1">{r.reason}</p>}
                    {Array.isArray(r.risk_flags) && r.risk_flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.risk_flags.map((f: string, i: number) => (
                          <span key={i} className="text-[8px] text-rose-400 bg-rose-500/10 px-1 rounded">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const KycReview = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const { clients, loading, error, refetch, selected, selectClient, reviews, loadingReviews, submitReview } = useKycReviews({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const pendingCount = useMemo(() => clients.filter((c) => c.kyc_status === 'PENDING').length, [clients]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-gradient-to-b from-gold to-gold/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">Compliance</span>
          </div>
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum">KYC Review</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-lg border border-white/8 bg-black/30 py-1.5 pl-9 pr-3 text-[12px] text-aura-platinum placeholder:text-aura-platinum/30 focus:border-gold/40 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/8 bg-black/30 px-3 py-1.5 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {KYC_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-400 text-sm">{error}</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-aura-platinum/40">
            <ShieldCheck size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No clients found</p>
            <p className="text-[10px] mt-1">Try changing the filter</p>
          </div>
        ) : (
          clients.map((c) => (
            <ClientRow
              key={c.id}
              client={c}
              onOpen={() => selectClient(c)}
              isActive={selected?.id === c.id}
            />
          ))
        )}
      </div>

      <KycDetail
        client={selected}
        reviews={reviews}
        loadingReviews={loadingReviews}
        onClose={() => selectClient(null)}
        onSubmit={async (decision, reason, flags) => {
          await submitReview(selected.id, decision, reason, flags);
        }}
      />
    </div>
  );
};
