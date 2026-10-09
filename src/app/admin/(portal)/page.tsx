"use client";

import { useEffect, useState } from "react";

import { Card, StatCard } from "@/components/ui/card";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboard } from "@/lib/api/types";
import { asList, asPaginatedMeta } from "@/lib/utils";

type ModerationStats = {
  usersBanned: number;
  freezesPending: number;
  freezesActive: number;
  openSos: number;
  openComplaints: number;
  flaggedReports: number;
  frozenWallets: number;
  idBans?: number;
  liveBans?: number;
  deviceBans?: number;
};

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export default function AdminDashboardPage() {
  const { error } = useToast();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [mod, setMod] = useState<ModerationStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const dash = await adminApi.dashboard();
        if (cancelled) return;
        setData(dash);

        const extra = dash as AdminDashboard & Record<string, unknown>;

        const [bannedUsers, freezesPending, freezesActive, freezesAll] =
          await Promise.all([
            adminApi
              .listUsers({ page: 1, limit: 1, status: "banned" })
              .then((r) => asPaginatedMeta(r)?.total ?? r.meta?.total ?? dash.usersBanned)
              .catch(() => dash.usersBanned),
            adminApi
              .listFreezes({ status: "pending_review" })
              .then((r) => asPaginatedMeta(r)?.total ?? asList(r).length)
              .catch(() => 0),
            adminApi
              .listFreezes({ status: "frozen" })
              .then((r) => asPaginatedMeta(r)?.total ?? asList(r).length)
              .catch(() => 0),
            adminApi
              .listFreezes({})
              .then((r) => asList(r))
              .catch(() => []),
          ]);

        if (cancelled) return;

        const confirmed = freezesAll.filter(
          (f) => String(f.status) === "confirmed" || String(f.status) === "frozen",
        ).length;

        setMod({
          usersBanned: bannedUsers,
          freezesPending,
          freezesActive: freezesActive || confirmed,
          openSos: dash.openSos ?? 0,
          openComplaints: dash.openComplaints ?? 0,
          flaggedReports: dash.flaggedReports ?? 0,
          frozenWallets: dash.frozenWallets ?? 0,
          idBans: num(extra.idBansActive ?? extra.idBans ?? extra.usersIdBanned),
          liveBans: num(
            extra.liveBansActive ?? extra.liveBans ?? extra.usersLiveBanned,
          ),
          deviceBans: num(
            extra.deviceBansActive ?? extra.deviceBans ?? extra.usersDeviceBanned,
          ),
        });
      } catch (err) {
        if (!cancelled) error(err);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [error]);

  if (!data || !mod) return <LoadingBlock label="Loading dashboard…" />;

  return (
    <div className="portal-list space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live KPIs — bans, blocks, and ops queues after login."
      />

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-gold-soft">
          Bans & blocks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Users ID-banned"
            value={mod.idBans ?? mod.usersBanned}
            hint="status=banned / active ID ban"
          />
          <StatCard
            label="Live stream bans"
            value={mod.liveBans ?? "—"}
            hint={
              mod.liveBans === undefined
                ? "Shown when API sends liveBansActive"
                : "Cannot Go Live / create room"
            }
          />
          <StatCard
            label="Device bans"
            value={mod.deviceBans ?? "—"}
            hint={
              mod.deviceBans === undefined
                ? "Shown when API sends deviceBansActive"
                : "Blocked deviceId logins"
            }
          />
          <StatCard
            label="Users banned (total)"
            value={mod.usersBanned}
            hint="From users list · status banned"
          />
          <StatCard
            label="Freezes pending"
            value={mod.freezesPending}
            hint="Awaiting Master review"
          />
          <StatCard
            label="Freezes active"
            value={mod.freezesActive}
            hint="Frozen / confirmed cases"
          />
          <StatCard
            label="Frozen wallets"
            value={mod.frozenWallets}
            hint="Dashboard KPI"
          />
          <StatCard
            label="Flagged reports"
            value={mod.flaggedReports}
            hint="Open complaint-style flags"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-gold-soft">
          Safety queues
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open SOS" value={mod.openSos} />
          <StatCard label="Open complaints" value={mod.openComplaints} />
          <StatCard label="Active rooms" value={data.activeRooms} />
          <StatCard
            label="Pending payouts"
            value={data.pendingPayouts ?? data.pendingWithdrawals ?? 0}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-gold-soft">
          Platform
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users total" value={data.usersTotal} />
          <StatCard label="Resellers" value={data.resellersTotal} />
          <StatCard label="Coins in circulation" value={data.coinsInCirculation} />
          <StatCard
            label="Pending withdrawals"
            value={data.pendingWithdrawals}
          />
        </div>
      </section>

      <Card
        title="Engagement & revenue"
        description="Secondary analytics placeholders (often 0 until live analytics ship)."
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
