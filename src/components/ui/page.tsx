"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition",
            value === tab.id
              ? "bg-gold-gradient text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-gold-gradient sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
