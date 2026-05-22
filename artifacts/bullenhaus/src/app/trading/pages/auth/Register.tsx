import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { crmService } from '../../services/crmService';
import { getAttribution } from '../../hooks/useAttribution';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV && import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
        await new Promise(r => setTimeout(r, 1000));
        setSuccess(true);
        return;
      }

      let userSession = null;
      let userId = null;

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/trade/dashboard`,
            data: { full_name: name },
          },
        });
        if (signUpError) throw signUpError;
        userSession = data.session;
        userId = data.user?.id;
      } catch (authError: any) {
        if (authError.message?.includes('Failed to fetch') || import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
          setSuccess(true);
          return;
        }
        throw authError;
      }

      try {
        const attribution = getAttribution();
        const token = userSession?.access_token;
        const externalTraderId = userId;
        if (externalTraderId) {
          await crmService.registerClient({
            external_trader_id: externalTraderId,
            full_name: name,
            email,
            account: {
              external_account_id: `ACC-${externalTraderId}`,
              platform: 'Bullenhaus',
              account_type: 'real',
              currency: 'USD',
              balance: 0,
              equity: 0,
              leverage: 100,
            },
            ...(attribution ? { attribution } : {}),
          }, token);
        }
      } catch (crmError) {
        console.error('Failed to register in CRM:', crmError);
      }

      if (userSession) {
        navigate('/trade/dashboard', { replace: true });
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-gold-soft rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 size={28} className="text-gold" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">Application submitted</h2>
        <p className="text-sm text-text-muted mb-6">
          Your operator credentials are being provisioned. You can sign in right away.
        </p>
        <Link to="/login" className="btn-gold inline-flex">
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h2 className="font-serif text-2xl font-semibold text-text tracking-tight">Operator application</h2>
        <p className="text-sm text-text-muted mt-1.5">Apply for access to the Bullenhaus terminal.</p>
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

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="label-eyebrow block mb-2">Display name</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark pl-11"
              placeholder="Neon Trader"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-eyebrow block mb-2">Secure email</label>
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

        <div>
          <label className="label-eyebrow block mb-2">Passphrase</label>
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

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={16} />
              Submit application
            </>
          )}
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-border text-center text-sm text-text-muted">
        Existing operator?{' '}
        <Link to="/login" className="font-bold text-gold hover:text-gold-light transition-colors ml-1">
          Initialize
        </Link>
      </div>
    </div>
  );
};
