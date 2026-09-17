import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "success" | "danger" | "info" | "gold";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "default" && "bg-muted text-muted-foreground",
        tone === "success" && "bg-success/15 text-success",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "info" && "bg-info/15 text-info",
        tone === "gold" && "bg-primary/15 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
