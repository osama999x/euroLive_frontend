"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn, formatMessage } from "@/lib/utils";

type ToastTone = "default" | "success" | "danger";

type ToastItem = {
  id: string;
  title: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (title: string | string[], tone?: ToastTone) => void;
  success: (title: string | string[]) => void;
  error: (title: string | string[] | unknown) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((title: string | string[], tone: ToastTone = "default") => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, title: formatMessage(title), tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (title) => push(title, "success"),
      error: (err) => {
        if (err && typeof err === "object" && "message" in err) {
          push((err as { message: string | string[] }).message, "danger");
          return;
        }
        push(typeof err === "string" ? err : "Request failed", "danger");
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
              item.tone === "success" &&
                "border-success/40 bg-success/15 text-foreground",
              item.tone === "danger" &&
                "border-danger/40 bg-danger/15 text-foreground",
              item.tone === "default" &&
                "border-primary/30 bg-card/95 text-foreground",
            )}
          >
            {item.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
