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
    // Listen for PASSWORD_RECOVERY event — fires when Supabase processes
    // the #access_token=...&type=recovery hash from the reset email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Also covers cases where the token was already processed
        setRecoveryReady(true);
        setChecking(false);
      }
    });

    // In case the event already fired before we subscribed
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
      setError('Пароли не совпадают.');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
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
        setError('Ссылка для сброса устарела или уже использована. Запросите новую.');
      } else if (msg.includes('Password should be')) {
        setError('Пароль слишком слабый. Используйте минимум 8 символов.');
      } else {
        setError(msg || 'Ошибка обновления пароля.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={28} className="text-success" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">Пароль обновлён</h2>
        <p className="text-sm text-text-muted">Перенаправляем на страницу входа…</p>
      </div>
    );
  }

  // Checking recovery token
  if (checking) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-muted">Проверяем ссылку сброса…</p>
      </div>
    );
  }

  // No valid recovery session found
  if (!recoveryReady) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-danger/10 rounded-full flex items-center justify-center mb-5">
          <ShieldAlert size={28} className="text-danger" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">Ссылка недействительна</h2>
        <p className="text-sm text-text-muted mb-6">
          Ссылка устарела или уже использована. Запросите новую.
        </p>
        <Link to="/forgot-password" className="btn-gold inline-flex">Запросить новую ссылку</Link>
      </div>
    );
  }

  // Reset form
  return (
    <div className="p-8">
      <div className="mb-7">
        <h2 className="font-serif text-2xl font-semibold text-text tracking-tight">Новый пароль</h2>
        <p className="text-sm text-text-muted mt-1.5">Введите новый пароль для вашего аккаунта.</p>
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
          <label className="label-eyebrow block mb-2">Новый пароль</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark pl-11"
              placeholder="Минимум 8 символов"
              required
              minLength={8}
            />
          </div>
        </div>

        <div>
          <label className="label-eyebrow block mb-2">Подтвердите пароль</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-dark pl-11"
              placeholder="Повторите пароль"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6 group">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>Сохранить пароль <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" /></>
          )}
        </button>
      </form>
    </div>
  );
};
