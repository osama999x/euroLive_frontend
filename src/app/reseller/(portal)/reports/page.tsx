"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { SalesReport } from "@/lib/api/types";

export default function ResellerReportsPage() {
  const { error } = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [commission, setCommission] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(range?: { from?: string; to?: string }) {
    setLoading(true);
    try {
      const query = {
        from: range?.from || undefined,
        to: range?.to || undefined,
      };
      const [s, c] = await Promise.all([
        resellerApi.salesReport(query),
        resellerApi.commissionReport(query),
      ]);
      setSales(s);
      setCommission(c);
    } catch (err) {
      error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    load({
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    });
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales and commission summaries."
      />
      <Card className="mb-4">
        <form onSubmit={onFilter} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="From"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFrom("");
                setTo("");
                load();
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {loading || !sales || !commission ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Sales">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Coin transfers" value={sales.coinTransfers} />
              <StatCard label="Item sales" value={sales.itemSales} />
              <StatCard label="Total" value={sales.total} />
              <StatCard label="Count" value={sales.count} />
            </div>
          </Card>
          <Card title="Commission">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Rate"
                value={`${commission.commissionRate ?? 0}%`}
              />
              <StatCard
                label="Commission"
                value={commission.commission ?? 0}
              />
              <StatCard label="Total base" value={commission.total} />
              <StatCard label="Count" value={commission.count} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
