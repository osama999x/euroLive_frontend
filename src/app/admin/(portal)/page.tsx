"use client";

import { useEffect, useState } from "react";

import { Card, StatCard } from "@/components/ui/card";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboard } from "@/lib/api/types";

export default function AdminDashboardPage() {
  const { error } = useToast();
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((err) => error(err));
  }, [error]);

  if (!data) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live KPIs from the admin API. Placeholder modules show as coming soon."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users total" value={data.usersTotal} />
        <StatCard label="Users banned" value={data.usersBanned} />
        <StatCard label="Resellers" value={data.resellersTotal} />
        <StatCard label="Coins in circulation" value={data.coinsInCirculation} />
      </div>
      <Card className="mt-6" title="Coming soon" description="These endpoints return placeholders until modules ship.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["DAU", data.dau],
            ["MAU", data.mau],
            ["Revenue", data.revenue],
            ["Active rooms", data.activeRooms],
            ["Pending withdrawals", data.pendingWithdrawals],
            ["Flagged reports", data.flaggedReports],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm"
            >
              <p className="text-muted-foreground">{label}</p>
              <p className="mt-1 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
