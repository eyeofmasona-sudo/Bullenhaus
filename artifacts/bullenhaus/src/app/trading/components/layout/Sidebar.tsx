import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Repeat,
  Briefcase,
  Wallet,
  History,
  Trophy,
  Users,
  Users2,
  Bell,
  ShieldCheck,
  UserCircle,
  Settings,
  LifeBuoy,
  LogOut,
  Globe,
  Moon,
  GraduationCap,
  Terminal,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { ProTraderCard, SentimentGauge } from './SidebarWidgets';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  alert?: number;
  to?: string;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, alert, to, onClick }: SidebarItemProps) => {
  const content = (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
        active
          ? "bg-gold/10 text-gold border border-gold/20 shadow-[inset_0_0_12px_rgba(212,175,55,0.06)]"
          : "text-text-muted hover:text-text hover:bg-white/5 border border-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={cn("transition-colors shrink-0", active ? "text-gold" : "group-hover:text-text")} />
        <span className="font-medium text-sm tracking-wide">{label}</span>
      </div>
      {alert && (
        <span className="bg-gold text-[10px] text-black px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
          {alert}
        </span>
      )}
    </motion.div>
  );

  return to ? <Link to={to} className="block" onClick={onClick}>{content}</Link> : content;
};

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, role } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full border-r border-border bg-bg-2 flex flex-col p-4">
      <div className="flex flex-col items-center gap-2 mb-8 pr-4 relative min-h-[100px] justify-center">
        {onClose && (
           <button onClick={onClose} className="absolute right-0 top-0 md:hidden p-2 text-text-muted hover:text-text z-10">
              <X size={20} />
           </button>
        )}
        <img
          src="/logo.png"
          alt="Bullenhaus Logo"
          className="w-full max-w-[160px] h-auto object-contain mt-2"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = document.getElementById('logo-fallback');
            if(fallback) fallback.style.display = 'flex';
          }}
        />
        <div id="logo-fallback" className="hidden flex-col items-center">
          <div className="text-center mt-2">
            <p className="font-serif text-xl font-bold tracking-[0.2em]">
              <span className="gold-gradient-text">BULLEN</span>
              <span className="text-text">HAUS</span>
            </p>
            <p className="text-[8px] font-bold text-gold/70 tracking-[0.35em] uppercase mt-1">Trade · Invest · Grow</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto custom-scrollbar pr-2">
        <SidebarItem icon={LayoutDashboard} label={t('dashboard')} to="/trade/dashboard" active={currentPath === '/trade/dashboard'} onClick={onClose} />
        <SidebarItem icon={BarChart3} label={t('markets')} to="/trade/markets" active={currentPath === '/trade/markets'} onClick={onClose} />
        <SidebarItem icon={Repeat} label={t('trade')} to="/trade/terminal" active={currentPath === '/trade/terminal'} onClick={onClose} />
        <SidebarItem icon={Briefcase} label={t('portfolio')} to="/trade/portfolio" active={currentPath === '/trade/portfolio'} onClick={onClose} />
        <SidebarItem icon={History} label={t('transactions')} to="/trade/transactions" active={currentPath === '/trade/transactions'} onClick={onClose} />

        <div className="pt-4 pb-2 px-4 label-eyebrow">{t('growth', { defaultValue: 'Growth' })}</div>
        <SidebarItem icon={Trophy} label={t('rewards')} to="/trade/gamification" active={currentPath === '/trade/gamification'} onClick={onClose} />
        <SidebarItem icon={Users2} label={t('referrals')} to="/trade/referrals" active={currentPath === '/trade/referrals'} onClick={onClose} />
        <SidebarItem icon={Bell} label={t('notifications')} to="/trade/notifications" active={currentPath === '/trade/notifications'} onClick={onClose} />

        <div className="pt-4 pb-2 px-4 label-eyebrow">{t('account', { defaultValue: 'Account' })}</div>
        <SidebarItem icon={ShieldCheck} label={t('kyc')} to="/trade/kyc" active={currentPath === '/trade/kyc'} onClick={onClose} />
        <SidebarItem icon={Settings} label={t('settings')} to="/trade/settings" active={currentPath === '/trade/settings'} onClick={onClose} />
        <SidebarItem icon={LifeBuoy} label={t('help')} to="/trade/support" active={currentPath === '/trade/support'} onClick={onClose} />

        {(role === 'admin' || role === 'trade_admin') && (
          <>
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-danger uppercase tracking-widest">System</div>
            <SidebarItem icon={Terminal} label={t('admin')} to="/admin/dashboard" active={currentPath.startsWith('/admin')} onClick={onClose} />
          </>
        )}

        <div className="pt-6">
          <ProTraderCard />
          <SentimentGauge />
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center justify-between px-2 mb-6">
          <div
            onClick={() => {
              const nextLang = i18n.language === 'en' ? 'de' : 'en';
              i18n.changeLanguage(nextLang);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border cursor-pointer hover:border-gold/30 transition-all"
          >
             <Globe size={14} className="text-text-muted" />
             <span className="text-[10px] font-bold text-text uppercase">{i18n.language}</span>
             <ChevronRight size={10} className="rotate-90 text-text-dim" />
          </div>
        </div>

        <div onClick={handleLogout} className="flex items-center justify-between px-2 text-text-muted hover:text-text cursor-pointer transition-colors group">
          <div className="flex items-center gap-2">
            <LogOut size={16} className="group-hover:text-danger transition-colors" />
            <span className="text-xs font-medium">{t('logout')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
