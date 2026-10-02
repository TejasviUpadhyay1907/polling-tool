import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Power, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { fetchPoll, votePoll, togglePoll, deletePoll } from "../api/polls";
import { usePollStream } from "../hooks/usePollStream";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { SharePanel } from "../components/poll/SharePanel";
import { ResultBars } from "../components/poll/ResultBars";
import { LiveHeader } from "../components/poll/LiveHeader";
import { timeAgo, isExpired } from "../utils/format";
import type { Poll } from "../types";

import { OPTION_COLORS } from "../utils/colors";

export function PollView() {
  const { id }  = useParams<{ id: string }>();
  const qc      = useQueryClient();
  const { user }= useAuth();

  const [selected,    setSelected]    = useState<string | null>(null);
  const [votedOption, setVotedOption] = useState<string | null>(() =>
    id ? localStorage.getItem(`pulsep_voted_${id}`) : null
  );
  const [livePoll, setLivePoll] = useState<Poll | null>(null);

  const { data: fetched, isLoading, isError, error } = useQuery({
    queryKey: ["poll", id],
    queryFn:  () => fetchPoll(id!),
    enabled:  !!id,
  });

  const poll: Poll | undefined = livePoll ?? fetched;

  const onLivePoll = useCallback((p: Poll) => {
    setLivePoll(p);
    qc.setQueryData(["poll", id], p);
  }, [id, qc]);

  const { state: streamState } = usePollStream(id, onLivePoll);

  useEffect(() => { if (fetched) setLivePoll(null); }, [fetched]);
  useEffect(() => {
    if (id) { const v = localStorage.getItem(`pulsep_voted_${id}`); setVotedOption(v); }
  }, [id]);

  const voteMut = useMutation({
    mutationFn: (optionId: string) => votePoll(id!, optionId),
    onSuccess: (res) => {
      if (selected) { localStorage.setItem(`pulsep_voted_${id}`, selected); setVotedOption(selected); }
      qc.setQueryData(["poll", id], res.poll);
      setLivePoll(res.poll);
      const opt = res.poll.options.find((o) => o.id === selected);
      toast.success(opt ? `Voted for "${opt.text}"` : "Vote recorded");
      confetti({ particleCount: 80, spread: 62, origin: { y: 0.72 }, colors: ["#aed6b6","#72d4c2","#c9edac"] });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        "Vote failed";
      toast.error(msg);
    },
  });

  const toggleMut = useMutation({
    mutationFn: () => togglePoll(id!),
    onSuccess: (p) => { qc.setQueryData(["poll", id], p); setLivePoll(p); toast.success(p.isActive ? "Poll reopened" : "Poll closed"); },
    onError: () => toast.error("Could not update poll"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deletePoll(id!),
    onSuccess: () => { toast.success("Poll deleted"); window.location.href = "/dashboard"; },
    onError: () => toast.error("Delete failed"),
  });

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="mx-auto max-w-[780px] px-4 sm:px-6 py-10 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2.5 mt-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (isError || !poll) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="mx-auto max-w-[560px] px-4 sm:px-6 py-16 text-center">
          <div className="bg-surface border border-error/20 rounded-[18px] p-8 sm:p-10">
            <div className="mx-auto h-12 w-12 rounded-[12px] bg-error-bg border border-error/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <h2 className="font-display font-700 text-[20px] tracking-[-0.5px] text-ink mb-2">Poll not found</h2>
            <p className="text-[12px] text-muted font-mono break-all leading-[1.8]">
              {(error as { message?: string })?.message || "Check the link or that the backend is running."}
            </p>
            <Link to="/" className="inline-flex mt-6">
              <Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const expired     = isExpired(poll);
  const closed      = !poll.isActive || expired;
  const hasVoted    = !!votedOption;
  const canVote     = !closed && !hasVoted;
  const showResults = hasVoted || closed || poll.showResultsBeforeVote !== false;
  const total       = poll.totalVotes;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="mx-auto max-w-[780px] px-4 sm:px-6 py-8 sm:py-10">

        {/* Back */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="inline-flex items-center gap-1.5 text-[12px] text-subtle hover:text-muted mb-5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {user ? "Dashboard" : "Home"}
        </Link>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <LiveHeader state={streamState} totalVotes={total} />
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-subtle">
            <span className="flex items-center gap-1"><Clock className="h-[11px] w-[11px]" /> {timeAgo(poll.createdAt)}</span>
            {poll.expiresAt && !expired && (
              <span>· closes {new Date(poll.expiresAt).toLocaleString()}</span>
            )}
            {expired    && <Badge variant="warning">Expired</Badge>}
            {!expired && !poll.isActive && <Badge variant="closed">Closed</Badge>}
            {!expired &&  poll.isActive  && <Badge variant="live">Open</Badge>}
          </div>
        </div>

        {/* Main card */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
          <div className="bg-surface border border-line rounded-[18px] shadow-card overflow-hidden">

            {/* Poll header */}
            <div className="px-5 sm:px-7 pt-6 pb-5 border-b border-line">
              <h1 className="font-display font-700 text-[20px] sm:text-[22px] tracking-[-0.6px] leading-[1.35] text-ink">
                {poll.question}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-subtle">
                <span className="flex items-center gap-1"><Users className="h-[11px] w-[11px]" /> {total} vote{total !== 1 ? "s" : ""}</span>
                <span>· {poll.options.length} options</span>
                {hasVoted && <span className="text-accent font-600">· You voted</span>}
                {closed   && <span className="text-warning font-600">· {expired ? "Expired" : "Closed"}</span>}
              </div>
            </div>

            {/* Poll body */}
            <div className="px-5 sm:px-7 py-6">

              {/* Closed banner */}
              {closed && (
                <div className="flex items-center gap-2.5 rounded-[9px] border border-warning/30 bg-warning-bg px-4 py-3 mb-5 text-[12px] text-warning">
                  <AlertTriangle className="h-[13px] w-[13px] flex-shrink-0" />
                  {expired ? "This poll has expired — voting is disabled." : "This poll is closed — voting is disabled."}
                </div>
              )}

              {/* Vote options */}
              {canVote ? (
                <div className="space-y-2.5" role="radiogroup" aria-label="Poll options">
                  {poll.options.map((opt, i) => {
                    const isSelected = selected === opt.id;
                    const color = OPTION_COLORS[i % OPTION_COLORS.length];
                    return (
                      <motion.button
                        key={opt.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelected(opt.id)}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full text-left rounded-[10px] border p-4 flex items-center gap-3 transition-colors duration-150 ${
                          isSelected
                            ? "border-accent/50 bg-accent-soft"
                            : "border-line bg-raised hover:border-line-2"
                        }`}
                      >
                        {/* Radio dot */}
                        <span
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "border-accent bg-accent" : "border-line"
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" />}
                        </span>
                        {/* Color bar */}
                        <span className="h-3.5 w-0.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-[14px] font-500 text-ink flex-1 truncate">{opt.text}</span>
                      </motion.button>
                    );
                  })}

                  <Button
                    disabled={!selected || voteMut.isPending}
                    loading={voteMut.isPending}
                    onClick={() => selected && voteMut.mutate(selected)}
                    variant="primary"
                    size="lg"
                    className="w-full mt-3"
                  >
                    {voteMut.isPending ? "Submitting…" : "Submit vote"}
                  </Button>
                  <p className="text-center text-[10px] text-subtle">One vote per device. Results update live.</p>
                </div>

              ) : (
                <AnimatePresence mode="wait">
                  {showResults ? (
                    <motion.div key="results" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.2 }}>
                      <ResultBars poll={poll} highlightId={votedOption ?? undefined} />
                      {hasVoted && !closed && (
                        <p className="mt-3 text-center text-[12px] text-muted">
                          You voted for{" "}
                          <span className="font-600 text-ink">
                            {poll.options.find(o => o.id === votedOption)?.text ?? votedOption}
                          </span>
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.p
                      key="hidden"
                      initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="text-center text-[13px] text-muted py-8"
                    >
                      Vote to see live results.
                    </motion.p>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Owner controls */}
            {user && (
              <div className="px-5 sm:px-7 py-3.5 bg-raised border-t border-line flex flex-wrap gap-2 items-center">
                <p className="text-[9px] uppercase tracking-[1.4px] text-subtle mr-2">Owner controls</p>
                <Button
                  variant="secondary" size="sm"
                  onClick={() => toggleMut.mutate()}
                  disabled={toggleMut.isPending}
                >
                  <Power className="h-[13px] w-[13px]" />
                  {poll.isActive && !expired ? "Close poll" : "Reopen poll"}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { if (confirm("Delete this poll? Cannot be undone.")) deleteMut.mutate(); }}
                  disabled={deleteMut.isPending}
                  className="text-subtle hover:text-error"
                >
                  <Trash2 className="h-[13px] w-[13px]" /> Delete
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Share panel */}
        <div className="mt-5">
          <SharePanel pollId={poll.id} />
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-subtle mt-6 font-mono">
          Live via GET /api/polls/{poll.id}/stream · SSE + Redis · MongoDB
        </p>
      </div>
    </div>
  );
}
