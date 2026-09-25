"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { SosAlert } from "@/lib/api/types";
import { useResellerAuth } from "@/lib/auth/reseller-store";
import { asList, formatDate } from "@/lib/utils";

export default function ResellerSosPage() {
  const { reseller } = useResellerAuth();
  const { error, success } = useToast();
  const allowed = Boolean(reseller?.permissions?.canViewSosAlerts);
  const [items, setItems] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosId, setSosId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    // Reseller ack is per-id; list may 404 — keep manual ack form.
    setLoading(false);
  }, [allowed]);

  async function onAck(e: FormEvent) {
    e.preventDefault();
    if (!sosId.trim()) return;
    setBusy(true);
    try {
      await resellerApi.ackSos(sosId.trim());
      success("SOS acknowledged");
      setSosId("");
      setItems((prev) =>
        prev.map((s) =>
          s.id === sosId.trim() ? { ...s, status: "acknowledged" } : s,
        ),
      );
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <EmptyState
        title="SOS permission required"
        description="Ask Master Admin to enable canViewSosAlerts on your reseller account."
      />
    );
  }

  if (loading) return <LoadingBlock label="Loading SOS…" />;

  return (
    <div className="portal-list space-y-4">
      <PageHeader
        title="SOS alerts"
        description="Acknowledge assigned SOS cases. Ack requires sos permission."
      />
      <Card title="Acknowledge by ID">
        <form onSubmit={onAck} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="SOS ID"
            required
            value={sosId}
            onChange={(e) => setSosId(e.target.value)}
            placeholder="uuid"
          />
          <Button type="submit" className="btn-press" disabled={busy}>
            {busy ? "Ack…" : "Acknowledge"}
          </Button>
        </form>
      </Card>
      {items.length > 0 ? (
        <Card>
          <ul className="space-y-2 text-sm">
            {asList(items).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{s.id}</p>
                  <p>{s.message || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </p>
                </div>
                <Badge tone="gold">{s.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
