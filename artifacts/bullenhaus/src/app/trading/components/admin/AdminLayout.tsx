import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  LayoutDashboard,
  BarChart2,
  Briefcase,
  Rocket
} from 'lucide-react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

// ── Notification counts ────────────────────────────────────────────────────────
interface AdminCounts {
  kyc:         number;
  deposits:    number;
  withdrawals: number;
}

function useAdminNotifications(): AdminCounts {
  const [counts, setCounts] = useState<AdminCounts>({ kyc: 0, deposits: 0, withdrawals: 0 });

  const fetch = async () => {
    const [kycRes, txRes] = await Promise.all([
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('kyc_status', 'PENDING'),
      supabase
        .from('transactions')
        .select('type')
        .eq('status', 'Pending'),
    ]);

    const kycCount = kycRes.count ?? 0;
    const txRows   = txRes.data ?? [];
    const deposits    = txRows.filter(r => r.type === 'Deposit').length;
    const withdrawals = txRows.filter(r => r.type === 'Withdrawal').length;

    setCounts({ kyc: kycCount, deposits, withdrawals });
  };

  useEffect(() => {
    fetch();

    const usersSub = supabase
      .channel(`admin-kyc-watch-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetch)
      .subscribe();

    const txSub = supabase
      .channel(`admin-tx-watch-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(txSub);
    };
  }, []);

  return counts;
}

// ── Sidebar item ───────────────────────────────────────────────────────────────
const AdminSidebarItem = ({
  icon: Icon, label, to, active, badge,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  active: boolean;
  badge?: number;
}) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 4 }}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden",
        active
          ? "bg-gradient-to-r from-rose-500/15 to-rose-500/5 text-rose-400 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.12)]"
          : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
      )}
    >
      {/* Active left indicator bar */}
      {active && (
        <motion.div
          layoutId="admin-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"
        />
      )}
      <Icon size={18} className={cn("transition-colors", active ? "text-rose-400" : "text-slate-500 group-hover:text-white")} />
      <span className="font-bold text-[11px] tracking-wider uppercase flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <AnimatePresence>
          <motion.span
            key={badge}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={   { scale: 0.5, opacity: 0 }}
            className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-[0_0_10px_rgba(244,63,94,0.7)]"
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  </Link>
);

// ── Sign-out ───────────────────────────────────────────────────────────────────
const AdminSignOutButton = () => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  return (
    <button
      onClick={async () => { await signOut(); navigate('/login'); }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 hover:text-white w-full transition-all hover:bg-white/5"
    >
      <LogOut size={18} />
      <span className="text-xs font-bold uppercase tracking-widest">{t('adminLayout.sidebar.signOut')}</span>
    </button>
  );
};

// ── Sidebar ────────────────────────────────────────────────────────────────────
const AdminSidebar = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation(['common']);
  const location    = useLocation();
  const { role }    = useAuth();
  const counts      = useAdminNotifications();
  const currentPath = location.pathname;

  return (
    <div className="w-64 h-full bg-gradient-to-b from-[#0A0A0E] via-[#060608] to-[#030305] border-r border-rose-500/15 flex flex-col p-4 shadow-[10px_0_50px_rgba(0,0,0,0.7)] relative overflow-hidden">
      {/* Ambient rose glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.3) 0%, transparent 70%)',
        }}
      />
      {/* Visible rose accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

      {/* Brand block */}
      <div className="relative flex items-center gap-3 mb-10 px-2 pt-2">
        <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400/20">
          <ShieldCheck size={20} className="text-white" />
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
        </div>
        <div>
          <p className="text-sm font-black tracking-[0.18em] text-white">{t('adminLayout.sidebar.admin')}</p>
          <p className="text-[8px] font-bold text-rose-500/60 tracking-[0.15em] uppercase mt-0.5">{t('adminLayout.sidebar.controlSystem')}</p>
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto">
        <AdminSidebarItem
          icon={LayoutDashboard} label={t('adminLayout.sidebar.overview')}
          to="/admin" active={currentPath === '/admin'}
        />
        <AdminSidebarItem
          icon={Users} label={t('adminLayout.sidebar.userManager')}
          to="/admin/users" active={currentPath === '/admin/users'}
        />
        <AdminSidebarItem
          icon={ShieldCheck} label={t('adminLayout.sidebar.kycQueue')}
          to="/admin/kyc" active={currentPath === '/admin/kyc'}
          badge={counts.kyc}
        />
        <AdminSidebarItem
          icon={History} label={t('adminLayout.sidebar.deposits')}
          to="/admin/deposits" active={currentPath === '/admin/deposits'}
          badge={counts.deposits}
        />
        <AdminSidebarItem
          icon={History} label={t('adminLayout.sidebar.withdrawals')}
          to="/admin/withdrawals" active={currentPath === '/admin/withdrawals'}
          badge={counts.withdrawals}
        />
        <AdminSidebarItem
          icon={BarChart2} label={t('adminLayout.sidebar.marketControl')}
          to="/admin/market-control" active={currentPath === '/admin/market-control'}
        />
        <AdminSidebarItem
          icon={Rocket} label={t('adminLayout.sidebar.preMarketControl')}
          to="/admin/premarket" active={currentPath === '/admin/premarket'}
        />
        <AdminSidebarItem
          icon={History} label={t('adminLayout.sidebar.transactions')}
          to="/admin/transactions" active={currentPath === '/admin/transactions'}
        />
        <AdminSidebarItem
          icon={Settings} label={t('adminLayout.sidebar.systemConfig')}
          to="/admin/settings" active={currentPath === '/admin/settings'}
        />

        {(role === 'admin' || role === 'trade_admin') && (
          <div className="pt-3 mt-3 border-t border-rose-500/10">
            <p className="text-[9px] font-bold tracking-[0.2em] text-slate-600 uppercase px-4 mb-2">{t('adminLayout.sidebar.switchZone')}</p>
            <Link to="/trade/dashboard">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 text-sky-400/70 hover:text-sky-400 hover:bg-sky-400/10 border border-sky-400/0 hover:border-sky-400/20"
              >
                <BarChart2 size={18} />
                <span className="font-bold text-xs tracking-wider uppercase">{t('adminLayout.sidebar.tradePlatform')}</span>
              </motion.div>
            </Link>
            {role === 'admin' && (
              <Link to="/crm/admin">
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 text-aura-gold/70 hover:text-aura-gold hover:bg-aura-gold/10 border border-aura-gold/0 hover:border-aura-gold/20"
                >
                  <Briefcase size={18} />
                  <span className="font-bold text-xs tracking-wider uppercase">{t('adminLayout.sidebar.crmAdmin')}</span>
                </motion.div>
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="mt-auto border-t border-rose-500/10 pt-4">
        <AdminSignOutButton />
      </div>
    </div>
  );
};

// ── Layout ─────────────────────────────────────────────────────────────────────
export const AdminLayout = () => {
  const { t } = useTranslation(['common']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();

  if (role !== 'admin' && role !== 'trade_admin') return null;

  return (
    <div className="min-h-screen bg-[#040406] text-slate-300 font-sans selection:bg-rose-500/30 relative">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(244,63,94,0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(212,175,55,0.03) 0%, transparent 50%)',
        }}
      />
      <div className="flex h-screen overflow-hidden relative">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-64 z-50 md:hidden"
              >
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Premium header with bottom glow line */}
          <header className="relative h-16 border-b border-rose-500/15 bg-[#060608]/70 backdrop-blur-xl flex items-center justify-between px-6 z-30">
            {/* Bottom hairline glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-400 hover:text-white md:hidden"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                </span>
                {t('adminLayout.header.systemStatus')} <span className="text-emerald-500">{t('adminLayout.header.operational')}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="px-3 py-1.5 bg-gradient-to-r from-rose-500/10 to-rose-500/5 text-rose-400 rounded-lg border border-rose-500/20 uppercase tracking-tighter shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                Version 2.4.0-BETA
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center min-h-[400px]"><div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" /></div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
