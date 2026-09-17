"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type {
  LedgerDirection,
  WalletCurrency,
  WalletOwnerType,
} from "@/lib/api/types";
import { newIdempotencyKey } from "@/lib/utils";

export default function AdminWalletsPage() {
  const { error, success } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    ownerType: "user" as WalletOwnerType,
    ownerId: "",
    currency: "coin" as WalletCurrency,
    direction: "credit" as LedgerDirection,
    amount: "100",
    note: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.adjustWallet({
        ownerType: form.ownerType,
        ownerId: form.ownerId,
        currency: form.currency,
        direction: form.direction,
        amount: Number.parseInt(form.amount, 10),
        note: form.note || undefined,
        idempotencyKey: newIdempotencyKey(),
      });
      success("Wallet adjusted");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Wallets"
        description="Manual adjust for user or reseller UUID. Use the same idempotency key on retries."
      />
      <Card className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            label="Owner type"
            value={form.ownerType}
            onChange={(e) =>
              setForm({ ...form, ownerType: e.target.value as WalletOwnerType })
            }
            options={[
              { value: "user", label: "User" },
              { value: "reseller", label: "Reseller" },
            ]}
          />
          <Input
            label="Owner UUID"
            required
            value={form.ownerId}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            placeholder="uuid"
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) =>
              setForm({ ...form, currency: e.target.value as WalletCurrency })
            }
            options={[
              { value: "coin", label: "Coin" },
              { value: "diamond", label: "Diamond" },
            ]}
          />
          <Select
            label="Direction"
            value={form.direction}
            onChange={(e) =>
              setForm({
                ...form,
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
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Adjust wallet"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
