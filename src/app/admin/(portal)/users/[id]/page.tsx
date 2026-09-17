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
import type { ConsumerUser, LedgerDirection, WalletCurrency } from "@/lib/api/types";
import { formatDate, newIdempotencyKey } from "@/lib/utils";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { error, success } = useToast();
  const [user, setUser] = useState<ConsumerUser | null>(null);
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState<LedgerDirection>("credit");
  const [currency, setCurrency] = useState<WalletCurrency>("coin");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApi
      .getUser(params.id)
      .then(setUser)
      .catch((err) => error(err));
  }, [params.id, error]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan() {
    if (!user) return;
    setBusy(true);
    try {
      const next =
        user.status === "banned"
          ? await adminApi.unbanUser(user.id)
          : await adminApi.banUser(user.id);
      setUser(next);
      success(next.status === "banned" ? "User banned" : "User unbanned");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function adjustWallet(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await adminApi.adjustWallet({
        ownerType: "user",
        ownerId: user.id,
        currency,
        direction,
        amount: Number.parseInt(amount, 10),
        note: note || undefined,
        idempotencyKey: newIdempotencyKey(),
      });
      success("Wallet adjusted");
      setNote("");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <LoadingBlock />;

  return (
    <div>
      <PageHeader
        title={user.displayName}
        description={`@${user.username}`}
        action={
          <div className="flex gap-2">
            <Link href="/admin/users">
              <Button variant="secondary">Back</Button>
            </Link>
            <Button
              variant={user.status === "banned" ? "primary" : "danger"}
              disabled={busy}
              onClick={toggleBan}
            >
              {user.status === "banned" ? "Unban" : "Ban"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Public ID</dt>
              <dd className="font-mono text-lg text-primary">{user.publicId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge tone={user.status === "banned" ? "danger" : "success"}>
                  {user.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{user.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Country</dt>
              <dd>{user.country ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">UUID</dt>
              <dd className="truncate font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Wallet adjust" description="Uses UUID ownerId. Amounts are integers.">
          <form onSubmit={adjustWallet} className="space-y-3">
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as WalletCurrency)}
              options={[
                { value: "coin", label: "Coin" },
                { value: "diamond", label: "Diamond" },
              ]}
            />
            <Select
              label="Direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as LedgerDirection)}
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
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              Save adjust
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
