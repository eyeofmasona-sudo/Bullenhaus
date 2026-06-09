import React, { useState } from "react";
import { Phone, Clock, FileText, PlayCircle, Plus, ChevronRight, MoreHorizontal, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useLeads, updateLeadStage, LEAD_STAGES, type LeadStage } from "../hooks/useLeads";
import { useI18n } from "../lib/i18n";
import { usePhoneDialer } from "../contexts/PhoneDialerContext";

interface LocalTask {
  name: string;
  type: string;
  time: string;
  urgent: boolean;
}

function LeadPipeline({ leads, meta, loading, error, onCall, onStageChange, onOpen }: {
  leads: any[];
  meta: any;
  loading: boolean;
  error: string | null;
  onCall: (phone: string, name: string) => void;
  onStageChange: (leadId: string, stage: LeadStage) => void;
  onOpen: (lead: any) => void;
}) {
  const stages = meta?.grouped || {
    'New Inquiries': [],
    'In Discussion': [],
    'Pending KYC': [],
    'Funded (FTD)': [],
  };

  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-12 border border-glass-border rounded-xl">
        <Loader2 className="w-8 h-8 text-aura-gold animate-spin" />
        <p className="text-sm font-mono tracking-widest uppercase mt-4 text-aura-platinum/60">Loading Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-12 border border-aura-ruby/30 rounded-xl bg-aura-ruby/5">
        <AlertCircle className="w-8 h-8 text-aura-ruby" />
        <p className="text-sm font-mono tracking-widest uppercase mt-4 text-aura-ruby">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase">Lead Pipeline</h3>
         <Button variant="outline" size="sm" className="h-8 text-[10px]">View Analytics <ChevronRight className="w-3 h-3 ml-1" /></Button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {Object.entries(stages).map(([stage, stageLeads]) => {
            const leadsList = stageLeads as any[];
            return (
              <div key={stage} className="min-w-[280px]">
                 <div className="flex items-center justify-between mb-4 px-1">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${
                       stage === 'Funded (FTD)' ? 'bg-aura-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                       stage === 'Pending KYC' ? 'bg-aura-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                       stage === 'New Inquiries' ? 'bg-aura-platinum shadow-[0_0_8px_rgba(255,255,255,0.4)]' :
                       'bg-aura-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                     }`} />
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60">{stage}</h4>
                   </div>
                   <span className="text-[10px] font-mono text-aura-platinum/40 bg-white/5 px-2 py-0.5 rounded">{leadsList.length}</span>
                 </div>
                 
                 <div className="space-y-3">
                   {leadsList.map((lead: any) => (
                     <div 
                       key={lead.id} 
                       onClick={() => onOpen(lead)}
                       className={`p-4 rounded-xl border bg-[#121214] hover:-translate-y-1 transition-transform cursor-pointer group shadow-sm hover:shadow-md
                         ${lead.stage === 'FUNDED' ? 'border-aura-emerald/30 hover:border-aura-emerald/50' :
                         lead.stage === 'PENDING_KYC' ? 'border-aura-warning/30 hover:border-aura-warning/50' :
                         'border-glass-border hover:border-aura-platinum/30'}
                       `}
                     >
                       <div className="flex items-start justify-between mb-3">
                          <div className="font-medium text-sm text-aura-platinum">{lead.firstName} {lead.lastName}</div>
                          <button onClick={e => { e.stopPropagation(); onOpen(lead); }} className="text-aura-platinum/30 hover:text-aura-platinum opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
                          <div>
                            <div className="text-[8px] uppercase tracking-widest text-aura-platinum/40 mb-0.5 font-sans">Capacity</div>
                            <div className={lead.stage === 'FUNDED' ? 'text-aura-emerald' : 'text-aura-platinum'}>{lead.capacity || 'TBD'}</div>
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-widest text-aura-platinum/40 mb-0.5 font-sans">Added</div>
                            <div className="text-aura-platinum/70 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                            </div>
                          </div>
                       </div>
                       {/* Stage selector */}
                       <div className="mb-3" onClick={e => e.stopPropagation()}>
                         <div className="relative">
                           <select
                             value={lead.stage}
                             onChange={e => onStageChange(lead.id, e.target.value as LeadStage)}
                             className={`w-full appearance-none rounded-lg px-3 py-1.5 pr-7 text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer transition-colors ${
                               lead.stage === 'FUNDED'       ? 'bg-aura-emerald/10 border-aura-emerald/30 text-aura-emerald' :
                               lead.stage === 'PENDING_KYC' ? 'bg-aura-warning/10 border-aura-warning/30 text-aura-warning' :
                               lead.stage === 'IN_DISCUSSION'? 'bg-aura-gold/10 border-aura-gold/30 text-aura-gold' :
                               'bg-white/5 border-glass-border text-aura-platinum/60'
                             }`}
                           >
                             {LEAD_STAGES.map(s => (
                               <option key={s.value} value={s.value} className="bg-[#121214] text-aura-platinum">{s.label}</option>
                             ))}
                           </select>
                           <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                         </div>
                       </div>

                       <div className="flex justify-between items-center border-t border-glass-border pt-3">
                          <span className="text-[9px] uppercase tracking-widest text-aura-platinum/40">{lead.acquisitionSource?.leadSource || 'Unknown'}</span>
                          <div className="flex gap-1">
                            <button onClick={e => { e.stopPropagation(); onOpen(lead); }} className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-colors">
                              <FileText className="w-3 h-3 text-aura-platinum/60" />
                            </button>
                            <button
                              title={lead.phone ? `Call ${lead.firstName}` : "No phone number"}
                              disabled={!lead.phone}
                              onClick={e => { e.stopPropagation(); lead.phone && onCall(lead.phone, `${lead.firstName} ${lead.lastName}`.trim()); }}
                              className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center hover:bg-aura-emerald/20 hover:border-aura-emerald/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Phone className={`w-3 h-3 ${lead.phone ? 'text-aura-emerald' : 'text-aura-platinum/30'}`} />
                            </button>
                          </div>
                       </div>
                     </div>
                   ))}
                   {leadsList.length === 0 && (
                     <div className="p-4 rounded-xl border border-dashed border-glass-border bg-transparent flex items-center justify-center h-24">
                       <span className="text-[10px] uppercase tracking-widest text-aura-platinum/30">Empty</span>
                     </div>
                   )}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
}

function leadStageLabel(stage: string): string {
  const found = LEAD_STAGES.find(s => s.value === stage);
  return found ? found.label : (stage || '\u2014');
}

function LeadRow({ label, value }: { label: string; value: any }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="py-2 border-b border-glass-border/60">
      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-0.5">{label}</div>
      <div className="text-xs text-aura-platinum break-words">{empty ? '\u2014' : String(value)}</div>
    </div>
  );
}

function LeadDetailsModal({ lead, onClose, onCall }: {
  lead: any | null;
  onClose: () => void;
  onCall: (phone: string, name: string) => void;
}) {
  if (!lead) return null;
  const fullName = `${lead.firstName ?? lead.first_name ?? ''} ${lead.lastName ?? lead.last_name ?? ''}`.trim() || lead.name || lead.email || 'Lead';
  const src = lead.acquisitionSource || lead.acquisition_source || {};
  return (
    <Modal isOpen={!!lead} onClose={onClose} title={fullName} subtitle={leadStageLabel(lead.stage)}>
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-2 gap-x-4">
          <LeadRow label="First Name" value={lead.firstName ?? lead.first_name} />
          <LeadRow label="Last Name" value={lead.lastName ?? lead.last_name} />
          <LeadRow label="Email" value={lead.email} />
          <LeadRow label="Phone" value={lead.phone} />
          <LeadRow label="Country" value={lead.country} />
          <LeadRow label="Capacity" value={lead.capacity} />
          <LeadRow label="Timezone" value={lead.timezone} />
          <LeadRow label="Stage" value={leadStageLabel(lead.stage)} />
          <LeadRow label="Source" value={src.source || src.leadSource} />
          <LeadRow label="Assigned Agent" value={lead.assigned_agent_id} />
          <LeadRow label="Created" value={lead.created_at ? new Date(lead.created_at).toLocaleString() : null} />
          <LeadRow label="Updated" value={lead.updated_at ? new Date(lead.updated_at).toLocaleString() : null} />
        </div>

        {lead.notes && (
          <div className="mt-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Notes</div>
            <div className="text-xs text-aura-platinum whitespace-pre-wrap break-words">{lead.notes}</div>
          </div>
        )}

        {src && Object.keys(src).length > 0 && (
          <div className="mt-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Acquisition Source</div>
            <div className="space-y-1">
              {Object.entries(src).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-[11px]">
                  <span className="text-aura-platinum/50">{k}</span>
                  <span className="text-aura-platinum break-all text-right">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lead.phone && (
          <Button variant="primary" className="w-full mt-5" onClick={() => onCall(lead.phone, fullName)}>
            <Phone className="w-3.5 h-3.5 fill-black" /> Call {fullName}
          </Button>
        )}
      </div>
    </Modal>
  );
}

export function AgentWorkspace() {
  const { t } = useI18n();
  const { openDialer } = usePhoneDialer();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState('Call');
  const [taskTime, setTaskTime] = useState('Next 1 Hour');

  const { leads, meta, loading, error, refetch } = useLeads(1, 100);

  const handleStageChange = async (leadId: string, stage: LeadStage) => {
    try {
      await updateLeadStage(leadId, stage);
      await refetch();
    } catch (_) { /* silent — stale UI acceptable */ }
  };

  // Stats derived from leads
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const ftdToday = leads.filter(
    (l) => l.stage === 'FUNDED' && new Date(l.created_at) >= todayStart
  ).length;

  const callsToday = leads.filter(
    (l) => new Date(l.created_at) >= todayStart
  ).length;

  // Featured lead (first in list)
  const featuredLead = leads[0] ?? null;
  const featuredName = featuredLead
    ? `${featuredLead.firstName ?? ''} ${featuredLead.lastName ?? ''}`.trim()
    : null;
  const featuredInitials = featuredName
    ? featuredName.split(' ').map((p: string) => p[0] ?? '').join('').toUpperCase().slice(0, 2)
    : '—';

  // Task queue: auto-generated from leads + user-added tasks
  const urgentLeads = leads.filter((l) => l.stage === 'NEW_INQUIRY').slice(0, 2);
  const followUpLeads = leads.filter((l) => l.stage === 'IN_DISCUSSION').slice(0, 2);
  const autoTasks: LocalTask[] = [
    ...urgentLeads.map((l) => ({
      name: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim(),
      type: 'Urgent Call',
      time: 'Now',
      urgent: true,
    })),
    ...followUpLeads.map((l) => ({
      name: `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim(),
      type: 'Follow Up',
      time: 'Today',
      urgent: false,
    })),
  ];
  const taskQueue = [...autoTasks, ...localTasks].slice(0, 5);

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) { setIsTaskModalOpen(false); return; }
    setLocalTasks((prev) => [
      ...prev,
      {
        name: taskName.trim(),
        type: taskType,
        time: taskTime === 'Next 1 Hour' ? 'in 1 hr' : taskTime === 'Today' ? 'Today' : 'Tomorrow',
        urgent: taskType === 'Call' && taskTime === 'Next 1 Hour',
      },
    ]);
    setTaskName('');
    setIsTaskModalOpen(false);
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('agentTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('agentSubtitle')}</p>
        </div>
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
           <div className="flex gap-4">
             <div className="text-right">
               <div className="text-xl font-light text-aura-gold">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin text-aura-gold inline" /> : callsToday}
               </div>
               <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">Leads Today</div>
             </div>
             <div className="text-right border-l border-glass-border pl-4">
               <div className="text-xl font-light text-aura-emerald">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin text-aura-emerald inline" /> : ftdToday}
               </div>
               <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">FTD Today</div>
             </div>
           </div>
           <Button variant="secondary" size="icon" onClick={() => setIsTaskModalOpen(true)}>
             <Plus className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Featured Lead Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl border border-glass-border bg-[#121214] p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
              </div>
            ) : !featuredLead ? (
              <div className="flex flex-col items-center justify-center py-12 text-aura-platinum/30">
                <Phone className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-[10px] uppercase tracking-widest">No leads in pipeline</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-glass-border gap-4">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded border border-aura-gold/30 bg-black flex items-center justify-center text-lg font-display text-aura-gold">
                       {featuredInitials}
                     </div>
                     <div>
                       <h3 className="text-lg font-medium text-aura-platinum">{featuredName}</h3>
                       <div className={`text-[10px] uppercase tracking-widest mt-1 ${
                         featuredLead.stage === 'FUNDED' ? 'text-aura-emerald' :
                         featuredLead.stage === 'PENDING_KYC' ? 'text-aura-warning' :
                         'text-aura-gold'
                       }`}>
                         {featuredLead.stage === 'NEW_INQUIRY' ? 'New Inquiry' :
                          featuredLead.stage === 'IN_DISCUSSION' ? 'In Discussion' :
                          featuredLead.stage === 'PENDING_KYC' ? 'Pending KYC' :
                          featuredLead.stage === 'FUNDED' ? 'Funded — FTD' :
                          featuredLead.stage}
                       </div>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                     <Button variant="secondary" className="flex-1 sm:flex-auto">
                       <FileText className="w-3.5 h-3.5" /> Notes
                     </Button>
                     <Button variant="primary" className="flex-1 sm:flex-auto">
                       <Phone className="w-3.5 h-3.5 fill-black" /> Call Now
                     </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Source</div>
                      <div className="text-aura-platinum text-xs">{featuredLead.acquisitionSource?.leadSource || 'Unknown'}</div>
                   </div>
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Capacity</div>
                      <div className="font-mono text-aura-gold text-xs">{featuredLead.capacity || 'TBD'}</div>
                   </div>
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Added</div>
                      <div className="text-aura-platinum text-xs">
                        {featuredLead.created_at ? new Date(featuredLead.created_at).toLocaleDateString() : '—'}
                      </div>
                   </div>
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Email</div>
                      <div className="text-aura-platinum text-xs truncate">{featuredLead.email || '—'}</div>
                   </div>
                </div>

                <div className="rounded border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md">
                  <div className="text-[10px] text-aura-gold font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" /> AI NEXT BEST ACTION
                  </div>
                  <div className="rounded bg-black/40 p-4 border border-glass-border border-l-2 border-l-aura-gold">
                    <p className="text-aura-platinum/90 text-xs leading-relaxed">
                      {featuredLead.stage === 'NEW_INQUIRY'
                        ? `${featuredName} just joined. Begin with an introduction call to understand their investment goals. Do not push for a deposit yet.`
                        : featuredLead.stage === 'IN_DISCUSSION'
                        ? `${featuredName} is engaged. Focus on objection handling and present the platform's risk management tools.`
                        : featuredLead.stage === 'PENDING_KYC'
                        ? `${featuredName} is awaiting KYC. Remind them to upload their ID and proof of address.`
                        : `${featuredName} has funded. Congratulate them and introduce them to their dedicated account manager.`
                      }
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task Queue */}
        <div className="space-y-6">
          <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Task Queue</h3>
              <button 
                className="text-[10px] text-aura-gold hover:text-aura-gold-light uppercase tracking-widest font-bold transition-colors"
                onClick={() => setIsTaskModalOpen(true)}
              >
                + New
              </button>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-aura-gold animate-spin" />
                </div>
              ) : taskQueue.length === 0 ? (
                <div className="text-center py-6 text-aura-platinum/30 text-[10px] uppercase tracking-widest">
                  No tasks — add leads to pipeline
                </div>
              ) : (
                taskQueue.map((task, i) => (
                  <div key={i} className={`p-4 rounded border-l-2 flex justify-between items-center transition-colors hover:bg-white/5 ${task.urgent ? 'border-aura-ruby bg-aura-ruby/5' : 'border-aura-platinum/30 bg-[#0A0A0B]'}`}>
                    <div>
                      <div className="text-xs font-medium text-aura-platinum">{task.name}</div>
                      <div className={`text-[9px] uppercase tracking-widest mt-1 ${task.urgent ? 'text-aura-ruby' : 'text-aura-platinum/50'}`}>{task.type}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-aura-platinum/50">
                      <Clock className="w-3 h-3" /> {task.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <LeadPipeline
        leads={leads}
        meta={meta}
        loading={loading}
        error={error}
        onCall={(phone, name) => openDialer({ phone, name })}
        onStageChange={handleStageChange}
        onOpen={setSelectedLead}
      />

      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onCall={(phone, name) => openDialer({ phone, name })}
      />

      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Agent Task"
        subtitle="Schedule a follow-up or internal action"
      >
         <form className="space-y-4 text-sm" onSubmit={handleAddTask}>
            <div>
               <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Lead / Client Name</label>
               <input
                 type="text"
                 value={taskName}
                 onChange={(e) => setTaskName(e.target.value)}
                 className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors"
                 placeholder="e.g. James Layton"
                 required
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Task Type</label>
                 <select
                   value={taskType}
                   onChange={(e) => setTaskType(e.target.value)}
                   className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none"
                 >
                    <option>Call</option>
                    <option>Email</option>
                    <option>Review Docs</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Time</label>
                 <select
                   value={taskTime}
                   onChange={(e) => setTaskTime(e.target.value)}
                   className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none"
                 >
                    <option>Next 1 Hour</option>
                    <option>Today</option>
                    <option>Tomorrow</option>
                 </select>
               </div>
            </div>
            <div>
               <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Notes</label>
               <textarea className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors" rows={3} placeholder="Add context..."></textarea>
            </div>
            <div className="pt-4 border-t border-glass-border flex justify-end gap-3 flex-col sm:flex-row">
               <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
               <Button type="submit" variant="primary">Create Task</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
