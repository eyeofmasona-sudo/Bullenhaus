import React, { useEffect, useState } from 'react';
import { Save, Server, Shield, Bot, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { aiStatus } from '../../../../lib/ai/aiClient';
import { AI_MODEL_OPTIONS, AI_PRIMARY_MODEL } from '../../../../lib/ai/aiConfig';
import { useTranslation } from 'react-i18next';

export const AdminSettings = () => {
  const { t } = useTranslation(['common']);

  const [mfa,       setMfa]       = useState(true);
  const [autoBan,   setAutoBan]   = useState(true);
  const [aiOnline,  setAiOnline]  = useState<boolean | null>(null);
  const [aiModel,   setAiModel]   = useState(AI_PRIMARY_MODEL);
  const [aiSaving,  setAiSaving]  = useState(false);

  useEffect(() => {
    aiStatus().then(d => setAiOnline(d.configured)).catch(() => setAiOnline(false));
  }, []);

  const saveAiModel = async () => {
    setAiSaving(true);
    await new Promise(r => setTimeout(r, 300));
    setAiSaving(false);
    toast.success(t('adminSettings.ai.savedToast', 'AI server model policy reviewed'));
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{t('adminSettings.title')}</h2>
        <p className="text-sm text-slate-500">{t('adminSettings.desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left column ── */}
        <div className="space-y-8">
          {/* Platform Defaults */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Server size={18} className="text-rose-500" /> {t('adminSettings.platform.title')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t('adminSettings.platform.balance')}</label>
                <div className="flex gap-2">
                  <input type="text" defaultValue="100000"
                    className="flex-1 glass-card px-4 py-3 text-white font-mono focus:outline-none focus:border-accent-primary/30 transition-all"
                  />
                  <button onClick={() => toast.success(t('adminSettings.platform.balanceUpdated', 'Starting balance updated successfully'))}
                    className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-bold uppercase transition-all rounded-xl border border-emerald-500/20 text-xs"
                  >{t('adminSettings.platform.save')}</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-sm text-white font-bold">{t('adminSettings.platform.maintenance')}</span>
                <button onClick={() => toast.success(t('adminSettings.platform.maintenanceFlipped', 'Maintenance Mode status flipped'))}
                  className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold text-xs uppercase tracking-wider rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                >{t('adminSettings.platform.enable')}</button>
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2">
              <Bot size={18} className="text-accent-primary" /> {t('adminSettings.ai.title')}
            </h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              {t('adminSettings.ai.desc')}
            </p>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ' + (
                  aiOnline === null ? 'bg-slate-600 animate-pulse' : aiOnline ? 'bg-emerald-500' : 'bg-rose-500'
                )} />
                <div className="flex-1">
                  <span className="text-xs text-slate-300 font-medium">
                    {aiOnline === null ? t('adminSettings.ai.checking', 'Checking…') : aiOnline ? t('adminSettings.ai.active', 'OpenRouter — Server key active') : t('adminSettings.ai.notConfigured', 'AI service not configured')}
                  </span>
                  {aiOnline && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      <span className="text-[10px] text-slate-500">{t('adminSettings.ai.policy', 'Primary model with automatic fallback')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Model selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{t('adminSettings.ai.modelTitle', 'Server model policy')}</label>
                <select value={aiModel} onChange={e => setAiModel(e.target.value)}
                  className="w-full glass-card px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-primary/30 transition-all appearance-none cursor-pointer"
                >
                  {AI_MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <button onClick={saveAiModel} disabled={aiSaving}
                className="w-full py-3 bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-black font-bold rounded-xl border border-accent-primary/30 hover:border-accent-primary transition-all text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiSaving
                  ? <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> {t('adminSettings.ai.saving', 'Saving…')}</>
                  : <><Save size={16} /> {t('adminSettings.ai.savePref', 'Review Model Policy')}</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-8">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Shield size={18} className="text-emerald-500" /> {t('adminSettings.security.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-card">
                <div>
                  <p className="text-sm text-white font-bold">{t('adminSettings.security.mfaTitle')}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">{t('adminSettings.security.mfaDesc')}</p>
                </div>
                <button onClick={() => { setMfa(!mfa); toast.success(!mfa ? t('adminSettings.security.mfaEnabled') : t('adminSettings.security.mfaDisabled')); }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${mfa ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${mfa ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 glass-card">
                <div>
                  <p className="text-sm text-white font-bold">{t('adminSettings.security.banTitle')}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">{t('adminSettings.security.banDesc')}</p>
                </div>
                <button onClick={() => { setAutoBan(!autoBan); toast.success(!autoBan ? t('adminSettings.security.banEnabled') : t('adminSettings.security.banDisabled')); }}
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
