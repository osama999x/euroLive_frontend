"use client";

import { useEffect, useState } from "react";

import { Card, StatCard } from "@/components/ui/card";
import {
  DateTimeRangePicker,
  defaultReportRange,
  localInputToIso,
  type DateTimeRangeValue,
} from "@/components/ui/date-time-range-picker";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { SalesReport } from "@/lib/api/types";

export default function ResellerReportsPage() {
  const { error } = useToast();
  const [range, setRange] = useState<DateTimeRangeValue>(defaultReportRange);
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [commission, setCommission] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(next?: DateTimeRangeValue | null) {
    setLoading(true);
    try {
      const active = next === null ? { from: "", to: "" } : (next ?? range);
      const query = {
        from: localInputToIso(active.from),
        to: localInputToIso(active.to),
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
    void load(defaultReportRange());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="portal-list">
      <PageHeader
        title="Reports"
        description="Sales and commission summaries for a date & time range."
      />
      <Card className="mb-4" title="Date & time">
        <DateTimeRangePicker
          value={range}
          onChange={setRange}
          applying={loading}
          onApply={(next) => void load(next ?? range)}
          onReset={() => {
            setRange({ from: "", to: "" });
            void load(null);
          }}
        />
      </Card>

      {loading || !sales || !commission ? (
        <LoadingBlock label="Loading reports…" />
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
