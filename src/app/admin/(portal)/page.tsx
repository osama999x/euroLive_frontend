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
        description="Live KPIs from Euro Live Core and platform modules."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active rooms" value={data.activeRooms} />
        <StatCard label="Pending payouts" value={data.pendingPayouts ?? 0} />
        <StatCard label="Open SOS" value={data.openSos ?? 0} />
        <StatCard label="Open complaints" value={data.openComplaints ?? 0} />
        <StatCard label="Frozen wallets" value={data.frozenWallets ?? 0} />
        <StatCard label="Pending withdrawals" value={data.pendingWithdrawals} />
        <StatCard label="Flagged reports" value={data.flaggedReports} />
        <StatCard label="Users total" value={data.usersTotal} />
        <StatCard label="Resellers" value={data.resellersTotal} />
        <StatCard label="Coins in circulation" value={data.coinsInCirculation} />
        <StatCard label="Users banned" value={data.usersBanned} />
      </div>
      <Card
        className="mt-6"
        title="Engagement & revenue"
        description="Secondary metrics from analytics placeholders."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["DAU", data.dau],
            ["MAU", data.mau],
            ["Revenue", data.revenue],
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
