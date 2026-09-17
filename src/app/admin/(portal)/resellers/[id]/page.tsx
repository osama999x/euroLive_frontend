"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type {
  AccountStatus,
  LedgerDirection,
  Reseller,
  ResellerPermissions,
} from "@/lib/api/types";
import { newIdempotencyKey } from "@/lib/utils";

export default function ResellerDetailPage() {
  const params = useParams<{ id: string }>();
  const { error, success } = useToast();
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    email: "",
    displayName: "",
    status: "active" as AccountStatus,
  });
  const [creditLimit, setCreditLimit] = useState("0");
  const [balance, setBalance] = useState({
    direction: "credit" as LedgerDirection,
    amount: "100",
    note: "",
  });
  const [perms, setPerms] = useState<ResellerPermissions | null>(null);

  const load = useCallback(() => {
    adminApi
      .getReseller(params.id)
      .then((r) => {
        setReseller(r);
        setProfile({
          email: r.email,
          displayName: r.displayName,
          status: r.status,
        });
        setCreditLimit(String(r.creditLimit));
        setPerms(r.permissions);
      })
      .catch((err) => error(err));
  }, [params.id, error]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await adminApi.updateReseller(params.id, profile);
      setReseller(next);
      success("Profile updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveCredit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await adminApi.updateResellerCreditLimit(
        params.id,
        Number.parseInt(creditLimit, 10),
      );
      setReseller(next);
      success("Credit limit updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveBalance(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.adjustResellerBalance(params.id, {
        direction: balance.direction,
        amount: Number.parseInt(balance.amount, 10),
        note: balance.note || undefined,
        idempotencyKey: newIdempotencyKey(),
      });
      success("Balance adjusted");
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function savePermissions(e: FormEvent) {
    e.preventDefault();
    if (!perms) return;
    setBusy(true);
    try {
      const next = await adminApi.updateResellerPermissions(params.id, perms);
      setReseller(next);
      setPerms(next.permissions);
      success("Permissions updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function saveLimits(e: FormEvent) {
    e.preventDefault();
    if (!perms) return;
    setBusy(true);
    try {
      const next = await adminApi.updateResellerLimits(params.id, {
        dailyRechargeLimit: perms.dailyRechargeLimit,
        dailyFrameLimit: perms.dailyFrameLimit,
        dailyEntryLimit: perms.dailyEntryLimit,
        dailyBadgeLimit: perms.dailyBadgeLimit,
      });
      setReseller(next);
      setPerms(next.permissions);
      success("Limits updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!reseller || !perms) return <LoadingBlock />;

  const boolFlags: (keyof ResellerPermissions)[] = [
    "canRecharge",
    "canAssignFrame",
    "canAssignEntry",
    "canAssignBadge",
    "canRemove",
    "canSetExpiry",
  ];

  return (
    <div>
      <PageHeader
        title={reseller.displayName}
        description={reseller.email}
        action={
          <Link href="/admin/resellers">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <form onSubmit={saveProfile} className="space-y-3">
            <Input
              label="Display name"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <Select
              label="Status"
              value={profile.status}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  status: e.target.value as AccountStatus,
                })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "disabled", label: "Disabled" },
                { value: "banned", label: "Banned" },
              ]}
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current</span>
              <Badge tone="gold">{reseller.status}</Badge>
            </div>
            <Button type="submit" disabled={busy}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card title="Credit limit">
          <form onSubmit={saveCredit} className="space-y-3">
            <Input
              label="Credit limit"
              type="number"
              min={0}
              step={1}
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              Save credit limit
            </Button>
          </form>
        </Card>

        <Card
          title="Coin balance"
          description="Adjust reseller wallet coins. Public object has creditLimit only."
        >
          <form onSubmit={saveBalance} className="space-y-3">
            <Select
              label="Direction"
              value={balance.direction}
              onChange={(e) =>
                setBalance({
                  ...balance,
                  direction: e.target.value as LedgerDirection,
                })
              }
              options={[
                { value: "credit", label: "Credit" },
                { value: "debit", label: "Debit" },
              ]}
            />
            <Input
              label="Amount"
              type="number"
              min={1}
              step={1}
              value={balance.amount}
              onChange={(e) => setBalance({ ...balance, amount: e.target.value })}
            />
            <Input
              label="Note"
              value={balance.note}
              onChange={(e) => setBalance({ ...balance, note: e.target.value })}
            />
            <Button type="submit" disabled={busy}>
              Adjust balance
            </Button>
          </form>
        </Card>

        <Card title="Permissions">
          <form onSubmit={savePermissions} className="space-y-3">
            {boolFlags.map((key) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span>{key}</span>
                <input
                  type="checkbox"
                  checked={Boolean(perms[key])}
                  onChange={(e) =>
                    setPerms({ ...perms, [key]: e.target.checked })
                  }
                />
              </label>
            ))}
            <Button type="submit" disabled={busy}>
              Save permissions
            </Button>
          </form>
        </Card>

        <Card
          className="lg:col-span-2"
          title="Daily limits"
          description="Leave empty / null for unlimited. 0 means none allowed."
        >
          <form onSubmit={saveLimits} className="grid gap-3 sm:grid-cols-2">
            {(
              [
                "dailyRechargeLimit",
                "dailyFrameLimit",
                "dailyEntryLimit",
                "dailyBadgeLimit",
              ] as const
            ).map((key) => (
              <Input
                key={key}
                label={key}
                type="number"
                min={0}
                step={1}
                value={perms[key] ?? ""}
                placeholder="Unlimited"
                onChange={(e) =>
                  setPerms({
                    ...perms,
                    [key]:
                      e.target.value === ""
                        ? null
                        : Number.parseInt(e.target.value, 10),
                  })
                }
              />
            ))}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>
                Save limits
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
