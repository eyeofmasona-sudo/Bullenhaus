import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, RefreshCw, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        setRecoveryReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setRecoveryReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Auth session missing') || msg.includes('session_not_found')) {
        setError('Reset link has expired or was already used. Please request a new one.');
      } else if (msg.includes('Password should be')) {
        setError('Password is too weak. Use at least 8 characters.');
      } else {
        setError(msg || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={28} className="text-success" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">Password updated</h2>
        <p className="text-sm text-text-muted">Redirecting to login...</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-muted">Verifying reset link...</p>
      </div>
    );
  }

  if (!recoveryReady) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-danger/10 rounded-full flex items-center justify-center mb-5">
          <ShieldAlert size={28} className="text-danger" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">Link invalid</h2>
        <p className="text-sm text-text-muted mb-6">
          This link has expired or was already used. Please request a new one.
        </p>
        <Link to="/forgot-password" className="btn-gold inline-flex">Request new link</Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h2 className="font-serif text-2xl font-semibold text-text tracking-tight">New password</h2>
        <p className="text-sm text-text-muted mt-1.5">Enter a new password for your account.</p>
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
          <label className="label-eyebrow block mb-2">New password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark pl-11"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </div>
        </div>

        <div>
          <label className="label-eyebrow block mb-2">Confirm password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-dark pl-11"
              placeholder="Repeat password"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6 group">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>Save password <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" /></>
          )}
        </button>
      </form>
    </div>
  );
};
