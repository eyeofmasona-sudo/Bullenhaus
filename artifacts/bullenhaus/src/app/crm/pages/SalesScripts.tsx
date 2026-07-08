import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, FileText, Heart, Mail, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  AGENT_BEST_PRACTICES,
  COMPLIANCE_BLACKLIST,
  OBJECTION_HANDLING_MATRIX,
  SALES_SCRIPT_CATEGORIES,
  SALES_SCRIPTS,
  type SalesScript,
  type SalesScriptCategory,
} from "../data/salesScripts";

const FAVORITES_KEY = "bullenhaus_sales_script_favorites";

function emailCopy(script: SalesScript) {
  return `Subject: ${script.emailSubject}\n\n${script.emailBody}`;
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch (error) {
    console.error("[SalesScripts] Clipboard copy failed", error);
    toast.error(`Unable to copy ${label.toLowerCase()}`);
  }
}

function hasKeyword(script: SalesScript, keyword: string) {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  return [
    script.title,
    script.category,
    script.clientStage,
    script.channel,
    script.useCase,
    script.scriptShort,
    script.scriptFull,
    script.agentNote,
    script.tags.join(" "),
  ].join(" ").toLowerCase().includes(q);
}

function stageLabel(stage: string) {
  return stage.replace(/_/g, " ");
}

function ScriptCard({
  script,
  favorite,
  onFavorite,
  onView,
}: {
  script: SalesScript;
  favorite: boolean;
  onFavorite: () => void;
  onView: () => void;
}) {
  return (
    <div className="rounded-xl border border-glass-border bg-[#121214] p-4 transition-colors hover:border-aura-gold/25">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-aura-platinum">{script.title}</h3>
            <span className="rounded border border-aura-gold/20 bg-aura-gold/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-aura-gold">
              {script.category}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-widest text-aura-platinum/40">
            <span>{stageLabel(script.clientStage)}</span>
            <span>/</span>
            <span>{script.channel}</span>
            <span>/</span>
            <span>{script.riskLevel} risk</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onFavorite}
          className={`rounded-lg border p-2 transition-colors ${
            favorite
              ? "border-aura-gold/40 bg-aura-gold/10 text-aura-gold"
              : "border-white/5 bg-black/30 text-aura-platinum/40 hover:text-aura-gold"
          }`}
          title={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
        </button>
      </div>

      <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-aura-platinum/65">{script.scriptShort}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {script.tags.slice(0, 4).map(tag => (
          <span key={tag} className="rounded-md border border-white/5 bg-black/30 px-2 py-1 text-[9px] text-aura-platinum/40">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Button variant="outline" size="sm" onClick={onView}>
          <FileText className="h-3.5 w-3.5" /> View Full Script
        </Button>
        <Button variant="secondary" size="sm" onClick={() => copyText("Full script", script.scriptFull)}>
          <Copy className="h-3.5 w-3.5" /> Copy Script
        </Button>
        <Button variant="secondary" size="sm" onClick={() => copyText("WhatsApp", script.whatsappVersion)}>
          <MessageCircle className="h-3.5 w-3.5" /> Copy WhatsApp
        </Button>
        <Button variant="secondary" size="sm" onClick={() => copyText("Email", emailCopy(script))}>
          <Mail className="h-3.5 w-3.5" /> Copy Email
        </Button>
        <Button variant={favorite ? "outline" : "ghost"} size="sm" onClick={onFavorite}>
          <Heart className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`} /> {favorite ? "Remove Favorite" : "Add to Favorites"}
        </Button>
      </div>
    </div>
  );
}

export function SalesScripts() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SalesScriptCategory | "All">("All");
  const [selected, setSelected] = useState<SalesScript | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const filtered = useMemo(() => {
    return SALES_SCRIPTS.filter(script => {
      const categoryMatch = category === "All" || script.category === category;
      return categoryMatch && hasKeyword(script, query);
    });
  }, [category, query]);

  const favoriteCount = favorites.size;

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success("Removed from favorites");
      } else {
        next.add(id);
        toast.success("Added to favorites");
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-glass-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="flex items-center gap-3 font-serif text-2xl font-light italic tracking-tight text-aura-platinum">
            <FileText className="text-aura-gold" size={22} /> Sales Scripts
          </h2>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-aura-platinum/40">
            {filtered.length} visible / {SALES_SCRIPTS.length} total / {favoriteCount} favorites
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-aura-gold/25 bg-aura-gold/8 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-aura-gold" />
        <div>
          <p className="text-xs font-bold text-aura-gold">Compliance Reminder</p>
          <p className="mt-1 text-xs text-aura-platinum/65">
            Do not promise profit. Do not guarantee returns. Always explain trading risk.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-[#121214] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-platinum/30" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by keyword, stage, tag, or channel"
              className="w-full rounded-lg border border-glass-border bg-black/30 py-2 pl-9 pr-3 text-xs text-aura-platinum outline-none focus:border-aura-gold/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", ...SALES_SCRIPT_CATEGORIES] as const).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-lg border px-3 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                  category === item
                    ? "border-aura-gold/40 bg-aura-gold/10 text-aura-gold"
                    : "border-white/5 bg-black/25 text-aura-platinum/45 hover:text-aura-platinum"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-glass-border bg-[#121214] p-12 text-center">
          <p className="text-sm font-bold text-aura-platinum">No scripts found</p>
          <p className="mt-1 text-xs text-aura-platinum/45">Adjust search or category filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map(script => (
            <ScriptCard
              key={script.id}
              script={script}
              favorite={favorites.has(script.id)}
              onFavorite={() => toggleFavorite(script.id)}
              onView={() => setSelected(script)}
            />
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-glass-border bg-[#121214] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-aura-platinum">
            <AlertTriangle className="h-4 w-4 text-aura-gold" /> Compliance Blacklist
          </h3>
          <div className="space-y-3">
            {COMPLIANCE_BLACKLIST.map(item => (
              <div key={item.bannedPhrase} className="rounded-lg border border-white/5 bg-black/25 p-3">
                <div className="text-xs font-bold text-aura-ruby">{item.bannedPhrase}</div>
                <div className="mt-1 text-xs text-aura-platinum/55">{item.compliantAlternative}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-[#121214] p-5">
          <h3 className="mb-4 text-sm font-bold text-aura-platinum">Best Practices for Bullenhaus Sales Agents</h3>
          <div className="space-y-2">
            {AGENT_BEST_PRACTICES.map(item => (
              <div key={item} className="rounded-lg border border-white/5 bg-black/25 p-3 text-xs text-aura-platinum/60">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-[#121214] p-5">
        <h3 className="mb-4 text-sm font-bold text-aura-platinum">Objection Handling Matrix</h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="border-b border-glass-border text-[9px] uppercase tracking-widest text-aura-platinum/35">
              <tr>
                <th className="p-3">Objection</th>
                <th className="p-3">Client Meaning</th>
                <th className="p-3">Wrong Response</th>
                <th className="p-3">Best Practice</th>
                <th className="p-3">Soft Close</th>
                <th className="p-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {OBJECTION_HANDLING_MATRIX.map(row => (
                <tr key={row.objection}>
                  <td className="p-3 font-bold text-aura-platinum">{row.objection}</td>
                  <td className="p-3 text-aura-platinum/55">{row.clientMeaning}</td>
                  <td className="p-3 text-aura-ruby/80">{row.wrongResponse}</td>
                  <td className="p-3 text-aura-platinum/70">{row.bestPracticeResponse}</td>
                  <td className="p-3 text-aura-gold/80">{row.softClose}</td>
                  <td className="p-3 text-aura-platinum/45">{row.complianceReminder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Sales Script"}
        subtitle={selected ? `${selected.category} / ${stageLabel(selected.clientStage)} / ${selected.channel}` : undefined}
        className="max-w-3xl"
      >
        {selected && (
          <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1 custom-scrollbar">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/40">Use Case</p>
              <p className="mt-1 text-sm text-aura-platinum/70">{selected.useCase}</p>
            </section>
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/40">Full Script</p>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-glass-border bg-black/25 p-4 text-sm leading-relaxed text-aura-platinum/80">
                {selected.scriptFull}
              </p>
            </section>
            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-glass-border bg-black/25 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/40">WhatsApp</p>
                <p className="mt-2 text-xs leading-relaxed text-aura-platinum/65">{selected.whatsappVersion}</p>
              </div>
              <div className="rounded-lg border border-glass-border bg-black/25 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/40">Email</p>
                <p className="mt-2 text-xs font-bold text-aura-gold">{selected.emailSubject}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-aura-platinum/65">{selected.emailBody}</p>
              </div>
            </section>
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-glass-border bg-black/25 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/40">Soft Close</p>
                <p className="mt-2 text-xs text-aura-platinum/65">{selected.softClose}</p>
              </div>
              <div className="rounded-lg border border-glass-border bg-black/25 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/40">Agent Note</p>
                <p className="mt-2 text-xs text-aura-platinum/65">{selected.agentNote}</p>
              </div>
              <div className="rounded-lg border border-aura-gold/20 bg-aura-gold/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-aura-gold">Compliance Notes</p>
                <p className="mt-2 text-xs text-aura-platinum/65">{selected.complianceNotes}</p>
              </div>
            </section>
            <div className="flex flex-wrap justify-end gap-2 border-t border-glass-border pt-4">
              <Button variant="secondary" onClick={() => copyText("Full script", selected.scriptFull)}>
                <Copy className="h-3.5 w-3.5" /> Copy Script
              </Button>
              <Button variant="secondary" onClick={() => copyText("WhatsApp", selected.whatsappVersion)}>
                <MessageCircle className="h-3.5 w-3.5" /> Copy WhatsApp
              </Button>
              <Button onClick={() => copyText("Email", emailCopy(selected))}>
                <Mail className="h-3.5 w-3.5" /> Copy Email
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
