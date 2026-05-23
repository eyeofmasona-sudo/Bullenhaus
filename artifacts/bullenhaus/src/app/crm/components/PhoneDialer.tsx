import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, PhoneMissed, X, Minimize2, Maximize2, Delete, Clock, User } from "lucide-react";
import { supabase } from "../../../lib/supabase/browserClient";
import { logCall, updateCallLog } from "../hooks/useCallLogs";

// ── Types ────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'dialing' | 'ringing' | 'active' | 'ended';

interface RecentCall {
  id: string;
  phone: string;
  name?: string;
  status: string;
  duration: number;
  at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

const DIALPAD = [
  ['1', ''],  ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'],['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'],['8', 'TUV'],['9', 'WXYZ'],
  ['*', ''],  ['0', '+'],   ['#', ''],
] as const;

// Status colour map
const statusColor: Record<string, string> = {
  completed: 'text-aura-emerald',
  answered:  'text-aura-emerald',
  no_answer: 'text-aura-warning',
  busy:      'text-aura-warning',
  failed:    'text-aura-ruby',
  initiated: 'text-aura-platinum/50',
  ringing:   'text-aura-platinum/50',
};

// ── Component ────────────────────────────────────────────────────────────────

interface PhoneDialerProps {
  /** Pre-fill number + client info (from client cards) */
  prefill?: { phone: string; name?: string; clientId?: string } | null;
  onClearPrefill?: () => void;
}

export function PhoneDialer({ prefill, onClearPrefill }: PhoneDialerProps) {
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab]             = useState<'dialpad' | 'recent'>('dialpad');

  const [number, setNumber]       = useState('');
  const [callState, setCallState] = useState<CallState>('idle');
  const [elapsed, setElapsed]     = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);

  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef<number>(0);

  // Apply prefill when a client card triggers a call
  useEffect(() => {
    if (prefill) {
      setNumber(prefill.phone);
      setCurrentClientId(prefill.clientId ?? null);
      setCurrentName(prefill.name ?? null);
      setOpen(true);
      setMinimized(false);
      setTab('dialpad');
    }
  }, [prefill]);

  // Load recent calls when tab switches
  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    const { data } = await supabase
      .from('call_logs')
      .select('id, phone_number, status, duration_seconds, created_at, client:users!call_logs_client_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(30);
    setRecentCalls(
      (data ?? []).map((r: any) => ({
        id: r.id,
        phone: r.phone_number,
        name: r.client?.full_name ?? undefined,
        status: r.status,
        duration: r.duration_seconds,
        at: r.created_at,
      }))
    );
    setLoadingRecent(false);
  }, []);

  useEffect(() => {
    if (tab === 'recent' && open) loadRecent();
  }, [tab, open, loadRecent]);

  // Timer
  useEffect(() => {
    if (callState === 'active') {
      startRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Dialpad press
  const press = (digit: string) => {
    if (callState !== 'idle') return;
    setNumber(prev => (prev.length < 16 ? prev + digit : prev));
  };

  const backspace = () => {
    if (callState !== 'idle') return;
    setNumber(prev => prev.slice(0, -1));
  };

  // Initiate call
  const startCall = async () => {
    const phone = number.replace(/\D/g, '');
    if (!phone || callState !== 'idle') return;

    setCallState('dialing');
    setElapsed(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCallState('idle'); return; }

    const entry = await logCall({
      agentId:     user.id,
      clientId:    currentClientId,
      phoneNumber: phone,
      direction:   'outbound',
      status:      'initiated',
    });
    setCurrentCallId(entry?.id ?? null);

    // Simulate ringing → active (replace with real provider SDK later)
    setTimeout(() => setCallState('ringing'), 800);
    setTimeout(() => {
      setCallState('active');
      if (entry?.id) updateCallLog(entry.id, { status: 'answered' });
    }, 3000);
  };

  // End call
  const endCall = async () => {
    if (currentCallId) {
      const finalStatus = callState === 'ringing' ? 'no_answer' : 'completed';
      await updateCallLog(currentCallId, { status: finalStatus, duration_seconds: elapsed });
    }
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setElapsed(0);
      setCurrentCallId(null);
    }, 1500);
  };

  // Click-to-call from recent
  const redial = (phone: string) => {
    setNumber(phone);
    setTab('dialpad');
  };

  const handleClose = () => {
    if (callState === 'active' || callState === 'ringing' || callState === 'dialing') return;
    setOpen(false);
    setNumber('');
    setCurrentClientId(null);
    setCurrentName(null);
    onClearPrefill?.();
  };

  // ── Floating button ───────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open dialer"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-aura-emerald shadow-[0_0_24px_rgba(16,185,129,0.5)] hover:shadow-[0_0_32px_rgba(16,185,129,0.7)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        <Phone className="w-6 h-6 text-black" />
      </button>
    );
  }

  // ── Minimized pill ────────────────────────────────────────────────────────

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0E1012] border border-aura-emerald/40 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer" onClick={() => setMinimized(false)}>
        <span className={`w-2 h-2 rounded-full ${callState === 'active' ? 'bg-aura-emerald animate-pulse' : 'bg-aura-platinum/30'}`} />
        <span className="text-xs font-mono text-aura-platinum">
          {callState === 'active' ? fmtDuration(elapsed) : (number ? fmtPhone(number) : 'Dialer')}
        </span>
        <Maximize2 className="w-3.5 h-3.5 text-aura-platinum/50" />
      </div>
    );
  }

  // ── Full dialer panel ─────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] rounded-2xl border border-glass-border bg-[#0E1012] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border bg-black/30">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-aura-gold" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-aura-platinum">Phone</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="p-1.5 rounded hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleClose} disabled={callState === 'active' || callState === 'ringing' || callState === 'dialing'} className="p-1.5 rounded hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors disabled:opacity-30">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-glass-border">
        {(['dialpad', 'recent'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              tab === t ? 'text-aura-gold border-b-2 border-aura-gold -mb-px bg-aura-gold/5' : 'text-aura-platinum/40 hover:text-aura-platinum'
            }`}
          >
            {t === 'dialpad' ? 'Dialpad' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'dialpad' && (
        <div className="p-4 space-y-4">

          {/* Active call status bar */}
          {callState !== 'idle' && callState !== 'ended' && (
            <div className={`rounded-lg px-3 py-2 text-center text-[11px] font-mono border ${
              callState === 'active'  ? 'border-aura-emerald/30 bg-aura-emerald/10 text-aura-emerald' :
              callState === 'ringing' ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400' :
              'border-glass-border bg-black/20 text-aura-platinum/50'
            }`}>
              {callState === 'dialing'  && '⬤ Dialing…'}
              {callState === 'ringing'  && '⬤ Ringing…'}
              {callState === 'active'   && `⬤ ${fmtDuration(elapsed)}`}
            </div>
          )}
          {callState === 'ended' && (
            <div className="rounded-lg px-3 py-2 text-center text-[11px] font-mono border border-glass-border bg-black/20 text-aura-platinum/40">
              Call ended
            </div>
          )}

          {/* Client name tag */}
          {currentName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aura-gold/10 border border-aura-gold/20">
              <User className="w-3 h-3 text-aura-gold" />
              <span className="text-[11px] text-aura-gold truncate">{currentName}</span>
            </div>
          )}

          {/* Number display */}
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-center">
              <span className="text-xl font-mono tracking-widest text-aura-platinum">
                {number ? fmtPhone(number) : <span className="text-aura-platinum/20">Enter number</span>}
              </span>
            </div>
            {number && callState === 'idle' && (
              <button onClick={backspace} className="p-2 text-aura-platinum/40 hover:text-aura-platinum transition-colors">
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dialpad grid */}
          <div className="grid grid-cols-3 gap-2">
            {DIALPAD.map(([digit, sub]) => (
              <button
                key={digit}
                onMouseDown={() => press(digit)}
                disabled={callState !== 'idle'}
                className="flex flex-col items-center justify-center h-12 rounded-xl border border-glass-border bg-black/20 hover:bg-white/5 hover:border-aura-gold/20 active:bg-aura-gold/10 transition-all disabled:opacity-40 select-none"
              >
                <span className="text-sm font-medium text-aura-platinum leading-none">{digit}</span>
                {sub && <span className="text-[7px] text-aura-platinum/30 tracking-widest mt-0.5">{sub}</span>}
              </button>
            ))}
          </div>

          {/* Call / End button */}
          <div className="flex justify-center pt-1">
            {callState === 'idle' || callState === 'ended' ? (
              <button
                onClick={startCall}
                disabled={!number || callState === 'ended'}
                className="h-14 w-14 rounded-full bg-aura-emerald hover:bg-aura-emerald/90 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6)] flex items-center justify-center transition-all disabled:opacity-30 disabled:shadow-none"
              >
                <Phone className="w-6 h-6 text-black" />
              </button>
            ) : (
              <button
                onClick={endCall}
                className="h-14 w-14 rounded-full bg-aura-ruby hover:bg-aura-ruby/90 shadow-[0_0_20px_rgba(251,113,133,0.4)] flex items-center justify-center transition-all animate-pulse"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'recent' && (
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          {loadingRecent ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-xs text-aura-platinum/30 animate-pulse">Loading…</span>
            </div>
          ) : recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <PhoneMissed className="w-8 h-8 text-aura-platinum/10" />
              <span className="text-xs text-aura-platinum/30">No call history yet</span>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {recentCalls.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 group transition-colors">
                  <div className={`shrink-0 ${statusColor[c.status] ?? 'text-aura-platinum/30'}`}>
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-aura-platinum truncate">
                      {c.name ?? fmtPhone(c.phone)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-aura-platinum/30 font-mono">{fmtPhone(c.phone)}</span>
                      {c.duration > 0 && (
                        <>
                          <span className="text-aura-platinum/20">·</span>
                          <span className="text-[9px] text-aura-platinum/30 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{fmtDuration(c.duration)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[8px] text-aura-platinum/20 mt-0.5">
                      {new Date(c.at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => redial(c.phone)}
                    title="Redial"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-aura-emerald/10 text-aura-emerald hover:bg-aura-emerald/20 transition-all"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
