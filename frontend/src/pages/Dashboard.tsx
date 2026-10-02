import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Power, ExternalLink, Clock, Users, Search, Radio } from "lucide-react";
import toast from "react-hot-toast";
import { fetchMyPolls, togglePoll, deletePoll } from "../api/polls";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Input } from "../components/ui/Input";
import { timeAgo, isExpired, shareUrl } from "../utils/format";
import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

import { OPTION_COLORS } from "../utils/colors";

export function Dashboard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [q, setQ]             = useState("");
  const [filter, setFilter]   = useState<"all" | "live" | "closed">("all");

  const { data: polls, isLoading, isError, error } = useQuery({
    queryKey: ["my-polls"],
    queryFn: fetchMyPolls,
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => togglePoll(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-polls"] }); toast.success("Poll updated"); },
    onError: () => toast.error("Toggle failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePoll(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-polls"] }); toast.success("Deleted"); },
    onError: () => toast.error("Delete failed"),
  });

  const filtered = useMemo(() => {
    if (!polls) return [];
    return polls.filter((p) => {
      if (q && !p.question.toLowerCase().includes(q.toLowerCase())) return false;
      const expired = isExpired(p);
      if (filter === "live"   && (!p.isActive || expired)) return false;
      if (filter === "closed" && (p.isActive && !expired)) return false;
      return true;
    });
  }, [polls, q, filter]);

  const liveCount   = polls?.filter(p => p.isActive && !isExpired(p)).length ?? 0;
  const totalVotes  = polls?.reduce((s, p) => s + p.totalVotes, 0) ?? 0;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-8 sm:py-10">

        {/* ── Page heading ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-2"><span className="eyebrow-dot" /> Workspace</p>
            <h1 className="font-display font-800 text-[26px] sm:text-[30px] tracking-[-1px] text-ink">
              Your polls
            </h1>
            <p className="text-[13px] text-muted mt-1">
              Hello, {user?.name?.split(" ")[0] ?? "there"} — create, share, and watch results live.
            </p>
          </div>
          <Link to="/create">
            <Button variant="primary" size="md">
              <Plus className="h-[14px] w-[14px]" /> New poll
            </Button>
          </Link>
        </div>

        {/* ── Metric strip ──────────────────────────────────────── */}
        {!isLoading && !isError && polls && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {[
              { label: "Total polls",  value: polls.length,  icon: Radio },
              { label: "Live now",     value: liveCount,     icon: Radio, accent: true },
              { label: "Total votes",  value: totalVotes,    icon: Users },
            ].map((m) => (
              <div key={m.label} className="bg-surface border border-line rounded-[14px] p-4 sm:p-5">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[1.2px] text-subtle mb-3">
                  <span>{m.label}</span>
                  <m.icon className="h-[14px] w-[14px]" style={{ color: m.accent ? "var(--accent-2)" : "var(--subtle)" }} />
                </div>
                <p className={`font-display font-700 text-[28px] sm:text-[34px] tracking-[-1.2px] tabular-nums ${m.accent ? "text-accent-2" : "text-ink"}`}>
                  {m.value}
                </p>
                {m.accent && liveCount > 0 && (
                  <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
                    <div className="h-full bg-accent-2 transmit-bar active" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-[340px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-subtle" />
            <Input
              placeholder="Search polls…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="segmented">
            {(["all", "live", "closed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={v === filter ? "active" : ""}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading skeletons ──────────────────────────────────── */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-line rounded-[14px] p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {isError && (
          <div className="bg-surface border border-error/20 rounded-[14px] p-6 text-center">
            <p className="text-[14px] font-600 text-error mb-1">Couldn't load polls</p>
            <p className="text-[11px] text-subtle font-mono break-all">
              {(error as { message?: string })?.message || "Check that the backend is running."}
            </p>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────── */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="bg-surface border border-line rounded-[14px] p-10 sm:p-14 text-center">
            <div className="mx-auto h-14 w-14 rounded-[14px] bg-accent-soft border border-accent/20 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-display font-700 text-[18px] tracking-[-0.5px] text-ink">
              {polls?.length === 0 ? "No polls yet" : "No matching polls"}
            </h3>
            <p className="text-[13px] text-muted mt-2 max-w-[400px] mx-auto leading-[1.8]">
              {polls?.length === 0
                ? "Create your first poll and share the link — votes appear live without refreshing."
                : "Try a different search term or filter."}
            </p>
            {polls?.length === 0 && (
              <Link to="/create" className="inline-flex mt-5">
                <Button variant="primary">Create a poll</Button>
              </Link>
            )}
          </div>
        )}

        {/* ── Poll grid ─────────────────────────────────────────── */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((p) => {
                const expired = isExpired(p);
                const live    = p.isActive && !expired;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-surface border border-line rounded-[14px] shadow-card hover:border-line-2 hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full overflow-hidden">

                      {/* Card top */}
                      <div className="p-4 sm:p-5 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {live ? (
                            <Badge variant="live">
                              <span className="inline-block w-[5px] h-[5px] rounded-full bg-success animate-pulseDot" />
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="closed">{expired ? "Expired" : "Closed"}</Badge>
                          )}
                          <span className="ml-auto text-[10px] text-subtle flex items-center gap-1">
                            <Clock className="h-[11px] w-[11px]" />
                            {timeAgo(p.createdAt)}
                          </span>
                        </div>

                        <Link to={`/p/${p.id}`} className="block group mb-3">
                          <h3 className="text-[14px] font-600 leading-[1.45] text-ink group-hover:text-accent transition-colors line-clamp-2">
                            {p.question}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-3 text-[11px] text-subtle mb-3">
                          <span className="flex items-center gap-1"><Users className="h-[11px] w-[11px]" /> {p.totalVotes} votes</span>
                          <span>·</span>
                          <span>{p.options.length} options</span>
                        </div>

                        {/* Mini vote preview bars */}
                        <div className="space-y-1.5">
                          {p.options.slice(0, 3).map((o, i) => {
                            const pct = p.totalVotes ? Math.round((o.votes / p.totalVotes) * 100) : 0;
                            return (
                              <div key={o.id} className="relative h-[26px] rounded-[6px] bg-raised border border-line overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-[6px] opacity-20 transition-all duration-500"
                                  style={{ width: `${pct}%`, background: OPTION_COLORS[i % OPTION_COLORS.length] }}
                                />
                                <div className="absolute inset-0 flex items-center justify-between px-2.5">
                                  <span className="text-[10px] font-500 text-ink truncate max-w-[70%]">{o.text}</span>
                                  <span className="text-[10px] font-700 tabular-nums" style={{ color: OPTION_COLORS[i % OPTION_COLORS.length] }}>{pct}%</span>
                                </div>
                              </div>
                            );
                          })}
                          {p.options.length > 3 && (
                            <p className="text-[10px] text-subtle text-center">+{p.options.length - 3} more options</p>
                          )}
                        </div>
                      </div>

                      {/* Card footer */}
                      <div className="px-4 sm:px-5 py-3 bg-raised border-t border-line flex flex-wrap gap-1.5">
                        <Link to={`/p/${p.id}`} className="flex-1 min-w-[70px]">
                          <Button variant="secondary" size="sm" className="w-full">
                            <ExternalLink className="h-[12px] w-[12px]" /> Open
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => navigator.clipboard.writeText(shareUrl(p.id)).then(() => toast.success("Link copied"))}
                          className="flex-1 text-[11px]"
                        >
                          Copy link
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => toggleMut.mutate(p.id)}
                          disabled={toggleMut.isPending}
                          title={live ? "Close poll" : "Reopen poll"}
                          className="text-subtle hover:text-ink"
                        >
                          <Power className="h-[13px] w-[13px]" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { if (confirm("Delete this poll?")) deleteMut.mutate(p.id); }}
                          disabled={deleteMut.isPending}
                          className="text-subtle hover:text-error"
                        >
                          <Trash2 className="h-[13px] w-[13px]" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 flex items-center justify-between gap-4 text-[9px] uppercase tracking-[1.2px] text-subtle border-t border-line pt-5">
          <span>PulseP workspace</span>
          <span className="font-mono">React · Go · MongoDB · Redis</span>
        </div>
      </div>
    </div>
  );
}
