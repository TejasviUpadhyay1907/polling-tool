import { cn } from "../../utils/cn";

export function LiveDot({ active = true, className }: { active?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-[5px] h-[5px] rounded-full flex-shrink-0",
        active ? "bg-success animate-pulseDot" : "bg-subtle",
        className
      )}
    />
  );
}
