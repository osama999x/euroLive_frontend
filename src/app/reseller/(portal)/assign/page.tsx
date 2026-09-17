"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type {
  AssignDuration,
  AssignedItem,
  CatalogItem,
  CatalogType,
  ResellerUserLookup,
} from "@/lib/api/types";
import { useResellerAuth } from "@/lib/auth/reseller-store";

export default function ResellerAssignPage() {
  const { reseller } = useResellerAuth();
  const { error, success } = useToast();
  const perms = reseller?.permissions;
  const canSetExpiry = perms?.canSetExpiry ?? false;
  const canRemove = perms?.canRemove ?? false;

  const typeOptions = useMemo(() => {
    const opts: { value: CatalogType; label: string }[] = [];
    if (perms?.canAssignFrame) opts.push({ value: "frame", label: "Frame" });
    if (perms?.canAssignEntry) opts.push({ value: "entry", label: "Entry" });
    if (perms?.canAssignBadge) opts.push({ value: "badge", label: "Badge" });
    return opts;
  }, [perms]);

  const [type, setType] = useState<CatalogType>("frame");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [publicId, setPublicId] = useState("10000001");
  const [user, setUser] = useState<ResellerUserLookup | null>(null);
  const [catalogItemId, setCatalogItemId] = useState("");
  const [duration, setDuration] = useState<AssignDuration>("7");
  const [customDays, setCustomDays] = useState("14");
  const [lastAssignment, setLastAssignment] = useState<AssignedItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeOptions.length && !typeOptions.some((t) => t.value === type)) {
      setType(typeOptions[0].value);
    }
  }, [typeOptions, type]);

  useEffect(() => {
    if (!typeOptions.length) return;
    resellerApi
      .catalog({ type, page: 1, limit: 100 })
      .then((res) => {
        setCatalog(res.items);
        setCatalogItemId(res.items[0]?.id ?? "");
      })
      .catch((err) => error(err));
  }, [type, typeOptions.length, error]);

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

  async function assign(e: FormEvent) {
    e.preventDefault();
    if (!user || !catalogItemId) return;
    setBusy(true);
    const body = {
      publicId: user.publicId,
      catalogItemId,
      duration: canSetExpiry ? duration : ("7" as AssignDuration),
      customDays:
        canSetExpiry && duration === "custom"
          ? Number.parseInt(customDays, 10)
          : undefined,
    };
    try {
      let result: AssignedItem;
      if (type === "frame") result = await resellerApi.assignFrame(body);
      else if (type === "entry") result = await resellerApi.assignEntry(body);
      else result = await resellerApi.assignBadge(body);
      setLastAssignment(result);
      success(`Assigned ${type} · id ${result.id}`);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
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

  if (!typeOptions.length) {
    return (
      <PageHeader
        title="Assign items"
        description="You do not have frame/entry/badge assign permissions."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Assign items"
        description="Pick from reseller catalog, then assign by publicId."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="1. Lookup user">
          <form onSubmit={lookup} className="space-y-3">
            <Input
              label="Public ID"
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              required
            />
            <Button type="submit" disabled={busy}>
              Lookup
            </Button>
          </form>
          {user ? (
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <span>
                  {user.displayName} (@{user.username})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge tone={user.status === "banned" ? "danger" : "success"}>
                  {user.status}
                </Badge>
              </div>
            </div>
          ) : null}
        </Card>

        <Card title="2. Assign">
          <form onSubmit={assign} className="space-y-3">
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as CatalogType)}
              options={typeOptions}
            />
            <Select
              label="Catalog item"
              value={catalogItemId}
              onChange={(e) => setCatalogItemId(e.target.value)}
              options={
                catalog.length
                  ? catalog.map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.price} coins)`,
                    }))
                  : [{ value: "", label: "No items" }]
              }
            />
            {canSetExpiry ? (
              <>
                <Select
                  label="Duration"
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value as AssignDuration)
                  }
                  options={[
                    { value: "1", label: "1 day" },
                    { value: "7", label: "7 days" },
                    { value: "30", label: "30 days" },
                    { value: "custom", label: "Custom" },
                    { value: "permanent", label: "Permanent" },
                  ]}
                />
                {duration === "custom" ? (
                  <Input
                    label="Custom days"
                    type="number"
                    min={1}
                    step={1}
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    required
                  />
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Expiry is controlled by catalog defaults (canSetExpiry is off).
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || !user || user.status === "banned" || !catalogItemId}
            >
              Assign
            </Button>
          </form>
          {lastAssignment && canRemove ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Last assignment id:{" "}
                <span className="font-mono text-foreground">
                  {lastAssignment.id}
                </span>
              </p>
              <Button variant="danger" disabled={busy} onClick={removeLast}>
                Remove last assignment
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
