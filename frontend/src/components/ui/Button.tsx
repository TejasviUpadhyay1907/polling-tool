import { cn } from "../../utils/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "lime";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const SIZE = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-9 px-4 text-[12px]",
  lg: "h-11 px-6 text-[13px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  style,
  ...rest
}: Props) {
  const variantStyle: React.CSSProperties =
    variant === "primary"   ? {
      background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
      color: "var(--accent-ink)",
      border: "1px solid transparent",
      boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)",
    } :
    variant === "secondary" ? {
      background: "var(--surface)",
      color: "var(--ink)",
      border: "1px solid var(--line)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    } :
    variant === "ghost"     ? {
      background: "transparent",
      color: "var(--muted)",
      border: "1px solid transparent",
    } :
    variant === "danger"    ? {
      background: "var(--error-bg)",
      color: "var(--error)",
      border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
    } :
    variant === "lime"      ? {
      background: "linear-gradient(135deg, var(--lime) 0%, var(--accent-2) 100%)",
      color: "var(--accent-ink)",
      border: "1px solid transparent",
      boxShadow: "0 2px 8px color-mix(in srgb, var(--lime) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)",
    } : {};

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-600 rounded-[9px] transition-all duration-150 select-none whitespace-nowrap cursor-pointer overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        // Shine sweep on hover for primary/lime
        (variant === "primary" || variant === "lime") && "group",
        SIZE[size],
        className
      )}
      style={{ ...variantStyle, ...style }}
      {...rest}
    >
      {/* Shimmer shine overlay — sweeps left to right on hover */}
      {(variant === "primary" || variant === "lime") && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          }}
        />
      )}
      {loading && (
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
