import { useEffect, useState } from "react";
import { Users, TrendingUp, AlertTriangle, BarChart2, ShieldAlert, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { useI18n } from "../lib/i18n";
import { supabase } from "../../../lib/supabase/browserClient";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface ManagerStats {
  agents: TeamMember[];
  managers: TeamMember[];
  totalClients: number;
  totalDeposits: number;
}

async function loadManagerStats(): Promise<ManagerStats> {
  const [teamRes, clientsRes, txRes] = await Promise.all([
    supabase.from("users").select("id, full_name, email, role").in("role", ["agent", "manager"]).order("role"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("transactions").select("amount").eq("type", "DEPOSIT").eq("status", "COMPLETED"),
  ]);

  const totalDeposits = (txRes.data ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0);

  return {
    agents: (teamRes.data ?? []).filter(u => u.role === "agent") as TeamMember[],
    managers: (teamRes.data ?? []).filter(u => u.role === "manager") as TeamMember[],
    totalClients: clientsRes.count ?? 0,
    totalDeposits,
  };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const callVolume = [
  { time: "08:00", volume: 0 },
  { time: "10:00", volume: 0 },
  { time: "12:00", volume: 0 },
  { time: "14:00", volume: 0 },
  { time: "16:00", volume: 0 },
  { time: "18:00", volume: 0 },
];

export function ManagerDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManagerStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const displayName = (m: TeamMember) => m.full_name || m.email.split("@")[0];

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t("managerTitle")}</h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t("managerSubtitle")}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl hover:border-aura-gold/20 transition-colors">
          <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">Total Deposits</div>
          <div className="mt-1 text-2xl font-light tracking-tight text-aura-gold">
            {loading ? "—" : fmt(stats?.totalDeposits ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-aura-emerald flex items-center gap-1">All completed deposits</div>
        </div>
        <div className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl hover:border-aura-gold/20 transition-colors">
          <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">Active Clients</div>
          <div className="mt-1 text-2xl font-light tracking-tight text-aura-platinum">
            {loading ? "—" : String(stats?.totalClients ?? 0)}
          </div>
          <div className="mt-2 text-[10px] text-aura-emerald flex items-center gap-1">Registered on platform</div>
        </div>
        <div className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl hover:border-aura-gold/20 transition-colors">
          <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">Team Size</div>
          <div className="mt-1 text-2xl font-light tracking-tight text-aura-platinum">
            {loading ? "—" : String((stats?.agents.length ?? 0) + (stats?.managers.length ?? 0))}
          </div>
          <div className="mt-2 text-[10px] text-aura-platinum/50 flex items-center gap-1">
            {stats?.managers.length ?? 0} managers · {stats?.agents.length ?? 0} agents
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Team Table */}
        <div className="xl:col-span-2 rounded-xl border border-glass-border bg-[#121214] p-8 flex flex-col overflow-x-auto min-h-[400px]">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Team Roster</h3>
            <Button variant="outline" size="sm">Export</Button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="border-b border-glass-border text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 uppercase">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[...(stats?.managers ?? []), ...(stats?.agents ?? [])].map((member) => (
                  <tr key={member.id} className="border-b border-glass-border border-opacity-50 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-aura-platinum">{displayName(member)}</td>
                    <td className="py-4 font-mono text-[10px] uppercase tracking-wider">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                        member.role === "manager"
                          ? "bg-aura-gold/10 text-aura-gold border border-aura-gold/20"
                          : "bg-white/5 text-aura-platinum/60 border border-glass-border"
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-[10px] text-aura-platinum/50">{member.email}</td>
                    <td className="py-4 text-right">
                      <span className="flex items-center justify-end gap-1.5 text-aura-emerald text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-aura-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {(stats?.agents.length === 0 && stats?.managers.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-aura-platinum/30 text-xs">No team members found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Call volume chart */}
          <div className="mt-8 pt-6 border-t border-glass-border">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-aura-platinum/60 mb-6 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" /> Call Volume Trend
            </h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callVolume} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="rgba(232,232,234,0.15)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#121214", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }}
                    itemStyle={{ color: "#E8E8EA" }}
                  />
                  <Area type="monotone" dataKey="volume" name="Calls" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#callGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right panel: Directors / Quick Stats */}
        <div className="rounded-xl border border-glass-border bg-[#121214] p-6 flex flex-col gap-4">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Quick Stats</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-aura-gold/10 rounded"><Users className="w-4 h-4 text-aura-gold" /></div>
                <div>
                  <div className="text-[10px] text-aura-platinum/50 uppercase tracking-wider">Agents</div>
                  <div className="text-sm font-bold text-aura-platinum">{loading ? "—" : stats?.agents.length ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-aura-gold/10 rounded"><TrendingUp className="w-4 h-4 text-aura-gold" /></div>
                <div>
                  <div className="text-[10px] text-aura-platinum/50 uppercase tracking-wider">Managers</div>
                  <div className="text-sm font-bold text-aura-platinum">{loading ? "—" : stats?.managers.length ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-aura-gold/10 rounded"><ShieldAlert className="w-4 h-4 text-aura-gold" /></div>
                <div>
                  <div className="text-[10px] text-aura-platinum/50 uppercase tracking-wider">Clients</div>
                  <div className="text-sm font-bold text-aura-platinum">{loading ? "—" : stats?.totalClients ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-aura-emerald/5 border border-aura-emerald/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-aura-emerald/10 rounded"><AlertTriangle className="w-4 h-4 text-aura-emerald" /></div>
                <div>
                  <div className="text-[10px] text-aura-platinum/50 uppercase tracking-wider">Total Deposits</div>
                  <div className="text-sm font-bold text-aura-emerald">{loading ? "—" : fmt(stats?.totalDeposits ?? 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
