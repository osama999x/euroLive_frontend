"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";

export default function CreateUserPage() {
  const router = useRouter();
  const { error, success } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    phone: "",
    country: "PK",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await adminApi.createUser({
        username: form.username,
        displayName: form.displayName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        country: form.country || undefined,
      });
      success(`Created ${user.username} · publicId ${user.publicId}`);
      router.push(`/admin/users/${user.id}`);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Create user"
        action={
          <Link href="/admin/users">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
      <Card className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label="Display name"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create user"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
