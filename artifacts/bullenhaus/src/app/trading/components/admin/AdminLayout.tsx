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
  Briefcase
} from 'lucide-react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

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
        "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
        active ? "bg-rose-500/10 text-rose-500" : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon size={20} />
      <span className="font-bold text-xs tracking-wider uppercase flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <AnimatePresence>
          <motion.span
            key={badge}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={   { scale: 0.5, opacity: 0 }}
            className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-[0_0_8px_rgba(244,63,94,0.6)]"
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
  const navigate = useNavigate();
  const { signOut } = useAuth();
  return (
    <button
      onClick={async () => { await signOut(); navigate('/login'); }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white w-full transition-all hover:bg-white/5"
    >
      <LogOut size={18} />
      <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
    </button>
  );
};

// ── Sidebar ────────────────────────────────────────────────────────────────────
const AdminSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location    = useLocation();
  const { role }    = useAuth();
  const counts      = useAdminNotifications();
  const currentPath = location.pathname;

  return (
    <div className="w-64 h-full bg-[#050505] border-r border-rose-500/10 flex flex-col p-4 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black tracking-[0.2em] text-white">ADMIN</p>
          <p className="text-[8px] font-bold text-rose-500/50 tracking-[0.1em] uppercase">Control System</p>
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto">
        <AdminSidebarItem
          icon={LayoutDashboard} label="Overview"
          to="/admin" active={currentPath === '/admin'}
        />
        <AdminSidebarItem
          icon={Users} label="User Manager"
          to="/admin/users" active={currentPath === '/admin/users'}
        />
        <AdminSidebarItem
          icon={ShieldCheck} label="KYC Queue"
          to="/admin/kyc" active={currentPath === '/admin/kyc'}
          badge={counts.kyc}
        />
        <AdminSidebarItem
          icon={History} label="Deposits"
          to="/admin/deposits" active={currentPath === '/admin/deposits'}
          badge={counts.deposits}
        />
        <AdminSidebarItem
          icon={History} label="Withdrawals"
          to="/admin/withdrawals" active={currentPath === '/admin/withdrawals'}
          badge={counts.withdrawals}
        />
        <AdminSidebarItem
          icon={BarChart2} label="Market Control"
          to="/admin/market-control" active={currentPath === '/admin/market-control'}
        />
        <AdminSidebarItem
          icon={History} label="Transactions"
          to="/admin/transactions" active={currentPath === '/admin/transactions'}
        />
        <AdminSidebarItem
          icon={Settings} label="System Config"
          to="/admin/settings" active={currentPath === '/admin/settings'}
        />

        {(role === 'admin' || role === 'trade_admin') && (
          <div className="pt-3 mt-3 border-t border-rose-500/10">
            <p className="text-[9px] font-bold tracking-[0.2em] text-slate-600 uppercase px-4 mb-2">Switch Zone</p>
            <Link to="/trade/dashboard">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-sky-400/70 hover:text-sky-400 hover:bg-sky-400/10 border border-sky-400/0 hover:border-sky-400/20"
              >
                <BarChart2 size={18} />
                <span className="font-bold text-xs tracking-wider uppercase">Trade Platform</span>
              </motion.div>
            </Link>
            {role === 'admin' && (
              <Link to="/crm/admin">
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-aura-gold/70 hover:text-aura-gold hover:bg-aura-gold/10 border border-aura-gold/0 hover:border-aura-gold/20"
                >
                  <Briefcase size={18} />
                  <span className="font-bold text-xs tracking-wider uppercase">CRM Admin</span>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();

  if (role !== 'admin' && role !== 'trade_admin') return null;

  return (
    <div className="min-h-screen bg-[#020202] text-slate-300 font-sans selection:bg-rose-500/30">
      <div className="flex h-screen overflow-hidden">
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
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
          <header className="h-16 border-b border-rose-500/10 bg-[#050505]/50 backdrop-blur-md flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-400 hover:text-white md:hidden"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
                <Activity size={16} className="text-rose-500" />
                System Status: <span className="text-emerald-500">Operational</span>
              </h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded border border-rose-500/20 uppercase tracking-tighter">
                Version 2.4.0-BETA
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.03),transparent)]">
            <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center min-h-[400px]"><div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" /></div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
