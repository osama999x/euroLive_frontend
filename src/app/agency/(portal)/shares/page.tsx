"use client";

import { useEffect, useState } from "react";

import { Card, StatCard } from "@/components/ui/card";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { agencyApi } from "@/lib/api/agency";
import type { AgencyShareItem } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

type SharesPayload = {
  wallet: { coinBalance: number };
  shareTotal: number;
  items: AgencyShareItem[];
};

export default function AgencySharesPage() {
  const { error } = useToast();
  const [data, setData] = useState<SharesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    agencyApi
      .shares()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [error]);

  return (
    <div className="portal-list">
      <PageHeader
        title="Shares"
        description="Agency share wallet and payout history."
      />
      {loading ? (
        <LoadingBlock label="Loading shares…" />
      ) : !data ? (
        <EmptyState title="Unable to load shares" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Coin balance" value={data.wallet.coinBalance} />
            <StatCard label="Share total" value={data.shareTotal} />
          </div>
          {data.items.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No share entries yet" />
            </div>
          ) : (
            <Card className="mt-6">
              <div className="portal-table-scroll">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 font-medium">Batch</th>
                      <th className="px-2 py-2 font-medium">Amount</th>
                      <th className="px-2 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row, i) => (
                      <tr
                        key={row.id}
                        style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                        className="portal-row border-b border-border/60 transition hover:bg-primary/5"
                      >
                        <td className="px-2 py-3 font-mono text-xs text-primary">
                          {row.batchId}
                        </td>
                        <td className="px-2 py-3">{row.amount}</td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
