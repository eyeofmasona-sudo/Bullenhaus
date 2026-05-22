import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Shield, CheckCircle2, RefreshCw, Eye, Plus, Minus, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
      if (selectedUser) {
        const refreshed = (data || []).find((u: any) => u.id === selectedUser.id);
        setSelectedUser(refreshed || null);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const adjustWallet = async (user: any, mode: 'add' | 'remove' | 'set') => {
    const label = mode === 'add' ? 'add' : mode === 'remove' ? 'remove' : 'set';
    const value = window.prompt(`Amount to ${label} for ${user.display_name || user.email}`);
    if (value === null) return;

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Enter a valid non-negative amount');
      return;
    }

    const currentBalance = Number(user.wallet?.balance || 0);
    const nextBalance = mode === 'set' ? amount : mode === 'add' ? currentBalance + amount : currentBalance - amount;
    if (nextBalance < 0) {
      toast.error('Wallet balance cannot be negative');
      return;
    }

    const confirmed = window.confirm(`${mode === 'set' ? 'Set' : label.charAt(0).toUpperCase() + label.slice(1)} $${amount.toLocaleString()} ${mode === 'remove' ? 'from' : mode === 'add' ? 'to' : 'for'} ${user.display_name || user.email}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: nextBalance })
        .eq('id', user.id);
      if (error) throw error;
      const newWallet = { ...(user.wallet || {}), balance: nextBalance };
      setUsers(curr => curr.map(item => item.id === user.id ? { ...item, balance: nextBalance, wallet: newWallet } : item));
      setSelectedUser((curr: any) => curr?.id === user.id ? { ...curr, balance: nextBalance, wallet: newWallet } : curr);
      toast.success('Wallet updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update wallet');
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(user => [user.id, user.email, user.display_name, user.role, user.kyc_status].some(value => String(value || '').toLowerCase().includes(query)));
  }, [search, users]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text">User Directory</h2>
          <p className="text-sm text-text-muted mt-1">Manage all registered users and their permissions.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search UUID, email, name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-dark pl-9 py-2 text-sm w-72"
            />
          </div>
          <button onClick={fetchUsers} className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all">
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Filter size={18} />}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4 font-bold">Identity</th>
              <th className="px-6 py-4 font-bold">UUID</th>
              <th className="px-6 py-4 font-bold">Role</th>
              <th className="px-6 py-4 font-bold">KYC</th>
              <th className="px-6 py-4 font-bold">Balance</th>
              <th className="px-6 py-4 font-bold">Created</th>
              <th className="px-6 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <Users size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">
                      {loading ? 'Loading users...' : 'No users found'}
                    </p>
                    <p className="text-xs text-text-dim">
                      {!loading && 'Adjust your search or wait for registrations.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-gold text-sm">
                      {String(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text group-hover:text-gold transition-colors">{user.display_name || user.email || 'User'}</p>
                      <p className="text-[10px] text-text-dim italic mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-dim truncate max-w-[120px]">{user.id}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                    user.role === 'ADMIN' ? 'bg-danger/10 text-danger' :
                    user.role === 'PRO' ? 'bg-gold/10 text-gold' :
                    'bg-surface text-text-muted'
                  }`}>
                    {user.role || 'client'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.kyc_status === 'VERIFIED'
                      ? <CheckCircle2 size={12} className="text-success" />
                      : <Shield size={12} className="text-text-dim" />}
                    <span className={user.kyc_status === 'VERIFIED' ? 'text-success' : 'text-text-muted'}>{user.kyc_status || 'PENDING'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-text">
                  ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="ml-2 text-[10px] text-text-dim">USD</span>
                </td>
                <td className="px-6 py-4 text-text-dim">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-1">
                      <button
                         onClick={() => setSelectedUser(user)}
                         className="p-2 text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all"
                         title="View Details"
                      >
                         <Eye size={15} />
                      </button>
                      <button
                         onClick={() => adjustWallet(user, 'add')}
                         className="p-2 text-text-dim hover:text-success hover:bg-success/10 rounded-lg transition-all"
                         title="Add Balance"
                      >
                         <Plus size={15} />
                      </button>
                      <button
                         onClick={() => adjustWallet(user, 'remove')}
                         className="p-2 text-text-dim hover:text-warning hover:bg-warning/10 rounded-lg transition-all"
                         title="Remove Balance"
                      >
                         <Minus size={15} />
                      </button>
                      <button
                         onClick={() => adjustWallet(user, 'set')}
                         className="p-2 text-text-dim hover:text-info hover:bg-info/10 rounded-lg transition-all"
                         title="Set Balance"
                      >
                         <Pencil size={15} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="glass-card mt-6 p-6 border-white/10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">User Details</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedUser.display_name || selectedUser.email}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs">
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">Identity</p>
              <p className="text-white break-all">{selectedUser.id}</p>
              <p className="text-slate-400 mt-2">{selectedUser.email}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">Access</p>
              <p className="text-white">Role: {selectedUser.role || 'N/A'}</p>
              <p className="text-slate-400 mt-2">KYC: {selectedUser.kyc_status || 'N/A'}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">Wallet</p>
              <p className="text-white font-mono text-lg">
                ${Number(selectedUser.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-slate-400 mt-2">{selectedUser.wallet?.currency || 'USD'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => adjustWallet(selectedUser, 'add')} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all">
              Add Assets
            </button>
            <button onClick={() => adjustWallet(selectedUser, 'remove')} className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold hover:bg-orange-500 hover:text-black transition-all">
              Remove Assets
            </button>
            <button onClick={() => adjustWallet(selectedUser, 'set')} className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500 hover:text-black transition-all">
              Edit Assets
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
