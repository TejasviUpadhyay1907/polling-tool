import { cn } from "../../utils/cn";

type Variant = "default" | "live" | "closed" | "warning" | "accent" | "muted";

const STYLES: Record<Variant, React.CSSProperties> = {
  default: { background: "var(--raised)",      border: "1px solid var(--line)",                                              color: "var(--muted)"   },
  live:    { background: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",      color: "var(--accent)"  },
  closed:  { background: "var(--raised)",      border: "1px solid var(--line)",                                              color: "var(--subtle)"  },
  warning: { background: "var(--warning-bg)",  border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",     color: "var(--warning)" },
  accent:  { background: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",      color: "var(--accent)"  },
  muted:   { background: "transparent",        border: "none",                                                               color: "var(--subtle)"  },
};

export function Badge({
  variant = "default",
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-700 tracking-[1.4px] uppercase",
        className
      )}
      style={{ ...STYLES[variant], ...style }}
      {...props}
    />
  );
}
