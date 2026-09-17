"use client";

import { useEffect, useState } from "react";

import { Card, StatCard } from "@/components/ui/card";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { ResellerDashboard } from "@/lib/api/types";

export default function ResellerDashboardPage() {
  const { error } = useToast();
  const [data, setData] = useState<ResellerDashboard | null>(null);

  useEffect(() => {
    resellerApi
      .dashboard()
      .then(setData)
      .catch((err) => error(err));
  }, [error]);

  if (!data) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${data.reseller.displayName}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Coin balance" value={data.wallet.coinBalance} />
        <StatCard label="Credit limit" value={data.wallet.creditLimit} />
        <StatCard
          label="Available"
          value={data.wallet.available}
          hint="coinBalance + creditLimit"
        />
        <StatCard label="Diamonds" value={data.wallet.diamondBalance} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Today · coin transfers" value={data.today.coinTransfers} />
        <StatCard
          label="Today · item assignments"
          value={data.today.itemAssignments}
        />
      </div>
      <Card className="mt-6" title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{data.reseller.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Username</dt>
            <dd>@{data.reseller.username}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Commission</dt>
            <dd>{data.reseller.commissionRate}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{data.reseller.status}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
