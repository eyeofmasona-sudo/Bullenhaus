import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

/**
 * Full-screen maintenance curtain.
 *
 * When VITE_MAINTENANCE is enabled, every visitor sees the "platform stopped"
 * screen instead of the app. A single staff account (see STAFF_USER/STAFF_PASS)
 * can lift the curtain for their browser; the bypass is remembered in
 * localStorage so navigation inside the app keeps working.
 *
 * NOTE: this is a client-side gate — it hides the UI but is not a security
 * boundary. Real access control still lives in Supabase auth/RLS.
 */

const MAINTENANCE_ON = import.meta.env.VITE_MAINTENANCE === '1';

// Staff credentials that can bypass the curtain. Overridable via env; the
// defaults are the agreed single account.
const STAFF_USER = (import.meta.env.VITE_STAFF_USER ?? 'ArmTradeGod@arm.arm').trim().toLowerCase();
const STAFF_PASS = import.meta.env.VITE_STAFF_PASS ?? 'Itsmearm';

const BYPASS_KEY = 'bh_maintenance_bypass';

function hasBypass(): boolean {
  try {
    return localStorage.getItem(BYPASS_KEY) === 'granted';
  } catch {
    return false;
  }
}

const MaintenanceScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === STAFF_USER && password === STAFF_PASS) {
      try {
        localStorage.setItem(BYPASS_KEY, 'granted');
      } catch {
        /* ignore storage failures — bypass just won't persist */
      }
      onUnlock();
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg px-6 py-12">
      <div className="glass-card w-full max-w-lg border border-accent-primary/20 p-10 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent-primary">Bullenhaus</p>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-primary/30 bg-black/40">
          <ShieldAlert className="text-accent-primary" size={30} />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-white">Platform stopped.</h1>
        <p className="mb-8 text-slate-400">Make Payment to restart!</p>

        {!showLogin ? (
          <button
            onClick={() => setShowLogin(true)}
            className="mx-auto flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-600 transition-colors hover:text-slate-400"
          >
            <Lock size={12} />
            Staff access
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-xs space-y-3 text-left">
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="Login"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-accent-primary/50 focus:outline-none"
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Password"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-accent-primary/50 focus:outline-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" className="btn-gold w-full">Enter</button>
          </form>
        )}
      </div>
    </div>
  );
};

export const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => hasBypass());

  if (MAINTENANCE_ON && !unlocked) {
    return <MaintenanceScreen onUnlock={() => setUnlocked(true)} />;
  }

  return <>{children}</>;
};
