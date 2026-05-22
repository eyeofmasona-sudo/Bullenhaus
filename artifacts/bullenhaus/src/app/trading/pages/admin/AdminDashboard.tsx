import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert, Users, Activity, Terminal, AlertTriangle,
  Zap, Globe2, ArrowDownRight, ArrowUpRight, CheckCircle2,
  Clock, XCircle, RefreshCw,
} from 'lucide-react';
import { MarketControlPanel } from './MarketControlPanel';
import { supabase } from '../../lib/supabase';

interface Metrics {
  totalUsers: number;
  pendingKyc: number;
  volumeToday: number;
  pendingTx: number;
}

interface TxEvent {
  id: string;
  type: string;
  status: string;
  amount: number;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

const TABS = ['overview', 'forex', 'system'] as const;
type Tab = typeof TABS[number];

const statusIcon = (s: string) => {
  if (s === 'Completed' || s === 'Approved') return <CheckCircle2 size={12} className="text-emerald-400" />;
  if (s === 'Rejected')  return <XCircle size={12} className="text-rose-400" />;
  return <Clock size={12} className="text-orange-400" />;
};

const statusColor = (s: string) =>
  s === 'Completed' || s === 'Approved' ? 'text-emerald-400' :
  s === 'Rejected'  ? 'text-rose-400'   :
  s === 'Pending'   ? 'text-orange-400' :
  'text-blue-400';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [metrics, setMetrics]     = useState<Metrics | null>(null);
  const [events, setEvents]       = useState<TxEvent[]>([]);
  const [alerts, setAlerts]       = useState<{ type: string; label: string; count: number }[]>([]);
  const [loading, setLoading]     = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingKycRes, txRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('kyc_status', 'PENDING'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const allTx: TxEvent[] = txRes.data || [];

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const volumeToday = allTx
        .filter(t => new Date(t.created_at) >= todayStart && (t.status === 'Completed' || t.status === 'Approved'))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const pendingTx = allTx.filter(t => t.status === 'Pending').length;

      setMetrics({
        totalUsers: usersRes.count ?? 0,
        pendingKyc: pendingKycRes.count ?? 0,
        volumeToday,
        pendingTx,
      });

      setEvents(allTx.slice(0, 20));

      const newAlerts: { type: string; label: string; count: number }[] = [];
      if ((pendingKycRes.count ?? 0) > 0)
        newAlerts.push({ type: 'kyc',  label: 'Pending KYC verifications',   count: pendingKycRes.count! });
      if (pendingTx > 0)
        newAlerts.push({ type: 'tx',   label: 'Pending deposit/withdrawal',  count: pendingTx });
      setAlerts(newAlerts);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const iv = window.setInterval(fetchData, 15000);
    return () => window.clearInterval(iv);
  }, []);

  const metricCards = [
    {
      label: 'Total Users',
      value: metrics?.totalUsers?.toLocaleString() ?? '…',
      sub: 'Registered accounts',
      icon: Users,
      color: 'text-accent-primary',
      ring: 'border-accent-primary/20',
    },
    {
      label: 'Volume Today',
      value: metrics ? `$${metrics.volumeToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '…',
      sub: 'Completed transactions',
      icon: Activity,
      color: 'text-accent-secondary',
      ring: 'border-accent-secondary/20',
    },
    {
      label: 'Pending KYC',
      value: metrics?.pendingKyc?.toString() ?? '…',
      sub: 'Awaiting review',
      icon: ShieldAlert,
      color: metrics?.pendingKyc ? 'text-orange-400' : 'text-slate-400',
      ring: metrics?.pendingKyc ? 'border-orange-400/20' : 'border-white/5',
    },
    {
      label: 'Pending Transfers',
      value: metrics?.pendingTx?.toString() ?? '…',
      sub: 'Deposits & withdrawals',
      icon: Zap,
      color: metrics?.pendingTx ? 'text-yellow-400' : 'text-slate-400',
      ring: metrics?.pendingTx ? 'border-yellow-400/20' : 'border-white/5',
    },
  ];

  return (
    <div className="max-w-[1700px] mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <Terminal className="text-rose-500" size={28} /> Command Center
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
            SYS_STATUS: NOMINAL |{' '}
            <span className="text-accent-primary">ROOT_ACCESS_GRANTED</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex flex-wrap bg-[#111] border border-white/5 p-1 rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab === 'forex' ? 'Market Control' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 relative z-10">
        {activeTab === 'overview' && (
          <>
            {/* Metric cards */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {metricCards.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`glass-card p-6 border relative overflow-hidden ${m.ring}`}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-full blur-2xl pointer-events-none ${m.color}`} />
                    <div className={`p-2 rounded-xl bg-white/5 ${m.color} w-fit mb-4`}>
                      <Icon size={20} />
                    </div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{m.label}</h4>
                    <p className="text-2xl font-bold font-mono text-white mb-1">{m.value}</p>
                    <p className="text-[10px] font-bold text-slate-500">{m.sub}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Event stream + Alerts */}
            <div className="col-span-12 xl:col-span-8">
              <div className="glass-card flex flex-col h-[520px]">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-accent-primary" /> Live Transaction Feed
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">{events.length} events</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                  {events.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">
                      No transactions yet
                    </div>
                  ) : events.map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className={`shrink-0 p-1.5 rounded-lg ${ev.type === 'Deposit' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {ev.type === 'Deposit'
                          ? <ArrowDownRight size={12} className="text-emerald-400" />
                          : <ArrowUpRight   size={12} className="text-rose-400"    />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {ev.user_name || ev.user_email || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {ev.type} · ${Number(ev.amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {statusIcon(ev.status)}
                        <span className={`text-[10px] font-bold ${statusColor(ev.status)}`}>{ev.status}</span>
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono shrink-0 w-20 text-right">
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active alerts */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              <div className="glass-card p-6 border-orange-500/20">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" /> Active Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-white/5 rounded-xl">
                      <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500" />
                      All clear — no pending actions
                    </div>
                  ) : alerts.map((al, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                        {al.type === 'kyc' ? <ShieldAlert size={16} /> : <Zap size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{al.label}</p>
                        <p className="text-[10px] text-orange-400">{al.count} item{al.count !== 1 ? 's' : ''} need attention</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Regional placeholder */}
              <div className="glass-card p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-center items-center text-center">
                <Globe2 size={80} className="text-white/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Global Nodes</h3>
                  <p className="text-xs text-slate-500">Infrastructure telemetry not connected</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'forex' && (
          <MarketControlPanel />
        )}

        {activeTab === 'system' && (
          <div className="col-span-12 glass-card p-8 text-center">
            <Terminal size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-bold text-white mb-2">System Diagnostics</h3>
            <p className="text-sm text-slate-500">Infrastructure metrics require a server-side monitoring agent.<br />Connect a telemetry source to enable this view.</p>
          </div>
        )}
      </div>
    </div>
  );
};
