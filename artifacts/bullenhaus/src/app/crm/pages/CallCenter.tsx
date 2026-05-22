import React, { useState, useEffect, useRef } from "react";
import { Phone, MicOff, Settings2, PlayCircle, BarChart2, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { useLeads } from "../hooks/useLeads";
import { supabase } from "../../../lib/supabase/browserClient";
import { useI18n } from "../lib/i18n";

const callVolume = [
  { time: "08:00", volume: 12 },
  { time: "09:00", volume: 45 },
  { time: "10:00", volume: 68 },
  { time: "11:00", volume: 82 },
  { time: "12:00", volume: 55 },
  { time: "13:00", volume: 48 },
  { time: "14:00", volume: 70 },
  { time: "15:00", volume: 90 },
];

// Outcome → next stage mapping
const OUTCOME_STAGE: Record<string, string> = {
  ftd:          'FUNDED',
  callback:     'IN_DISCUSSION',
  notinterested:'NEW_INQUIRY',
  noanswer:     'NEW_INQUIRY',
};

export function CallCenter() {
  const { t } = useI18n();
  const { leads, loading: leadsLoading, refetch } = useLeads(1, 20);
  const [isEndCallModalOpen, setIsEndCallModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<string>('ftd');
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Timer state (running demo clock)
  const [seconds, setSeconds] = useState(262); // start at 04:22
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const timerStr = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isEndCallModalOpen) {
      setIsAiProcessing(true);
      timer = setTimeout(() => setIsAiProcessing(false), 1500);
    }
    return () => clearTimeout(timer);
  }, [isEndCallModalOpen]);

  // Queue: leads that are NEW_INQUIRY or IN_DISCUSSION
  const queueLeads = leads.filter(
    (l) => l.stage === 'NEW_INQUIRY' || l.stage === 'IN_DISCUSSION'
  );

  // First queued lead becomes the target of the "save" action
  const activeQueueLead = queueLeads[0] ?? null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!activeQueueLead) {
      setIsEndCallModalOpen(false);
      return;
    }
    setSaving(true);
    const newStage = OUTCOME_STAGE[outcome] ?? 'IN_DISCUSSION';
    const notes = notesRef.current?.value ?? '';
    await supabase
      .from('leads')
      .update({ stage: newStage, ...(notes ? { notes } : {}) })
      .eq('id', activeQueueLead.id);
    await refetch();
    setSaving(false);
    setIsEndCallModalOpen(false);
  }

  const activeLeadName = activeQueueLead
    ? `${activeQueueLead.firstName ?? ''} ${activeQueueLead.lastName ?? ''}`.trim()
    : 'Victor Lebedev';
  const activeLeadInitials = activeQueueLead
    ? `${(activeQueueLead.firstName ?? '')[0] ?? ''}${(activeQueueLead.lastName ?? '')[0] ?? ''}`.toUpperCase()
    : 'VL';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
           <div className="bg-aura-emerald/10 text-aura-emerald border border-aura-emerald/20 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-aura-emerald animate-pulse"></span>
             {t('readyDialer')}
           </div>
           <div className="text-aura-platinum/30 text-[10px] font-bold uppercase tracking-widest">
             {leadsLoading ? 'Loading…' : `${queueLeads.length} ${t('queueLeads')}`}
           </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Settings2 className="w-3.5 h-3.5" /> {t('dialerSettings')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Call Workspace */}
        <div className="xl:col-span-2 rounded-xl border border-glass-border bg-[#121214] p-8 flex flex-col justify-between relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-aura-gold/5 blur-[80px] pointer-events-none rounded-full" />

          <div>
             <div className="flex items-center justify-between mb-8 border-b border-glass-border pb-4">
               <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60">{t('activeCall').toUpperCase()}</h3>
               <div className="flex items-center gap-2 text-aura-platinum/60 font-mono text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-aura-ruby animate-pulse mr-1"></span>
                  {timerStr}
               </div>
             </div>

             <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
               <div className="w-20 h-20 shrink-0 rounded-full bg-black/40 border-2 border-aura-gold flex items-center justify-center text-2xl font-display text-aura-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                 {activeLeadInitials}
               </div>
               <div>
                  <h2 className="text-2xl sm:text-3xl font-medium text-aura-platinum mb-2">{activeLeadName}</h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    <span className="text-aura-gold-light tracking-widest">
                      {activeQueueLead
                        ? activeQueueLead.stage === 'NEW_INQUIRY' ? 'New Inquiry' : 'In Discussion'
                        : 'Platinum VIP'}
                    </span>
                    <span className="text-aura-platinum/30 hidden sm:inline">•</span>
                    <span className="text-aura-platinum/70 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {activeQueueLead?.phone ?? activeQueueLead?.email ?? '+41 79 123 45 67'}
                    </span>
                  </div>
               </div>
             </div>

             {/* AI Script / Next Best Action */}
             <div className="rounded border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md mt-10">
                <div className="text-[10px] text-aura-gold font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" /> {t('aiRecommendedApproach').toUpperCase()}
                </div>
                <div className="rounded bg-black/40 p-4 border border-glass-border">
                  <p className="text-aura-platinum/90 text-xs sm:text-sm leading-relaxed mb-4">
                    {activeQueueLead?.stage === 'IN_DISCUSSION'
                      ? `${activeLeadName} is already in discussion. Focus on next steps — KYC documents, funding capacity, and risk profile. Do not restart the introduction.`
                      : `${activeLeadName} is a new inquiry. Begin with rapport-building. Ask about their trading experience and investment goals before presenting any product.`
                    }
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm">Send Index Brochure</Button>
                    <Button variant="secondary" size="sm">Offer Analyst Call</Button>
                  </div>
                </div>
             </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-glass-border relative z-10">
             <button className="w-12 h-12 rounded border border-white/5 bg-black/40 hover:bg-white/10 flex items-center justify-center text-aura-platinum hover:text-aura-gold transition-colors backdrop-blur-sm shadow-lg">
               <MicOff className="w-5 h-5" />
             </button>
             <button 
               className="w-14 h-14 rounded bg-aura-ruby text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-[0_0_20px_rgba(251,113,133,0.3)]"
               onClick={() => setIsEndCallModalOpen(true)}
             >
               <Phone className="w-6 h-6 rotate-[135deg]" />
             </button>
             <button className="w-12 h-12 rounded border border-white/5 bg-black/40 hover:bg-white/10 flex items-center justify-center text-aura-platinum hover:text-aura-gold transition-colors backdrop-blur-sm shadow-lg">
               <Settings2 className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Queue Sidebar */}
        <div className="space-y-6">
           <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
             <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 mb-4 uppercase">{t('callQueue')}</h3>
             <div className="space-y-3">
               {leadsLoading ? (
                 <div className="text-[10px] text-aura-platinum/30 uppercase tracking-widest text-center py-4">Loading leads…</div>
               ) : queueLeads.length === 0 ? (
                 <div className="text-[10px] text-aura-platinum/30 uppercase tracking-widest text-center py-4">Queue empty</div>
               ) : (
                 queueLeads.slice(0, 6).map((lead, i) => {
                   const name = `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || 'Unknown';
                   const isAlert = lead.stage === 'IN_DISCUSSION';
                   const typeLabel = lead.stage === 'IN_DISCUSSION' ? 'Follow-up' : 'New Inquiry';
                   return (
                     <QueueItem
                       key={lead.id}
                       name={name}
                       index={i + 1}
                       type={typeLabel}
                       alert={isAlert}
                     />
                   );
                 })
               )}
             </div>
           </div>

           <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
             <h3 className="text-[10px] uppercase tracking-widest font-bold text-aura-platinum/60 mb-4 flex items-center gap-2">
               <BarChart2 className="w-4 h-4 text-aura-gold" /> Pulse
             </h3>
             <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={callVolume}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="volume" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

      </div>

      <Modal
        isOpen={isEndCallModalOpen}
        onClose={() => setIsEndCallModalOpen(false)}
        title={t('wrapUpCall')}
        subtitle={`${activeLeadName} (${timerStr})`}
      >
        <form className="space-y-6" onSubmit={handleSave}>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">{t('callOutcome')}</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ftd',          label: 'Interested / FTD' },
                { value: 'callback',     label: 'Call Back' },
                { value: 'notinterested', label: 'Not Interested' },
                { value: 'noanswer',     label: 'No Answer' },
              ].map((opt) => (
                <label key={opt.value} className="border border-glass-border bg-black/40 hover:bg-white/5 p-3 rounded cursor-pointer transition-colors flex items-center gap-2">
                  <input
                    type="radio"
                    name="outcome"
                    value={opt.value}
                    checked={outcome === opt.value}
                    onChange={() => setOutcome(opt.value)}
                    className="accent-aura-gold"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">{t('aiSummaryNotes')}</label>
             {isAiProcessing ? (
               <div className="w-full bg-black/40 border border-glass-border rounded px-4 py-6 border-l-2 border-l-aura-gold/50 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-aura-gold/5 to-transparent animate-[shimmer_2s_infinite]"></div>
                 <Sparkles className="w-5 h-5 text-aura-gold animate-pulse" />
                 <span className="text-[10px] uppercase tracking-widest text-aura-platinum/60 font-mono animate-pulse">AI processing transcript...</span>
               </div>
             ) : (
               <textarea
                 ref={notesRef}
                 className="w-full bg-black/40 border border-glass-border rounded px-4 py-3 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors h-24 shadow-inner"
                 defaultValue={`Called ${activeLeadName}. ${outcome === 'ftd' ? 'Client showed strong interest in funding.' : outcome === 'callback' ? 'Client requested a callback.' : 'No commitment at this stage.'}`}
               />
             )}
          </div>

          <div className="pt-4 border-t border-glass-border flex justify-end gap-3 flex-col sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setIsEndCallModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" variant="primary" disabled={isAiProcessing || saving}>
              {saving ? 'Saving…' : t('saveNextLead')}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

function QueueItem({ name, index, type, alert }: { name: string; index: number; type: string; alert: boolean }) {
  return (
    <div className={`p-3 rounded bg-black/40 border-l-2 flex items-center justify-between transition-colors hover:bg-white/5 ${alert ? 'border-aura-ruby' : 'border-aura-emerald'}`}>
      <div>
        <div className="text-xs font-medium text-aura-platinum">{name}</div>
        <div className={`text-[9px] uppercase tracking-wider mt-1 ${alert ? 'text-aura-ruby' : 'text-aura-platinum/40'}`}>
          {type}
        </div>
      </div>
      <div className="text-[10px] font-mono font-bold text-aura-platinum/70">
        #{index}
      </div>
    </div>
  );
}
