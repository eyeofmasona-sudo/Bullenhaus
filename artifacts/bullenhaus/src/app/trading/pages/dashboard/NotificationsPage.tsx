import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchTable } from '../../../../lib/supabase/frontendData';

export const Notifications = () => {
  const { t } = useTranslation('common');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await fetchTable<any>('notifications', (q) =>
      q.select('*').order('created_at', { ascending: false }).limit(50)
    );
    if (dbError) setError(dbError);
    setNotifications(data.map((n: any) => ({
      id: n.id,
      title: n.title || 'Notification',
      message: n.message || 'No details yet.',
      read: !!n.read,
      time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Now',
      icon: Bell,
    })));
    setLoading(false);
  };

  useEffect(() => { loadNotifications(); }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500 panel-shell">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="section-title mb-2">{t('notifications')}</h1>
              <p className="text-slate-400">Stay updated with your account activity and market alerts.</p>
           </div>
           <button 
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
           >
             <Check size={14} />
             Mark all as read
           </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="status-loading">
              <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="status-error flex-col gap-4">
              <Bell size={48} className="mx-auto mb-4 opacity-20" />
              <p className="mb-4">{error}</p>
              <button onClick={loadNotifications} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold">Retry</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="status-empty flex-col gap-2">
               <Bell size={48} className="mx-auto mb-4 opacity-20" />
               <p>No notifications to show</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-6 flex gap-6 group relative transition-all ${!n.read ? 'border-l-4 border-accent-primary' : 'border-white/5'}`}
              >
                <div className={`p-4 rounded-2xl ${!n.read ? 'bg-accent-primary/10 text-accent-primary' : 'bg-white/5 text-slate-500'}`}>
                   <n.icon size={24} />
                </div>
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold ${!n.read ? 'text-white' : 'text-slate-400'}`}>{n.title}</h3>
                      <span className="text-[10px] font-medium text-slate-500 uppercase">{n.time}</span>
                   </div>
                   <p className="text-sm text-slate-500 leading-relaxed">{n.message}</p>
                </div>
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
