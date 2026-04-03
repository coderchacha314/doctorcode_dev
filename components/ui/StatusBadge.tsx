"use client";

import { cn } from "@/lib/utils";

type Status = "normal" | "elevated" | "stable" | "high" | "low" | "borderline";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const labels: Record<Status, string> = {
  normal: "NORMAL",
  elevated: "ELEVATED",
  stable: "STABLE",
  high: "HIGH",
  low: "LOW",
  borderline: "BORDERLINE",
};

const styles: Record<Status, string> = {
  normal: "status-normal",
  elevated: "status-elevated",
  stable: "status-stable",
  high: "status-high",
  low: "status-low",
  borderline: "status-elevated",
};

export default function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
