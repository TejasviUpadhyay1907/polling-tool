import { cn } from "../../utils/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full h-10 rounded-[9px] border px-3.5 text-[13px] transition-colors duration-150",
        "placeholder:text-subtle",
        "focus:outline-none focus:ring-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{
        background: "var(--raised)",
        borderColor: "var(--line)",
        color: "var(--ink)",
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "var(--accent-2)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "var(--line)";
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[9px] border px-3.5 py-3 text-[13px] transition-colors duration-150",
        "placeholder:text-subtle",
        "focus:outline-none",
        "disabled:opacity-50 resize-none",
        className
      )}
      style={{
        background: "var(--raised)",
        borderColor: "var(--line)",
        color: "var(--ink)",
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = "var(--accent-2)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "var(--line)";
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[11px] font-700 tracking-[1.6px] uppercase", className)}
      style={{ color: "var(--muted)" }}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: "var(--error)" }}>
      ⚠ {message}
    </p>
  );
}
