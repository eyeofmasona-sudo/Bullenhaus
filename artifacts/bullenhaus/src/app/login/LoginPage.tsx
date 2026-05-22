import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../trading/lib/supabase';
import { UnifiedRole } from '../trading/contexts/AuthContext';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV && import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
        await new Promise(r => setTimeout(r, 800));
        let target = '/trade/dashboard';
        if (email.includes('admin')) target = '/admin/dashboard';
        else if (email.includes('agent') || email.includes('manager')) target = '/crm/dashboard';
        navigate(target, { replace: true });
        return;
      }

      let userSession = null;
      let userId = null;
      let isDemo = false;

      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        userSession = data.session;
        userId = data.user?.id;
      } catch (authError: any) {
        if (authError.message?.includes('Failed to fetch') || import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
          isDemo = true;
        } else {
          throw authError;
        }
      }

      if (isDemo) {
        let target = '/trade/dashboard';
        if (email.includes('admin')) target = '/admin/dashboard';
        else if (email.includes('agent') || email.includes('manager')) target = '/crm/dashboard';
        navigate(target, { replace: true });
        return;
      }

      let target = '/trade/dashboard';
      if (userSession?.access_token && userId) {
        // First try public.users table
        const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single();
        let userRole = (profile?.role || null) as UnifiedRole;

        // Fallback: read role from auth user_metadata (CRM workers may not have public.users row)
        if (!userRole) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const metaRole = authUser?.user_metadata?.role as string | undefined;
          if (metaRole && ['client','agent','manager','director','admin'].includes(metaRole)) {
            userRole = metaRole as UnifiedRole;
          } else {
            userRole = 'client';
          }
        }

        if (userRole === 'admin') target = '/admin/dashboard';
        else if (userRole === 'agent' || userRole === 'manager' || userRole === 'director') target = '/crm/dashboard';
      }
      navigate(target, { replace: true });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
        setError('Email не подтверждён. Запустите SQL-скрипт подтверждения в Supabase Dashboard или отключите Email Confirmations в Authentication → Settings.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('Неверный email или пароль.');
      } else if (msg.includes('Too many requests')) {
        setError('Слишком много попыток. Подождите несколько минут.');
      } else {
        setError(msg || 'Ошибка входа. Проверьте email и пароль.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="User Login"
      subtitle="Enter your credentials for terminal access."
      footer={
        <>
          New user?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-bold text-gold hover:text-gold-light transition-colors ml-1"
          >
            Apply here
          </button>
        </>
      }
    >
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

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="label-eyebrow block mb-2">Secure Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark pl-11"
              placeholder="user@bullenhaus.com"
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
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            'Log In'
          )}
        </button>
      </form>
    </AuthShell>
  );
}
