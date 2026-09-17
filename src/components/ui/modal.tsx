"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl border border-primary/30 bg-card p-4 shadow-2xl sm:rounded-xl sm:p-5",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-lg text-gold-soft sm:text-xl">
            {title}
          </h3>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}) {
  const prev = hasPreviousPage ?? page > 1;
  const next = hasNextPage ?? page < totalPages;
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span className="text-center sm:text-left">
        Page {page} of {totalPages}
      </span>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          variant="secondary"
          size="sm"
          className="btn-press"
          disabled={!prev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="btn-press"
          disabled={!next}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
