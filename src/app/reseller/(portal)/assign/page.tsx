"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type {
  AssignDuration,
  AssignedItem,
  CatalogItem,
  ResellerUserLookup,
} from "@/lib/api/types";
import { useResellerAuth } from "@/lib/auth/reseller-store";
import { cn } from "@/lib/utils";

const DURATION_CHIPS: { value: AssignDuration; label: string }[] = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "permanent", label: "Permanent" },
];

type SectionKey = "frame" | "entry" | "badge";

function DurationChips({
  value,
  onChange,
  disabled,
  showCustom,
  customDays,
  onCustomDays,
}: {
  value: AssignDuration;
  onChange: (d: AssignDuration) => void;
  disabled?: boolean;
  showCustom?: boolean;
  customDays: string;
  onCustomDays: (v: string) => void;
}) {
  const chips = showCustom
    ? [...DURATION_CHIPS, { value: "custom" as AssignDuration, label: "Custom" }]
    : DURATION_CHIPS;

  return (
    <div className="space-y-2">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
        Duration
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(chip.value)}
            className={cn(
              "btn-press rounded-lg border px-3 py-1.5 text-sm transition",
              value === chip.value
                ? "border-primary bg-gold-gradient font-medium text-primary-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {value === "custom" ? (
        <Input
          label="Custom days"
          type="number"
          min={1}
          step={1}
          value={customDays}
          onChange={(e) => onCustomDays(e.target.value)}
          required
        />
      ) : null}
    </div>
  );
}

function CatalogSection({
  title,
  items,
  loading,
  selectedId,
  onSelect,
  duration,
  onDuration,
  customDays,
  onCustomDays,
  canSetExpiry,
  canAssign,
  busy,
  onAssign,
}: {
  title: string;
  items: CatalogItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  duration: AssignDuration;
  onDuration: (d: AssignDuration) => void;
  customDays: string;
  onCustomDays: (v: string) => void;
  canSetExpiry: boolean;
  canAssign: boolean;
  busy: boolean;
  onAssign: () => void;
}) {
  return (
    <Card title={title}>
      {loading ? (
        <LoadingBlock label={`Loading ${title.toLowerCase()}…`} />
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No items</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const selected = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!canAssign || busy}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "btn-press flex flex-col overflow-hidden rounded-xl border text-left transition",
                  selected
                    ? "border-primary bg-primary/10 shadow-[0_0_24px_rgba(212,175,55,0.15)]"
                    : "border-border bg-muted/30 hover:border-primary/40",
                  (!canAssign || busy) && "opacity-60",
                )}
              >
                <div className="relative aspect-square w-full bg-muted/60">
                  {item.assetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.assetUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-primary">{item.price} coins</p>
                  {!item.isActive ? (
                    <Badge tone="default">Inactive</Badge>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {canSetExpiry ? (
          <DurationChips
            value={duration}
            onChange={onDuration}
            disabled={!canAssign}
            showCustom
            customDays={customDays}
            onCustomDays={onCustomDays}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Duration fixed by catalog defaults (canSetExpiry is off). Assign uses 7
            days.
          </p>
        )}
        <Button
          type="button"
          className="btn-press w-full sm:w-auto"
          disabled={!canAssign || busy || !selectedId}
          onClick={onAssign}
        >
          {busy && selectedId ? "Assigning…" : "Assign selected"}
        </Button>
      </div>
    </Card>
  );
}

export default function ResellerAssignPage() {
  const { reseller } = useResellerAuth();
  const { error, success } = useToast();
  const perms = reseller?.permissions;
  const canSetExpiry = perms?.canSetExpiry ?? false;
  const canRemove = perms?.canRemove ?? false;
  const showFrames = Boolean(perms?.canAssignFrame);
  const showEntries = Boolean(perms?.canAssignEntry);
  const showBadges = Boolean(perms?.canAssignBadge);

  const [publicId, setPublicId] = useState("10000001");
  const [user, setUser] = useState<ResellerUserLookup | null>(null);
  const [frames, setFrames] = useState<CatalogItem[]>([]);
  const [entries, setEntries] = useState<CatalogItem[]>([]);
  const [badges, setBadges] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selected, setSelected] = useState<Record<SectionKey, string | null>>({
    frame: null,
    entry: null,
    badge: null,
  });
  const [duration, setDuration] = useState<Record<SectionKey, AssignDuration>>({
    frame: "7",
    entry: "7",
    badge: "7",
  });
  const [customDays, setCustomDays] = useState<Record<SectionKey, string>>({
    frame: "14",
    entry: "14",
    badge: "14",
  });
  const [lastAssignment, setLastAssignment] = useState<AssignedItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [assigningSection, setAssigningSection] = useState<SectionKey | null>(
    null,
  );

  const canAssign = Boolean(user && user.status !== "banned");

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);

    const jobs: Promise<void>[] = [];

    if (showFrames) {
      jobs.push(
        resellerApi
          .catalog({ type: "frame", page: 1, limit: 100 })
          .then((res) => {
            if (!cancelled) setFrames(res.items.filter((i) => i.type === "frame"));
          })
          .catch((err) => error(err)),
      );
    } else {
      setFrames([]);
    }

    if (showEntries) {
      jobs.push(
        resellerApi
          .catalog({ type: "entry", page: 1, limit: 100 })
          .then((res) => {
            if (!cancelled) setEntries(res.items.filter((i) => i.type === "entry"));
          })
          .catch((err) => error(err)),
      );
    } else {
      setEntries([]);
    }

    if (showBadges) {
      jobs.push(
        resellerApi
          .catalog({ type: "badge", page: 1, limit: 100 })
          .then((res) => {
            if (!cancelled) setBadges(res.items.filter((i) => i.type === "badge"));
          })
          .catch((err) => error(err)),
      );
    } else {
      setBadges([]);
    }

    void Promise.all(jobs).finally(() => {
      if (!cancelled) setLoadingCatalog(false);
    });

    return () => {
      cancelled = true;
    };
  }, [showFrames, showEntries, showBadges, error]);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(await resellerApi.lookupUser(publicId.trim()));
    } catch (err) {
      setUser(null);
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function assignSection(section: SectionKey) {
    if (!user) return;
    const catalogItemId = selected[section];
    if (!catalogItemId) return;

    setAssigningSection(section);
    setBusy(true);
    const dur = canSetExpiry ? duration[section] : ("7" as AssignDuration);
    const body = {
      publicId: user.publicId,
      catalogItemId,
      duration: dur,
      customDays:
        canSetExpiry && dur === "custom"
          ? Number.parseInt(customDays[section], 10)
          : undefined,
    };

    try {
      let result: AssignedItem;
      if (section === "frame") result = await resellerApi.assignFrame(body);
      else if (section === "entry") result = await resellerApi.assignEntry(body);
      else result = await resellerApi.assignBadge(body);
      setLastAssignment(result);
      success(`Assigned ${section} · id ${result.id}`);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
      setAssigningSection(null);
    }
  }

  async function removeLast() {
    if (!lastAssignment?.id) return;
    setBusy(true);
    try {
      await resellerApi.removeItem(lastAssignment.id);
      success("Assignment removed");
      setLastAssignment(null);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!showFrames && !showEntries && !showBadges) {
    return (
      <EmptyState
        title="Assign items"
        description="You do not have frame, entry, or badge assign permissions."
      />
    );
  }

  return (
    <div className="portal-list space-y-4">
      <PageHeader
        title="Assign items"
        description="Lookup a user, then tap a frame, entry, or badge card to assign."
      />

      <Card title="Lookup user">
        <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Public ID"
            value={publicId}
            onChange={(e) => {
              setPublicId(e.target.value);
              setUser(null);
            }}
            required
          />
          <Button type="submit" className="btn-press" disabled={busy}>
            {busy && !assigningSection ? "Looking up…" : "Lookup"}
          </Button>
        </form>
        {user ? (
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">User</span>
              <span>
                {user.displayName} (@{user.username}) · {user.publicId}
                {user.isOfficial ? (
                  <Badge tone="gold" className="ml-2">
                    Official
                  </Badge>
                ) : null}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge tone={user.status === "banned" ? "danger" : "success"}>
                {user.status}
              </Badge>
            </div>
            {user.status === "banned" ? (
              <p className="text-xs text-danger">Banned users cannot receive items.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select an item below and tap Assign.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Lookup must succeed before assign is enabled.
          </p>
        )}
      </Card>

      {showFrames ? (
        <CatalogSection
          title="Frames"
          items={frames}
          loading={loadingCatalog}
          selectedId={selected.frame}
          onSelect={(id) => setSelected((s) => ({ ...s, frame: id }))}
          duration={duration.frame}
          onDuration={(d) => setDuration((s) => ({ ...s, frame: d }))}
          customDays={customDays.frame}
          onCustomDays={(v) => setCustomDays((s) => ({ ...s, frame: v }))}
          canSetExpiry={canSetExpiry}
          canAssign={canAssign}
          busy={busy && assigningSection === "frame"}
          onAssign={() => void assignSection("frame")}
        />
      ) : null}

      {showEntries ? (
        <CatalogSection
          title="Entries"
          items={entries}
          loading={loadingCatalog}
          selectedId={selected.entry}
          onSelect={(id) => setSelected((s) => ({ ...s, entry: id }))}
          duration={duration.entry}
          onDuration={(d) => setDuration((s) => ({ ...s, entry: d }))}
          customDays={customDays.entry}
          onCustomDays={(v) => setCustomDays((s) => ({ ...s, entry: v }))}
          canSetExpiry={canSetExpiry}
          canAssign={canAssign}
          busy={busy && assigningSection === "entry"}
          onAssign={() => void assignSection("entry")}
        />
      ) : null}

      {showBadges ? (
        <CatalogSection
          title="Badges"
          items={badges}
          loading={loadingCatalog}
          selectedId={selected.badge}
          onSelect={(id) => setSelected((s) => ({ ...s, badge: id }))}
          duration={duration.badge}
          onDuration={(d) => setDuration((s) => ({ ...s, badge: d }))}
          customDays={customDays.badge}
          onCustomDays={(v) => setCustomDays((s) => ({ ...s, badge: v }))}
          canSetExpiry={canSetExpiry}
          canAssign={canAssign}
          busy={busy && assigningSection === "badge"}
          onAssign={() => void assignSection("badge")}
        />
      ) : null}

      {lastAssignment && canRemove ? (
        <Card title="Last assignment">
          <p className="mb-3 text-sm text-muted-foreground">
            id:{" "}
            <span className="font-mono text-foreground">{lastAssignment.id}</span>
          </p>
          <Button
            variant="danger"
            className="btn-press"
            disabled={busy}
            onClick={() => void removeLast()}
          >
            Remove last assignment
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
