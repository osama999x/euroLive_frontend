"use client";

import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { resellerApi } from "@/lib/api/reseller";
import type { ResellerUserLookup } from "@/lib/api/types";
import { useResellerAuth } from "@/lib/auth/reseller-store";
import { newIdempotencyKey } from "@/lib/utils";

export default function ResellerTransferPage() {
  const { reseller } = useResellerAuth();
  const { error, success } = useToast();
  const [publicId, setPublicId] = useState("10000001");
  const [user, setUser] = useState<ResellerUserLookup | null>(null);
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey());

  const canRecharge = reseller?.permissions.canRecharge ?? false;

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const found = await resellerApi.lookupUser(publicId.trim());
      setUser(found);
    } catch (err) {
      setUser(null);
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function transfer(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await resellerApi.transferCoins({
        publicId: user.publicId,
        amount: Number.parseInt(amount, 10),
        idempotencyKey,
      });
      success(`Transferred ${amount} coins to ${user.publicId}`);
      setIdempotencyKey(newIdempotencyKey());
      const refreshed = await resellerApi.lookupUser(user.publicId);
      setUser(refreshed);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!canRecharge) {
    return (
      <PageHeader
        title="Transfer coins"
        description="Missing permission: canRecharge"
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Transfer coins"
        description="Look up a consumer by 8-digit publicId, then transfer."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Lookup user">
          <form onSubmit={lookup} className="space-y-3">
            <Input
              label="Public ID"
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              required
            />
            <Button type="submit" disabled={busy}>
              Lookup
            </Button>
          </form>
        </Card>

        {user ? (
          <Card title="Transfer">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <span>
                  {user.displayName} (@{user.username})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Public ID</span>
                <span className="font-mono text-primary">{user.publicId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coin balance</span>
                <span>{user.coinBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge tone={user.status === "banned" ? "danger" : "success"}>
                  {user.status}
                </Badge>
              </div>
            </div>
            <form onSubmit={transfer} className="space-y-3">
              <Input
                label="Amount"
                type="number"
                min={1}
                step={1}
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setIdempotencyKey(newIdempotencyKey());
                }}
                disabled={user.status === "banned"}
              />
              <Button
                type="submit"
                disabled={busy || user.status === "banned"}
              >
                {busy ? "Transferring…" : "Transfer"}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
