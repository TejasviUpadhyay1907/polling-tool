import { cn } from "../../utils/cn";

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[14px] transition-colors duration-200", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 sm:px-6 pb-5 sm:pb-6", className)} {...props} />;
}

export function CardSection({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 sm:px-6 py-4", className)}
      style={{ background: "var(--raised)", borderTop: "1px solid var(--line)", ...style }}
      {...props}
    />
  );
}
