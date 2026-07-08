import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, Loader2, Plus, RefreshCw, ScrollText, Workflow } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase/browserClient";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

type WorkflowStatus = "active" | "disabled" | "draft";

interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  trigger?: string | null;
  trigger_type?: string | null;
  trigger_config?: unknown;
  conditions?: unknown;
  actions?: unknown;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: string;
  conditions: unknown;
  actions: unknown;
  created_at: string;
  updated_at: string;
}

function normalizeJson(value: unknown, fallback: unknown) {
  if (value == null) return fallback;
  return value;
}

function toRule(row: WorkflowRow): WorkflowRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    status: row.status ?? "disabled",
    trigger: row.trigger ?? row.trigger_type ?? "",
    conditions: normalizeJson(row.conditions, {}),
    actions: normalizeJson(row.actions, []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function WorkflowRules() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("workflows")
        .select("id, name, description, status, trigger, trigger_type, trigger_config, conditions, actions, created_by, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (dbError) throw dbError;
      setRules(((data ?? []) as WorkflowRow[]).map(toRule));
    } catch (e) {
      console.error("[WorkflowRules] Unable to load workflow rules", e);
      setRules([]);
      setError("Unable to load workflow rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter(r => r.status === "active").length,
    disabled: rules.filter(r => r.status === "disabled").length,
  }), [rules]);

  const createPlaceholder = async () => {
    try {
      const payload = {
        name: "New workflow rule",
        description: "",
        status: "draft" as WorkflowStatus,
        trigger: "manual",
        trigger_type: "manual",
        trigger_config: {},
        conditions: {},
        actions: [],
      };
      const { error: dbError } = await supabase.from("workflows").insert(payload);
      if (dbError) throw dbError;
      toast.success("Workflow rule created");
      setNewOpen(false);
      await load();
    } catch (e) {
      console.error("[WorkflowRules] Unable to create workflow rule", e);
      toast.error("Unable to create workflow rule");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-glass-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum flex items-center gap-3">
            <Workflow className="text-aura-gold" size={22} /> Workflow Rules
          </h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">
            {stats.total} total rules / {stats.active} active / {stats.disabled} disabled
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} isLoading={loading}>
            {!loading && <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </Button>
          <Button variant="outline" onClick={() => setLogOpen(true)}>
            <ScrollText className="h-3.5 w-3.5" /> Log
          </Button>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Rule
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-aura-ruby/25 bg-aura-ruby/5 p-4 text-sm text-aura-ruby">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-glass-border bg-[#121214] py-16 text-aura-platinum/40">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-aura-gold" /> Loading workflow rules
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-glass-border bg-[#121214] py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-aura-platinum/20" />
          <div className="text-sm text-aura-platinum/50">0 total rules / 0 active / 0 disabled</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {rules.map(rule => (
            <div key={rule.id} className="rounded-xl border border-glass-border bg-[#121214] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-aura-platinum">{rule.name}</div>
                  <div className="mt-1 text-xs text-aura-platinum/40">{rule.description || "No description"}</div>
                </div>
                <span className="rounded border border-aura-gold/20 bg-aura-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-aura-gold">
                  {rule.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] text-aura-platinum/50 md:grid-cols-3">
                <div>Trigger: <span className="text-aura-platinum">{rule.trigger || "not configured"}</span></div>
                <div>Conditions: <span className="text-aura-platinum">{Array.isArray(rule.conditions) ? rule.conditions.length : Object.keys((rule.conditions as any) ?? {}).length}</span></div>
                <div>Actions: <span className="text-aura-platinum">{Array.isArray(rule.actions) ? rule.actions.length : Object.keys((rule.actions as any) ?? {}).length}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="New Workflow Rule" subtitle="Create a draft rule">
        <div className="space-y-4 text-sm text-aura-platinum/60">
          <p>This creates a draft manual workflow rule. Configure trigger, conditions, and actions after creation.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={createPlaceholder}>Create Draft</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title="Workflow Log" subtitle="No executions yet">
        <div className="rounded-lg border border-dashed border-glass-border p-8 text-center text-xs text-aura-platinum/40">
          Workflow execution logging is not configured yet.
        </div>
      </Modal>
    </div>
  );
}
