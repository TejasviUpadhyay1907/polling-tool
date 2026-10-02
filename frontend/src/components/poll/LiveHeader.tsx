import { LiveDot } from "../ui/LiveDot";

type State = "connecting" | "open" | "closed" | "error";

export function LiveHeader({ state, totalVotes }: { state: State; totalVotes: number }) {
  const label =
    state === "open"       ? "Live"           :
    state === "connecting" ? "Connecting…"    :
    state === "error"      ? "Reconnecting…"  : "Offline";

  const active = state === "open";

  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
        <LiveDot active={active} />
        <span className={`text-[9px] font-700 tracking-[1.4px] uppercase ${active ? "text-success" : "text-subtle"}`}>
          {label}
        </span>
      </span>
      <span className="text-[12px] font-600 tabular-nums text-muted">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
