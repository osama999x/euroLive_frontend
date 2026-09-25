"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { FreezeCase, FreezeStatus } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { asList, formatDate, isNotFoundError } from "@/lib/utils";

function FreezesList() {
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [items, setItems] = useState<FreezeCase[]>([]);
  const [status, setStatus] = useState<FreezeStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [createForm, setCreateForm] = useState({
    ownerId: "",
    ownerType: "user",
    freezeType: "wallet" as "coins" | "account" | "wallet",
    reason: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listFreezes({ status: status || undefined });
      setItems(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Freezes API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!master) return;
    setBusy(true);
    try {
      await adminApi.createFreeze(createForm);
      success("Freeze case created");
      setCreateOpen(false);
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function review(action: "restore" | "confirm" | "ban") {
    if (!reviewId) return;
    setBusy(true);
    try {
      await adminApi.reviewFreeze(reviewId, {
        action,
        note: reviewNote || undefined,
      });
      success(`Freeze ${action}`);
      setReviewId(null);
      setReviewNote("");
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Freezes"
        description="Wallet and account freeze cases."
        action={
          master ? (
            <Button onClick={() => setCreateOpen(true)}>Create freeze</Button>
          ) : null
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as FreezeStatus | "")}
            options={[
              { value: "", label: "All" },
              { value: "pending_review", label: "Pending review" },
              { value: "frozen", label: "Frozen" },
              { value: "restored", label: "Restored" },
              { value: "confirmed", label: "Confirmed" },
            ]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      {loading ? (
        <LoadingBlock label="Loading freezes…" />
      ) : items.length === 0 ? (
        <EmptyState title="No freeze cases" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Owner</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id} className="border-b border-border/60">
                    <td className="px-2 py-3">
                      <div className="font-mono text-xs">{f.ownerId}</div>
                      <div className="text-xs text-muted-foreground">{f.ownerType}</div>
                    </td>
                    <td className="px-2 py-3">{f.freezeType}</td>
                    <td className="max-w-xs truncate px-2 py-3">{f.reason}</td>
                    <td className="px-2 py-3">
                      <Badge tone="default">{f.status}</Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setReviewId(f.id)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create freeze">
        <form onSubmit={onCreate} className="space-y-3">
          <Input
            label="Owner ID"
            required
            value={createForm.ownerId}
            onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
          />
          <Select
            label="Owner type"
            value={createForm.ownerType}
            onChange={(e) => setCreateForm({ ...createForm, ownerType: e.target.value })}
            options={[
              { value: "user", label: "User" },
              { value: "host", label: "Host" },
              { value: "agency", label: "Agency" },
            ]}
          />
          <Select
            label="Freeze type"
            value={createForm.freezeType}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                freezeType: e.target.value as "coins" | "account" | "wallet",
              })
            }
            options={[
              { value: "wallet", label: "Wallet" },
              { value: "coins", label: "Coins" },
              { value: "account", label: "Account" },
            ]}
          />
          <Textarea
            label="Reason"
            required
            value={createForm.reason}
            onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
          />
          <Button type="submit" disabled={busy} className="w-full">
            Create
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(reviewId)}
        onClose={() => setReviewId(null)}
        title="Review freeze"
      >
        <div className="space-y-3">
          <Textarea
            label="Note"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void review("restore")}>
              Restore
            </Button>
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => void review("confirm")}
            >
              Confirm
            </Button>
            <Button
              disabled={busy}
              variant="danger"
              onClick={() => void review("ban")}
            >
              Ban
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminFreezesPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading freezes…" />}>
      <FreezesList />
    </Suspense>
  );
}
