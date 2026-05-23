import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, ShieldCheck, FileText, Camera, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

type DocKey = 'passport' | 'id_card' | 'selfie';

const DOC_SLOTS: { key: DocKey; label: string; icon: React.ReactNode; hint: string; camera?: boolean }[] = [
  { key: 'passport', label: 'Passport',      icon: <FileText size={24} className="text-slate-400" />, hint: 'Photo page clearly visible' },
  { key: 'id_card',  label: 'ID Card',        icon: <FileText size={24} className="text-slate-400" />, hint: 'Front & back if applicable' },
  { key: 'selfie',   label: 'Selfie with ID', icon: <Camera  size={24} className="text-slate-400" />, hint: 'Hold document next to your face', camera: true },
];

export const KYC = () => {
  const { t } = useTranslation('common');
  const { kycStatus, refreshProfile, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<Record<DocKey, File | null>>({ passport: null, id_card: null, selfie: null });

  const handleFile = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async () => {
    const chosen = (Object.entries(files) as [DocKey, File | null][]).filter(([, f]) => f !== null);
    if (chosen.length === 0) { toast.error('Upload at least one document'); return; }
    if (!user) { toast.error('Please log in first'); return; }

    setSubmitting(true);
    try {
      const uploaded: { type: string; name: string; path: string; contentType: string }[] = [];

      for (const [key, file] of chosen) {
        if (!file) continue;
        const ext  = file.name.split('.').pop() ?? 'bin';
        const path = `${user.id}/${key}_${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('kyc-documents')
          .upload(path, file, { contentType: file.type, upsert: true });

        if (upErr) throw new Error(`Upload failed for ${key}: ${upErr.message}`);
        uploaded.push({ type: key, name: file.name, path, contentType: file.type });
      }

      const { error: dbErr } = await supabase
        .from('users')
        .update({ kyc_status: 'PENDING', kyc_documents: uploaded })
        .eq('id', user.id);
      if (dbErr) throw new Error(dbErr.message);

      await refreshProfile();
      toast.success('Documents submitted — awaiting admin review');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (kycStatus === 'PENDING') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 animate-pulse">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{t('kycUnderReview', { defaultValue: 'Under Review' })}</h2>
          <p className="text-slate-400 text-sm">{t('kycUnderReviewDesc', { defaultValue: 'Your documents have been submitted and are being reviewed by our compliance team. This usually takes 1–2 business days.' })}</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'REJECTED') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
            <XCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Verification Rejected</h2>
          <p className="text-slate-400 text-sm mb-8">Your documents did not meet our requirements. Please re-submit with clearer, valid documents.</p>
          <button onClick={() => setFiles({ passport: null, id_card: null, selfie: null })} className="btn-gold px-8 py-3 rounded-xl">
            Re-submit Documents
          </button>
        </div>
      </div>
    );
  }

  if (kycStatus === 'VERIFIED') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400"
          >
            <ShieldCheck size={40} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">Identity Verified</h2>
          <p className="text-slate-400 text-sm">Your account is fully verified. All trading features are unlocked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-accent-primary/10 rounded-2xl text-accent-primary">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('kyc', { defaultValue: 'KYC Verification' })}</h1>
            <p className="text-slate-400 text-sm mt-1">Upload your identity documents to unlock all platform features.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {DOC_SLOTS.map(({ key, label, icon, hint, camera }) => (
            <label
              key={key}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all min-h-[160px] ${
                files[key]
                  ? 'border-accent-secondary/50 bg-accent-secondary/5'
                  : 'border-white/10 bg-white/5 hover:border-accent-primary/50'
              }`}
            >
              {files[key] ? (
                <>
                  <CheckCircle2 size={32} className="text-accent-secondary" />
                  <span className="text-xs font-bold text-accent-secondary text-center break-all">{files[key]!.name}</span>
                  <span className="text-[10px] text-slate-500">Click to replace</span>
                </>
              ) : (
                <>
                  {icon}
                  <div className="text-center">
                    <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                    <p className="text-[10px] text-slate-500">{hint}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {camera ? <><Camera size={11} /> Open Camera</> : <><Upload size={11} /> Upload file</>}
                  </div>
                </>
              )}
              {camera ? (
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="user"
                  onChange={e => handleFile(key, e)}
                />
              ) : (
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={e => handleFile(key, e)}
                />
              )}
            </label>
          ))}
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 flex gap-4 mb-6">
          <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-yellow-500/80">
            <p className="font-bold text-yellow-500 mb-1">{t('importantNote', { defaultValue: 'Important' })}</p>
            <p className="text-xs">{t('kycNote', { defaultValue: 'Documents must be clear, unexpired, and match your registered name. Supported formats: JPG, PNG, PDF (max 10 MB each).' })}</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || Object.values(files).every(f => f === null)}
          className="btn-gold w-full py-4 rounded-2xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Uploading documents...
            </span>
          ) : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
};
