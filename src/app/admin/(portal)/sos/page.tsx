"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { SosAlert, SosStatus } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { asList, formatDate, isNotFoundError } from "@/lib/utils";

function SosList() {
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [items, setItems] = useState<SosAlert[]>([]);
  const [status, setStatus] = useState<SosStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listSos({
        limit: 50,
        status: status || undefined,
      });
      setItems(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("SOS API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function ack(id: string) {
    setBusy(true);
    try {
      await adminApi.ackSos(id);
      success("SOS acknowledged");
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitResolve(e: FormEvent) {
    e.preventDefault();
    if (!resolveId || !outcome.trim()) return;
    setBusy(true);
    try {
      await adminApi.resolveSos(resolveId, outcome.trim());
      success("SOS resolved");
      setResolveId(null);
      setOutcome("");
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader title="SOS alerts" description="Live safety escalations from rooms." />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SosStatus | "")}
            options={[
              { value: "", label: "All" },
              { value: "open", label: "Open" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "handling", label: "Handling" },
              { value: "escalated", label: "Escalated" },
              { value: "resolved", label: "Resolved" },
            ]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="btn-press w-full"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      {loading ? (
        <LoadingBlock label="Loading SOS…" />
      ) : items.length === 0 ? (
        <EmptyState title="No SOS alerts" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Message</th>
                  <th className="px-2 py-2 font-medium">Room</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="max-w-xs px-2 py-3">
                      <div className="truncate">{s.message ?? "—"}</div>
                      {s.overdue ? (
                        <Badge tone="danger" className="mt-1">
                          Overdue
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs">{s.roomId ?? "—"}</td>
                    <td className="px-2 py-3">
                      <Badge
                        tone={s.status === "resolved" ? "success" : "danger"}
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {s.status === "open" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void ack(s.id)}
                          >
                            Ack
                          </Button>
                        ) : null}
                        {master && s.status !== "resolved" ? (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => setResolveId(s.id)}
                          >
                            Resolve
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(resolveId)}
        onClose={() => setResolveId(null)}
        title="Resolve SOS (Master)"
      >
        <form onSubmit={submitResolve} className="space-y-3">
          <Textarea
            label="Outcome"
            required
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
          <Button type="submit" disabled={busy} className="w-full">
            Resolve
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminSosPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading SOS…" />}>
      <SosList />
    </Suspense>
  );
}
