import { motion } from "framer-motion";
import type { Poll } from "../../types";
import { cn } from "../../utils/cn";
import { OPTION_COLORS as COLORS } from "../../utils/colors";

export function ResultBars({ poll, highlightId }: { poll: Poll; highlightId?: string }) {
  const total    = poll.totalVotes || 0;
  const sorted   = [...poll.options].sort((a, b) => b.votes - a.votes);
  const winnerId = total > 0 ? sorted[0].id : null;

  return (
    <div className="space-y-2.5">
      {poll.options.map((opt, i) => {
        const pct        = total ? Math.round((opt.votes / total) * 100) : 0;
        const isWinner   = opt.id === winnerId && total > 0;
        const isSelected = opt.id === highlightId;
        const color      = COLORS[i % COLORS.length];

        return (
          <div
            key={opt.id}
            className={cn(
              "relative overflow-hidden rounded-[10px] border bg-raised p-3.5 transition-colors",
              isSelected ? "border-accent/50" : isWinner ? "border-accent-2/30" : "border-line",
            )}
          >
            {/* Background fill bar */}
            <motion.div
              className="absolute inset-0 origin-left opacity-[0.12]"
              style={{ background: color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: pct / 100 }}
              transition={{ type: "spring", stiffness: 100, damping: 22 }}
            />

            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                {/* Color dot */}
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-500 text-ink leading-[1.4]">{opt.text}</p>
                  <p className="text-[10px] text-subtle mt-0.5">
                    {opt.votes} vote{opt.votes !== 1 ? "s" : ""}
                    {isSelected && <span className="text-accent ml-1.5 font-600">· Your vote</span>}
                    {isWinner && !isSelected && <span className="ml-1.5 font-600" style={{ color }}>· Leading</span>}
                  </p>
                </div>
              </div>
              <span className="flex-shrink-0 text-[13px] font-700 tabular-nums" style={{ color }}>
                {pct}%
              </span>
            </div>

            {/* Thin bottom progress bar */}
            <div className="relative mt-2.5 h-[3px] rounded-full bg-line overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
              />
            </div>
          </div>
        );
      })}

      <p className="text-[11px] text-subtle text-center pt-1">
        {total} total vote{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
