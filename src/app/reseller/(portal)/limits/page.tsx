"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { ResellerLimits } from "@/lib/api/types";

function LimitRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null | undefined;
}) {
  const unlimited = limit === null || limit === undefined;
  const pct = unlimited ? 0 : limit === 0 ? 100 : Math.min(100, (used / limit) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {unlimited ? "Unlimited" : limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gold-gradient transition-all"
          style={{ width: unlimited ? "8%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ResellerLimitsPage() {
  const { error } = useToast();
  const [data, setData] = useState<ResellerLimits | null>(null);

  useEffect(() => {
    resellerApi
      .limits()
      .then(setData)
      .catch((err) => error(err));
  }, [error]);

  if (!data) return <LoadingBlock />;

  const p = data.permissions;
  const u = data.usageToday;

  return (
    <div>
      <PageHeader
        title="My limits"
        description="Read-only daily usage against your assigned limits."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Usage today" className="space-y-5">
          <LimitRow
            label="Recharge"
            used={u.recharge}
            limit={p.dailyRechargeLimit}
          />
          <LimitRow label="Frames" used={u.frame} limit={p.dailyFrameLimit} />
          <LimitRow label="Entries" used={u.entry} limit={p.dailyEntryLimit} />
          <LimitRow label="Badges" used={u.badge} limit={p.dailyBadgeLimit} />
        </Card>
        <Card title="Permissions">
          <ul className="space-y-2 text-sm">
            {(
              [
                ["canRecharge", p.canRecharge],
                ["canAssignFrame", p.canAssignFrame],
                ["canAssignEntry", p.canAssignEntry],
                ["canAssignBadge", p.canAssignBadge],
                ["canRemove", p.canRemove],
                ["canSetExpiry", p.canSetExpiry],
              ] as const
            ).map(([key, value]) => (
              <li
                key={key}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>{key}</span>
                <span className={value ? "text-success" : "text-muted-foreground"}>
                  {value ? "Yes" : "No"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
