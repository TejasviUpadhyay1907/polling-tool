import { cn } from "../../utils/cn";

export function Skeleton({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[7px]", className)}
      style={{ background: "var(--raised)", ...style }}
      {...props}
    />
  );
}
