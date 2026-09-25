import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessage(message: string | string[] | undefined): string {
  if (!message) return "Something went wrong";
  return Array.isArray(message) ? message.join(", ") : message;
}

export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // http://IP is not a secure context — randomUUID throws
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/** Normalize list endpoints that may return T[] or { items: T[] } */
export function asList<T>(data: T[] | { items: T[] } | PaginatedLike<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  return [];
}

type PaginatedLike<T> = { items: T[]; meta?: unknown };

export function isNotFoundError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === 404
  );
}

export function asPaginatedMeta(
  data: PaginatedLike<unknown> | unknown[] | null | undefined,
): import("@/lib/api/types").PaginationMeta | null {
  if (!data || Array.isArray(data)) return null;
  if ("meta" in data && data.meta && typeof data.meta === "object") {
    return data.meta as import("@/lib/api/types").PaginationMeta;
  }
  return null;
}
