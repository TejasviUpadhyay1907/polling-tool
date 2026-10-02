import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { createPoll } from "../api/polls";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Label, FieldError } from "../components/ui/Input";

import { OPTION_COLORS } from "../utils/colors";

export function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions]   = useState<string[]>(["", ""]);
  const [expiresAt, setExpiresAt]               = useState("");
  const [showResultsBeforeVote, setShowResults] = useState(true);
  const [settingsOpen, setSettingsOpen]         = useState(false);
  const [errors, setErrors] = useState<{ question?: string; options?: string }>({});

  const mut = useMutation({
    mutationFn: () =>
      createPoll({
        question: question.trim(),
        options: options.map(o => o.trim()).filter(Boolean),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        showResultsBeforeVote,
      }),
    onSuccess: (poll) => { toast.success("Poll created"); navigate(`/p/${poll.id}`, { replace: true }); },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        "Failed to create poll";
      toast.error(msg);
    },
  });

  const updateOption = (idx: number, val: string) =>
    setOptions(prev => prev.map((o, i) => (i === idx ? val : o)));

  const addOption = () => {
    if (options.length >= 6) return toast.error("Maximum 6 options");
    setOptions(p => [...p, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return toast.error("At least 2 options required");
    setOptions(p => p.filter((_, i) => i !== idx));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q       = question.trim();
    const cleaned = options.map(o => o.trim()).filter(Boolean);
    const next: typeof errors = {};
    if (!q || q.length < 5)   next.question = "Question must be at least 5 characters";
    if (q.length > 200)        next.question = "Question must be under 200 characters";
    if (cleaned.length < 2)   next.options  = "Add at least 2 options";
    if (cleaned.some(o => o.length > 80)) next.options = "Each option must be under 80 characters";
    if (new Set(cleaned.map(o => o.toLowerCase())).size !== cleaned.length)
      next.options = "Options must be unique";
    setErrors(next);
    if (Object.keys(next).length) return;
    mut.mutate();
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="mx-auto max-w-[680px] px-4 sm:px-6 py-8 sm:py-10">
        {/* Back */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] text-subtle hover:text-muted mb-6 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>

        {/* Heading */}
        <div className="mb-7">
          <p className="eyebrow mb-3"><span className="eyebrow-dot" /> New poll</p>
          <h1 className="font-display font-800 text-[26px] sm:text-[30px] tracking-[-1px] text-ink">
            Create a poll
          </h1>
          <p className="text-[13px] text-muted mt-1.5">Ask a question, add options, share — results update live.</p>
        </div>

        <form onSubmit={onSubmit} noValidate>

          {/* ── Section 1: Question ──────────────────────────────── */}
          <div className="bg-surface border border-line rounded-[14px] shadow-card overflow-hidden mb-4">
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line">
              <p className="font-mono text-[9px] uppercase tracking-[1.8px] text-accent mb-3">01 / Your question</p>
              <Label htmlFor="question" className="mb-2 block">Question</Label>
              <Textarea
                id="question"
                placeholder="e.g. What should we prioritize next sprint?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                maxLength={200}
                rows={3}
                className="text-[14px]"
              />
              <div className="flex justify-between mt-2">
                <FieldError message={errors.question} />
                <span className="text-[10px] text-subtle ml-auto">{question.length}/200</span>
              </div>
            </div>
          </div>

          {/* ── Section 2: Options ───────────────────────────────── */}
          <div className="bg-surface border border-line rounded-[14px] shadow-card overflow-hidden mb-4">
            <div className="px-5 sm:px-6 pt-5 pb-5">
              <p className="font-mono text-[9px] uppercase tracking-[1.8px] text-accent mb-3">02 / Answer options</p>
              <div className="flex items-center justify-between mb-3">
                <Label>Options</Label>
                <span className="text-[10px] text-subtle">2 – 6 options · voters pick one</span>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {options.map((opt, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex gap-2 items-center"
                    >
                      {/* Color dot */}
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: OPTION_COLORS[idx % OPTION_COLORS.length] }}
                      />
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        maxLength={80}
                        onChange={e => updateOption(idx, e.target.value)}
                        className="flex-1"
                        style={{ borderLeftColor: OPTION_COLORS[idx % OPTION_COLORS.length], borderLeftWidth: 2 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        disabled={options.length <= 2}
                        className="text-subtle hover:text-error disabled:opacity-30 transition-colors flex-shrink-0"
                        aria-label={`Remove option ${idx + 1}`}
                      >
                        <Trash2 className="h-[14px] w-[14px]" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <FieldError message={errors.options} />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                disabled={options.length >= 6}
                className="mt-3 text-accent hover:text-lime"
              >
                <Plus className="h-[13px] w-[13px]" /> Add option
              </Button>
            </div>
          </div>

          {/* ── Section 3: Settings (collapsible) ────────────────── */}
          <div className="bg-surface border border-line rounded-[14px] shadow-card overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setSettingsOpen(v => !v)}
              className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left"
            >
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[1.8px] text-accent mb-0.5">03 / Settings</p>
                <p className="text-[13px] font-600 text-ink">Poll settings</p>
              </div>
              <motion.div animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-subtle" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-line space-y-4">
                    {/* Expiry */}
                    <div>
                      <Label htmlFor="expires" className="mb-2 block">
                        Closes at <span className="normal-case tracking-normal font-400 text-subtle">(optional)</span>
                      </Label>
                      <Input
                        id="expires"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        className="max-w-[280px]"
                      />
                    </div>

                    {/* Toggle: show results before vote */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={showResultsBeforeVote}
                          onChange={e => setShowResults(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`h-5 w-9 rounded-full border transition-colors duration-200 ${showResultsBeforeVote ? "bg-accent border-accent/40" : "bg-raised border-line"}`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${showResultsBeforeVote ? "left-[18px] bg-accent-ink" : "left-0.5 bg-subtle"}`} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-600 text-ink leading-[1.4]">Show results before voting</p>
                        <p className="text-[11px] text-muted mt-0.5 leading-[1.7]">
                          If off, results only appear after a user votes or when the poll closes.
                        </p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Submit ───────────────────────────────────────────── */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={mut.isPending}
              className="flex-1"
            >
              Create poll <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>

          <p className="text-center text-[10px] text-subtle mt-4 font-mono">
            Backend: {(import.meta.env.VITE_API_URL as string) || "http://localhost:8080"}
          </p>
        </form>
      </div>
    </div>
  );
}
