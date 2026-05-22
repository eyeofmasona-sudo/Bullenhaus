import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Shield, Database, Settings, Search,
  Edit2, Lock, Plus, Trash2, RefreshCw, KeyRound,
  Loader2, AlertCircle, CheckCircle2, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useI18n } from "../lib/i18n";
import { supabase } from "../../trading/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Worker {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  role: "agent" | "manager" | "director" | "admin";
  kyc_status: string;
  created_at: string;
}

const ROLES = ["agent", "manager", "director", "admin"] as const;
const ROLE_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  admin:    "danger",
  director: "warning",
  manager:  "info",
  agent:    "default",
};

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

async function apiFetchWorkers(): Promise<Worker[]> {
  const res = await fetch("/api/crm/workers", { headers: await apiHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to load workers");
  return (await res.json()).workers;
}

async function apiCreateWorker(body: { email: string; password: string; full_name: string; role: string }) {
  const res = await fetch("/api/crm/workers", {
    method: "POST", headers: await apiHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create worker");
}

async function apiUpdateWorker(id: string, body: { role?: string; full_name?: string }) {
  const res = await fetch(`/api/crm/workers/${id}`, {
    method: "PATCH", headers: await apiHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update worker");
}

async function apiDeleteWorker(id: string) {
  const res = await fetch(`/api/crm/workers/${id}`, {
    method: "DELETE", headers: await apiHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to delete worker");
}

async function apiResetPassword(id: string, password: string) {
  const res = await fetch(`/api/crm/workers/${id}/reset-password`, {
    method: "POST", headers: await apiHeaders(), body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to reset password");
}

// ── Main Component ────────────────────────────────────────────────────────────

type ToastType = "success" | "error";
interface Toast { id: number; msg: string; type: ToastType }

export function AdminPanel() {
  const { t } = useI18n();

  const [workers, setWorkers]       = useState<Worker[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const [createOpen, setCreateOpen]       = useState(false);
  const [editTarget, setEditTarget]       = useState<Worker | null>(null);
  const [resetTarget, setResetTarget]     = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Worker | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  const [newEmail, setNewEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName]         = useState("");
  const [newRole, setNewRole]         = useState("agent");

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const [newPw, setNewPw]             = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");

  const showToast = (msg: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWorkers(await apiFetchWorkers());
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = workers.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.email.toLowerCase().includes(q) || (w.full_name || "").toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || w.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = workers.reduce((acc, w) => {
    acc[w.role] = (acc[w.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setFormError(null);
    try {
      await apiCreateWorker({ email: newEmail, password: newPassword, full_name: newName, role: newRole });
      showToast(`Worker ${newEmail} created`);
      setCreateOpen(false);
      setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("agent");
      await load();
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setFormLoading(true); setFormError(null);
    try {
      await apiUpdateWorker(editTarget.id, { role: editRole, full_name: editName });
      showToast("Worker updated");
      setEditTarget(null);
      await load();
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPw !== newPwConfirm) { setFormError("Passwords do not match"); return; }
    setFormLoading(true); setFormError(null);
    try {
      await apiResetPassword(resetTarget.id, newPw);
      showToast("Password reset successfully");
      setResetTarget(null); setNewPw(""); setNewPwConfirm("");
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      await apiDeleteWorker(deleteTarget.id);
      showToast(`${deleteTarget.email} removed`);
      setDeleteTarget(null);
      await load();
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setFormLoading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12 relative">

      {/* Toast stack */}
      <div className="fixed top-5 right-5 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-2 px-4 py-3 rounded border text-xs font-medium shadow-lg pointer-events-auto ${
                t.type === "success"
                  ? "bg-aura-emerald/10 border-aura-emerald/30 text-aura-emerald"
                  : "bg-aura-ruby/10 border-aura-ruby/30 text-aura-ruby"
              }`}
            >
              {t.type === "success"
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                : <AlertCircle  className="w-3.5 h-3.5 shrink-0" />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="border-b border-glass-border pb-4">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">
          {t('adminTitle')}
        </h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">
          {t('adminSubtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { icon: Users,    label: "Total Workers",       value: workers.length,                                    color: "text-aura-gold" },
          { icon: Shield,   label: "Admins / Directors",  value: (roleCounts.admin || 0) + (roleCounts.director || 0), color: "text-aura-ruby" },
          { icon: Database, label: "Managers",            value: roleCounts.manager || 0,                           color: "text-blue-400" },
          { icon: Settings, label: "Agents",              value: roleCounts.agent   || 0,                           color: "text-aura-platinum/60" },
        ] as const).map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-glass-border bg-[#121214] p-5 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
            <div className="text-xl font-light text-aura-platinum">{loading ? "—" : value}</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Workers table */}
      <div className="rounded-xl border border-glass-border bg-[#121214] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-glass-border">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">CRM Workers</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-black/40 border border-glass-border rounded pl-9 pr-4 py-1.5 text-xs text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors w-40"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="bg-black/40 border border-glass-border rounded px-3 py-1.5 text-[10px] text-aura-platinum uppercase tracking-widest outline-none focus:border-aura-gold/50 appearance-none pr-7 cursor-pointer"
              >
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
            </div>
            <button
              onClick={load} disabled={loading}
              className="p-1.5 rounded border border-glass-border hover:border-aura-gold/30 hover:bg-white/5 text-aura-platinum/50 hover:text-aura-gold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button variant="primary" size="sm" onClick={() => { setFormError(null); setCreateOpen(true); }}>
              <Plus className="w-3 h-3" /> Add Worker
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[9px] font-bold tracking-[0.2em] text-aura-platinum/40 uppercase border-b border-glass-border">
                <th className="px-5 py-3">Name / Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Added</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-aura-gold/50 mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-aura-platinum/30 text-xs">
                  {search || roleFilter !== "all" ? "No workers match your filter" : "No CRM workers yet — click «Add Worker» to create one"}
                </td></tr>
              ) : filtered.map(worker => (
                <tr key={worker.id} className="border-b border-glass-border/50 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="text-sm text-aura-platinum font-medium">{worker.full_name || worker.display_name || "—"}</div>
                    <div className="text-[10px] text-aura-platinum/40 font-mono mt-0.5">{worker.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={ROLE_COLORS[worker.role] || "default"}>{worker.role}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-[10px] text-aura-platinum/40 font-mono">
                    {new Date(worker.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Edit" onClick={() => { setEditTarget(worker); setEditName(worker.full_name || ""); setEditRole(worker.role); setFormError(null); }}
                        className="p-1.5 rounded hover:bg-white/10 text-aura-platinum/50 hover:text-aura-gold transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button title="Reset password" onClick={() => { setResetTarget(worker); setNewPw(""); setNewPwConfirm(""); setFormError(null); }}
                        className="p-1.5 rounded hover:bg-white/10 text-aura-platinum/50 hover:text-blue-400 transition-colors">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button title="Delete" onClick={() => setDeleteTarget(worker)}
                        className="p-1.5 rounded hover:bg-aura-ruby/10 text-aura-platinum/50 hover:text-aura-ruby transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New CRM Worker" subtitle="Account will be immediately active">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <FormError msg={formError} />}
          <FormField label="Full Name">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Mira Sable" className={inputCls} />
          </FormField>
          <FormField label="Email *">
            <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="mira@company.com" className={inputCls} />
          </FormField>
          <FormField label="Password *">
            <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters" className={inputCls} />
          </FormField>
          <FormField label="Role *">
            <RoleSelect value={newRole} onChange={setNewRole} />
          </FormField>
          <ModalFooter onCancel={() => setCreateOpen(false)} loading={formLoading} submitLabel="Create Worker" />
        </form>
      </Modal>

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Worker" subtitle={editTarget?.email}>
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <FormError msg={formError} />}
          <FormField label="Full Name">
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Role">
            <RoleSelect value={editRole} onChange={setEditRole} />
          </FormField>
          <ModalFooter onCancel={() => setEditTarget(null)} loading={formLoading} submitLabel="Save Changes" />
        </form>
      </Modal>

      {/* ── RESET PASSWORD MODAL ─────────────────────────────────────────────── */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" subtitle={resetTarget?.email}>
        <form onSubmit={handleResetPw} className="space-y-4">
          {formError && <FormError msg={formError} />}
          <FormField label="New Password">
            <input type="password" required minLength={8} value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Min 8 characters" className={inputCls} />
          </FormField>
          <FormField label="Confirm Password">
            <input type="password" required value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)}
              placeholder="Repeat password" className={inputCls} />
          </FormField>
          <ModalFooter onCancel={() => setResetTarget(null)} loading={formLoading} submitLabel="Reset Password"
            submitIcon={<Lock className="w-3 h-3" />} />
        </form>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Worker" subtitle="This action cannot be undone">
        <div className="space-y-5">
          <div className="p-4 rounded bg-aura-ruby/5 border border-aura-ruby/20">
            <p className="text-sm text-aura-platinum/80">
              Permanently delete{" "}
              <span className="text-aura-ruby font-medium">{deleteTarget?.full_name || deleteTarget?.email}</span>?
            </p>
            <p className="text-[10px] text-aura-platinum/40 mt-1.5 font-mono">{deleteTarget?.email}</p>
          </div>
          <div className="pt-2 border-t border-glass-border flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" isLoading={formLoading} onClick={handleDelete}>
              <Trash2 className="w-3 h-3" /> Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-black/40 border border-glass-border rounded px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors placeholder:text-aura-platinum/20";

function FormError({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded bg-aura-ruby/5 border border-aura-ruby/20 text-xs text-aura-ruby">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
    </div>
  );
}

function ModalFooter({
  onCancel, loading, submitLabel, submitIcon,
}: { onCancel: () => void; loading: boolean; submitLabel: string; submitIcon?: React.ReactNode }) {
  return (
    <div className="pt-3 border-t border-glass-border flex justify-end gap-2">
      <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
      <Button variant="primary" type="submit" isLoading={loading}>
        {submitIcon}{submitLabel}
      </Button>
    </div>
  );
}
