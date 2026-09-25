"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { PayoutBatch, PayoutItem } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { formatDate, isNotFoundError } from "@/lib/utils";

function HoldCountdown({ until }: { until?: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const label = useMemo(() => {
    if (!until) return "—";
    const end = new Date(until).getTime();
    const diff = end - now;
    if (diff <= 0) return "Hold expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  }, [until, now]);
  return <span className="font-mono text-sm">{label}</span>;
}

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [batch, setBatch] = useState<PayoutBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [correctItem, setCorrectItem] = useState<PayoutItem | null>(null);
  const [correctForm, setCorrectForm] = useState({ newAmount: "", reason: "" });

  const load = useCallback(() => {
    adminApi
      .getPayout(params.id)
      .then(setBatch)
      .catch((err) => {
        if (isNotFoundError(err)) toast("Payout not found");
        else error(err);
      });
  }, [params.id, error, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function approveHold() {
    if (!master) return;
    setBusy(true);
    try {
      const next = await adminApi.approvePayoutHold(params.id);
      setBatch(next);
      success("Hold approved");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!master) return;
    setBusy(true);
    try {
      const next = await adminApi.releasePayout(params.id);
      setBatch(next);
      success("Payout released");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitCorrect(e: FormEvent) {
    e.preventDefault();
    if (!master || !correctItem) return;
    setBusy(true);
    try {
      await adminApi.correctPayoutItem(params.id, correctItem.id, {
        newAmount: Number.parseFloat(correctForm.newAmount),
        reason: correctForm.reason,
      });
      success("Item corrected");
      setCorrectItem(null);
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!batch) return <LoadingBlock label="Loading payout…" />;

  const items = batch.items ?? [];

  return (
    <div>
      <PageHeader
        title="Payout batch"
        description={`Period ${batch.periodId ?? "—"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/payouts">
              <Button variant="secondary">Back</Button>
            </Link>
            {master ? (
              <>
                <Button disabled={busy} onClick={() => void approveHold()}>
                  Approve hold
                </Button>
                <Button disabled={busy} variant="secondary" onClick={() => void release()}>
                  Release
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <Card className="mb-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge tone="default">{batch.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Hold until</dt>
            <dd>{formatDate(batch.holdUntil)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Countdown</dt>
            <dd>
              <HoldCountdown until={batch.holdUntil} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Batch ID</dt>
            <dd className="font-mono text-xs">{batch.id}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Line items">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items in this batch.</p>
        ) : (
          <div className="portal-table-scroll">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Party</th>
                  <th className="px-2 py-2">Amount</th>
                  {master ? <th className="px-2 py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="px-2 py-3">{item.partyType}</td>
                    <td className="px-2 py-3">{item.amount}</td>
                    {master ? (
                      <td className="px-2 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setCorrectItem(item);
                            setCorrectForm({
                              newAmount: String(item.amount),
                              reason: "",
                            });
                          }}
                        >
                          Correct
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(correctItem)}
        onClose={() => setCorrectItem(null)}
        title="Correct payout item"
      >
        <form onSubmit={submitCorrect} className="space-y-3">
          <Input
            label="New amount"
            type="number"
            required
            value={correctForm.newAmount}
            onChange={(e) =>
              setCorrectForm({ ...correctForm, newAmount: e.target.value })
            }
          />
          <Textarea
            label="Reason"
            required
            value={correctForm.reason}
            onChange={(e) => setCorrectForm({ ...correctForm, reason: e.target.value })}
          />
          <Button type="submit" disabled={busy} className="w-full">
            Save correction
          </Button>
        </form>
      </Modal>
    </div>
  );
}
