"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { PayoutBatch } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { asList, formatDate, isNotFoundError } from "@/lib/utils";

function PayoutsList() {
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [items, setItems] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcOpen, setCalcOpen] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listPayouts();
      setItems(asList(res));
    } catch (err) {
      if (isNotFoundError(err)) toast("Payouts API not available yet");
      else error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function calculate(e: FormEvent) {
    e.preventDefault();
    if (!master) return;
    setBusy(true);
    try {
      const batch = await adminApi.calculatePayout(periodId.trim());
      success("Payout calculated");
      setCalcOpen(false);
      setPeriodId("");
      window.location.href = `/admin/payouts/${batch.id}`;
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Payouts"
        description="Salary payout batches by period."
        action={
          master ? (
            <Button onClick={() => setCalcOpen(true)}>Calculate batch</Button>
          ) : null
        }
      />
      {loading ? (
        <LoadingBlock label="Loading payouts…" />
      ) : items.length === 0 ? (
        <EmptyState title="No payout batches" />
      ) : (
        <Card>
          <div className="portal-table-scroll">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">ID</th>
                  <th className="px-2 py-2 font-medium">Period</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Hold until</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="px-2 py-3 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                    <td className="px-2 py-3 font-mono text-xs">{p.periodId ?? "—"}</td>
                    <td className="px-2 py-3">
                      <Badge tone="default">{p.status}</Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {formatDate(p.holdUntil)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link href={`/admin/payouts/${p.id}`}>
                        <Button size="sm" variant="secondary">
                          Open
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={calcOpen} onClose={() => setCalcOpen(false)} title="Calculate payout">
        <form onSubmit={calculate} className="space-y-3">
          <Input
            label="Period ID"
            required
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          />
          <Button type="submit" disabled={busy} className="w-full">
            Calculate
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminPayoutsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading payouts…" />}>
      <PayoutsList />
    </Suspense>
  );
}
