import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('For security purposes')) {
        setError('Too many requests. Please wait a minute and try again.');
      } else if (msg.includes('Unable to validate')) {
        setError('Please enter a valid email address.');
      } else {
        setError(msg || 'Failed to send reset link. Please check your email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-5">
          <ShieldCheck size={28} className="text-success" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">Email sent</h2>
        <p className="text-sm text-text-muted mb-2">
          If an account with that email exists, a reset link is on its way.
        </p>
        <p className="text-xs text-text-dim mb-6">
          Check your spam folder if the email doesn't arrive within 2–3 minutes.
        </p>
        <Link to="/login" className="btn-gold inline-flex">Back to login</Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h2 className="font-serif text-2xl font-semibold text-text tracking-tight">Reset password</h2>
        <p className="text-sm text-text-muted mt-1.5">Enter your email — we'll send you a reset link.</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3"
        >
          <AlertCircle className="text-danger shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-danger">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="label-eyebrow block mb-2">Account email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark pl-11"
              placeholder="operator@bullenhaus.com"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6 group">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>Send reset link <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-border text-center">
        <Link to="/login" className="text-sm text-text-muted hover:text-gold transition-colors">
          ← Back to login
        </Link>
      </div>
    </div>
  );
};
