import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../../contexts/AuthContext';

export interface PreMarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export const AdminPreMarket = () => {
  const { role } = useAuth();
  const [assets, setAssets] = useState<PreMarketAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PreMarketAsset>>({
    name: '',
    symbol: '',
    price: 0,
    description: '',
    image_url: '',
    is_active: true
  });

  const canEdit = role === 'trade_admin' || role === 'superadmin';

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('premarket_assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      toast.error('Failed to load Pre-Market assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSave = async () => {
    if (!canEdit) return;
    if (!formData.name || !formData.symbol || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (Number(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (formData.id) {
        const { error } = await supabase.from('premarket_assets').update(formData).eq('id', formData.id);
        if (error) throw error;
        toast.success('Asset updated successfully');
      } else {
        const { error } = await supabase.from('premarket_assets').insert([formData]);
        if (error) throw error;
        toast.success('Asset created successfully');
      }
      setShowForm(false);
      fetchAssets();
    } catch (err: any) {
      toast.error('Error saving asset: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      const { error } = await supabase.from('premarket_assets').delete().eq('id', id);
      if (error) throw error;
      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (err: any) {
      toast.error('Error deleting asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Pre-Market Assets</h2>
        {canEdit && (
          <button onClick={() => { setFormData({ name: '', symbol: '', price: 0, description: '', image_url: '', is_active: true }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Asset
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="glass-card p-6 border-accent-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">{formData.id ? 'Edit Asset' : 'New Asset'}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. Neuralink" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Symbol</label>
              <input type="text" value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. NRLK" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Price (USD)</label>
              <input type="number" min="0.01" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-mono focus:border-accent-primary/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Image URL</label>
              <input type="text" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. /neuralink-poster.png or https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="Asset description..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2 flex items-center gap-2">
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Save Asset
            </button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No Pre-Market assets found. Create one above.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Symbol</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                {canEdit && <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {asset.image_url ? (
                        <img src={asset.image_url} alt={asset.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><ImageIcon size={16} className="text-slate-400" /></div>
                      )}
                      <span className="font-bold text-white">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-mono">{asset.symbol}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">${Number(asset.price).toFixed(2)}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setFormData(asset); setShowForm(true); }} className="p-2 text-slate-400 hover:text-white transition-colors" title="Edit"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-400 hover:text-rose-400 transition-colors ml-2" title="Delete"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};