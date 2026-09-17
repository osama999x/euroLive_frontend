"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateTimeRangeValue = {
  from: string; // datetime-local value or ""
  to: string;
};

type PresetId = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local wall-clock → `YYYY-MM-DDTHH:mm` for datetime-local inputs */
export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 0, 0);
  return x;
}

function splitLocal(value: string): { date: string; time: string } {
  if (!value || !value.includes("T")) return { date: "", time: "" };
  const [date, time] = value.split("T");
  return { date, time: (time ?? "").slice(0, 5) };
}

function joinLocal(date: string, time: string, fallbackTime: string): string {
  if (!date) return "";
  return `${date}T${time || fallbackTime}`;
}

function presetRange(id: Exclude<PresetId, "custom">): DateTimeRangeValue {
  const now = new Date();
  if (id === "today") {
    return { from: toLocalInput(startOfDay(now)), to: toLocalInput(endOfDay(now)) };
  }
  if (id === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { from: toLocalInput(startOfDay(y)), to: toLocalInput(endOfDay(y)) };
  }
  if (id === "7d") {
    const from = startOfDay(new Date(now));
    from.setDate(from.getDate() - 6);
    return { from: toLocalInput(from), to: toLocalInput(endOfDay(now)) };
  }
  if (id === "30d") {
    const from = startOfDay(new Date(now));
    from.setDate(from.getDate() - 29);
    return { from: toLocalInput(from), to: toLocalInput(endOfDay(now)) };
  }
  // month
  const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  return { from: toLocalInput(from), to: toLocalInput(endOfDay(now)) };
}

const PRESETS: { id: Exclude<PresetId, "custom">; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-muted/60 px-3 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40 [color-scheme:dark]";

export function DateTimeRangePicker({
  value,
  onChange,
  onApply,
  onReset,
  applying,
}: {
  value: DateTimeRangeValue;
  onChange: (next: DateTimeRangeValue) => void;
  onApply: (next?: DateTimeRangeValue) => void;
  onReset: () => void;
  applying?: boolean;
}) {
  const [preset, setPreset] = useState<PresetId>("7d");
  const fromParts = useMemo(() => splitLocal(value.from), [value.from]);
  const toParts = useMemo(() => splitLocal(value.to), [value.to]);

  const invalid =
    Boolean(value.from && value.to) &&
    new Date(value.from).getTime() > new Date(value.to).getTime();

  function applyPreset(id: Exclude<PresetId, "custom">) {
    setPreset(id);
    const next = presetRange(id);
    onChange(next);
    onApply(next);
  }

  function markCustom(next: DateTimeRangeValue) {
    setPreset("custom");
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">
          Quick range
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={cn(
                "btn-press rounded-lg border px-3 py-1.5 text-sm transition",
                preset === p.id
                  ? "border-primary bg-gold-gradient font-medium text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={cn(
              "btn-press rounded-lg border px-3 py-1.5 text-sm transition",
              preset === "custom"
                ? "border-primary bg-gold-gradient font-medium text-primary-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2 rounded-xl border border-primary/15 bg-muted/20 p-3">
          <legend className="px-1 text-xs tracking-[0.14em] text-primary uppercase">
            From
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <input
                type="date"
                className={fieldClass}
                value={fromParts.date}
                max={toParts.date || undefined}
                onChange={(e) =>
                  markCustom({
                    ...value,
                    from: joinLocal(e.target.value, fromParts.time, "00:00"),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Time</span>
              <input
                type="time"
                step={60}
                className={fieldClass}
                value={fromParts.time || "00:00"}
                disabled={!fromParts.date}
                onChange={(e) =>
                  markCustom({
                    ...value,
                    from: joinLocal(fromParts.date, e.target.value, "00:00"),
                  })
                }
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-primary/15 bg-muted/20 p-3">
          <legend className="px-1 text-xs tracking-[0.14em] text-primary uppercase">
            To
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <input
                type="date"
                className={fieldClass}
                value={toParts.date}
                min={fromParts.date || undefined}
                onChange={(e) =>
                  markCustom({
                    ...value,
                    to: joinLocal(e.target.value, toParts.time, "23:59"),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Time</span>
              <input
                type="time"
                step={60}
                className={fieldClass}
                value={toParts.time || "23:59"}
                disabled={!toParts.date}
                onChange={(e) =>
                  markCustom({
                    ...value,
                    to: joinLocal(toParts.date, e.target.value, "23:59"),
                  })
                }
              />
            </label>
          </div>
        </fieldset>
      </div>

      {invalid ? (
        <p className="text-sm text-danger">“From” must be earlier than “To”.</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Times use your local timezone. Empty range loads all available data.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="btn-press flex-1 sm:flex-none"
            onClick={() => {
              setPreset("custom");
              onReset();
            }}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="btn-press flex-1 sm:flex-none"
            disabled={invalid || applying}
            onClick={() => onApply(value)}
          >
            {applying ? "Applying…" : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Convert datetime-local string to ISO for API, or undefined if empty */
export function localInputToIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function defaultReportRange(): DateTimeRangeValue {
  return presetRange("7d");
}
