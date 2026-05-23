import React, { useState } from 'react';
import { Save, Server, Shield, Bot, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const AI_KEY_STORAGE   = 'bullenhaus_ai_key';
const AI_MODEL_STORAGE = 'bullenhaus_ai_model';

const MODELS = [
  { value: 'gpt-4o-mini',     label: 'GPT-4o Mini — Fast & cheap (recommended)' },
  { value: 'gpt-4o',          label: 'GPT-4o — More capable' },
  { value: 'gpt-4-turbo',     label: 'GPT-4 Turbo — High quality' },
  { value: 'gpt-3.5-turbo',   label: 'GPT-3.5 Turbo — Economy' },
];

export const AdminSettings = () => {
  const [mfa,     setMfa]     = useState(true);
  const [autoBan, setAutoBan] = useState(true);

  const [aiKey,      setAiKey]      = useState(localStorage.getItem(AI_KEY_STORAGE)   || '');
  const [aiModel,    setAiModel]    = useState(localStorage.getItem(AI_MODEL_STORAGE) || 'gpt-4o-mini');
  const [showKey,    setShowKey]    = useState(false);
  const [aiSaving,   setAiSaving]   = useState(false);

  const saveAiSettings = async () => {
    setAiSaving(true);
    await new Promise(r => setTimeout(r, 400));
    if (aiKey.trim()) {
      localStorage.setItem(AI_KEY_STORAGE,   aiKey.trim());
      localStorage.setItem(AI_MODEL_STORAGE, aiModel);
      toast.success('AI Chat settings saved — widget is now active');
    } else {
      localStorage.removeItem(AI_KEY_STORAGE);
      toast.success('AI Chat API key removed');
    }
    setAiSaving(false);
  };

  const keyPreview = aiKey.length > 8
    ? `${aiKey.slice(0, 7)}${'•'.repeat(Math.max(0, aiKey.length - 11))}${aiKey.slice(-4)}`
    : aiKey;

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">System Configuration</h2>
        <p className="text-sm text-slate-500">Manage platform-wide settings, security policies, and AI features.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left column ── */}
        <div className="space-y-8">
          {/* Platform Defaults */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Server size={18} className="text-rose-500" /> Platform Defaults
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Starting Balance</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue="100000"
                    className="flex-1 bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-accent-primary/30 transition-all"
                  />
                  <button
                    onClick={() => toast.success('Starting balance updated successfully')}
                    className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-bold uppercase transition-all rounded-xl border border-emerald-500/20 text-xs"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-sm text-white font-bold">Maintenance Mode</span>
                <button
                  onClick={() => toast.success('Maintenance Mode status flipped')}
                  className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold text-xs uppercase tracking-wider rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2">
              <Bot size={18} className="text-accent-primary" /> AI Live Chat
            </h3>
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
              Powers the floating AI assistant on the trading platform. Uses your OpenAI API key — billed to your OpenAI account. The assistant is restricted to platform-related questions only.
            </p>

            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${localStorage.getItem(AI_KEY_STORAGE) ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-400">
                  {localStorage.getItem(AI_KEY_STORAGE) ? 'AI Chat is active' : 'AI Chat is disabled — no key configured'}
                </span>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">OpenAI API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={aiKey}
                    onChange={e => setAiKey(e.target.value)}
                    placeholder="sk-••••••••••••••••••••••••••••••"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 pr-11 text-white font-mono text-sm focus:outline-none focus:border-accent-primary/30 transition-all placeholder-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {aiKey && !showKey && (
                  <p className="text-[10px] text-slate-600 font-mono mt-1 px-1">{keyPreview}</p>
                )}
                <p className="text-[10px] text-slate-600 mt-1 px-1">
                  Get your key at platform.openai.com/api-keys
                </p>
              </div>

              {/* Model selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Model</label>
                <select
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-primary/30 transition-all appearance-none cursor-pointer"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={saveAiSettings}
                disabled={aiSaving}
                className="w-full py-3 bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-black font-bold rounded-xl border border-accent-primary/30 hover:border-accent-primary transition-all text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiSaving
                  ? <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Saving…</>
                  : <><Save size={16} /> Save AI Settings</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-8">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Shield size={18} className="text-emerald-500" /> Security Policies
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
                <div>
                  <p className="text-sm text-white font-bold">Require MFA for Admins</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Enforce hardware keys or TOTP</p>
                </div>
                <button
                  onClick={() => { setMfa(!mfa); toast.success(`Require MFA ${!mfa ? 'Enabled' : 'Disabled'}`); }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${mfa ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${mfa ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
                <div>
                  <p className="text-sm text-white font-bold">Auto-Ban Flagged IPs</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Block VPNs and bad actors</p>
                </div>
                <button
                  onClick={() => { setAutoBan(!autoBan); toast.success(`Auto-Ban ${!autoBan ? 'Enabled' : 'Disabled'}`); }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${autoBan ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${autoBan ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
