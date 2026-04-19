import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-lg", className)}
      style={{ backgroundColor: "var(--color-overlay)" }}
    />
  );
}
