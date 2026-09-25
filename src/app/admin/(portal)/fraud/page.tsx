"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { FraudCase } from "@/lib/api/types";
import { asList, formatDate, isNotFoundError } from "@/lib/utils";

function FraudList() {
  const { error, success, toast } = useToast();
  const [items, setItems] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<FraudCase | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listFraud();
      setItems(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Fraud API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(action: "restore" | "correct" | "penalty" | "ban") {
    if (!active) return;
    if (action === "correct" && !amount.trim()) {
      error("Amount required for correct action");
      return;
    }
    setBusy(true);
    try {
      await adminApi.reviewFraud(active.id, {
        action,
        note: note || undefined,
        amount: action === "correct" ? Number.parseFloat(amount) : undefined,
      });
      success(`Fraud case ${action}`);
      setActive(null);
      setNote("");
      setAmount("");
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader title="Fraud" description="Review flagged fraud cases." />
      {loading ? (
        <LoadingBlock label="Loading fraud cases…" />
      ) : items.length === 0 ? (
        <EmptyState title="No fraud cases" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id} className="border-b border-border/60">
                    <td className="px-2 py-3 font-mono text-xs">{f.id.slice(0, 8)}…</td>
                    <td className="px-2 py-3">
                      <Badge tone="default">{f.status ?? "open"}</Badge>
                    </td>
                    <td className="px-2 py-3">{f.amount ?? "—"}</td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setActive(f)}>
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

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title="Review fraud">
        <div className="space-y-3">
          <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          <Input
            label="Amount (required for correct)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void review("restore")}>
              Restore
            </Button>
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => void review("correct")}
            >
              Correct
            </Button>
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => void review("penalty")}
            >
              Penalty
            </Button>
            <Button disabled={busy} variant="danger" onClick={() => void review("ban")}>
              Ban
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminFraudPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading fraud…" />}>
      <FraudList />
    </Suspense>
  );
}
