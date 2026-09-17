import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function Card({ children, className, title, description, action }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-primary/20 bg-card/90 p-4 shadow-[0_0_40px_rgba(0,0,0,0.35)] transition duration-300 hover:border-primary/40 hover:shadow-[0_0_48px_rgba(212,175,55,0.12)] sm:p-5",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-display text-base font-semibold text-gold-soft sm:text-lg">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? (
            <div className="shrink-0 sm:pt-0.5">{action}</div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_8px_32px_rgba(212,175,55,0.12)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-gold-gradient sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
