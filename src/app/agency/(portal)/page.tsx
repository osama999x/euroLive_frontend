"use client";

import { useEffect, useState } from "react";

import { Card, StatCard } from "@/components/ui/card";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { agencyApi } from "@/lib/api/agency";
import type { AgencyDashboard } from "@/lib/api/types";

export default function AgencyDashboardPage() {
  const { error } = useToast();
  const [data, setData] = useState<AgencyDashboard | null>(null);

  useEffect(() => {
    agencyApi
      .dashboard()
      .then(setData)
      .catch((err) => error(err));
  }, [error]);

  if (!data) return <LoadingBlock />;

  return (
    <div className="portal-list">
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${data.agency.displayName}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Hosts" value={data.hostCount} />
        <StatCard label="Share total" value={data.shareTotal} />
        <StatCard label="Coin balance" value={data.wallet.coinBalance} />
      </div>
      <Card className="mt-6" title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{data.agency.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Username</dt>
            <dd>@{data.agency.username}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Country</dt>
            <dd>{data.agency.country}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{data.agency.status}</dd>
          </div>
          {data.agency.sharePercent != null ? (
            <div>
              <dt className="text-muted-foreground">Share percent</dt>
              <dd>{data.agency.sharePercent}%</dd>
            </div>
          ) : null}
        </dl>
      </Card>
    </div>
  );
}
