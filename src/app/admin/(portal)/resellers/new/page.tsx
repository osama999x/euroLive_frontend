"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";

const defaultPermissions = {
  canRecharge: true,
  canAssignFrame: true,
  canAssignEntry: true,
  canAssignBadge: true,
  canRemove: true,
  canSetExpiry: true,
  dailyRechargeLimit: 5000,
  dailyFrameLimit: 50,
  dailyEntryLimit: 50,
  dailyBadgeLimit: 50,
};

export default function CreateResellerPage() {
  const { error, success } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    displayName: "",
    creditLimit: "500",
    commissionRate: "10",
    initialBalance: "0",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const reseller = await adminApi.createReseller({
        email: form.email,
        username: form.username,
        password: form.password,
        displayName: form.displayName,
        creditLimit: Number.parseInt(form.creditLimit, 10),
        commissionRate: Number.parseInt(form.commissionRate, 10),
        initialBalance: Number.parseInt(form.initialBalance, 10),
        permissions: defaultPermissions,
      });
      const name = reseller?.displayName || form.displayName || "reseller";
      const id =
        typeof reseller?.id === "string" && reseller.id ? reseller.id : "";
      try {
        success(`Created ${name}`);
      } catch {
        // toast must never block redirect
      }
      const highlight = id ? `&highlight=${encodeURIComponent(id)}` : "";
      window.location.assign(`/admin/resellers?r=${Date.now()}${highlight}`);
      return;
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Create reseller"
        action={
          <Link href="/admin/resellers">
            <Button variant="secondary" className="btn-press">
              Back
            </Button>
          </Link>
        }
      />
      <Card className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            label="Display name"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <Input
            label="Credit limit"
            type="number"
            min={0}
            step={1}
            required
            value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
          />
          <Input
            label="Commission rate %"
            type="number"
            min={0}
            step={1}
            required
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
          />
          <Input
            label="Initial balance"
            type="number"
            min={0}
            step={1}
            required
            value={form.initialBalance}
            onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
          />
          <Button type="submit" disabled={busy} className="btn-press">
            {busy ? "Creating…" : "Create reseller"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
