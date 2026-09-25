"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { Agency, AgencyStatus } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { formatDate, isNotFoundError } from "@/lib/utils";

export default function AgencyDetailPage() {
  const params = useParams<{ id: string }>();
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [busy, setBusy] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState("");
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    country: "",
    sharePercent: "",
    status: "active" as AgencyStatus,
  });

  const load = useCallback(() => {
    adminApi
      .getAgency(params.id)
      .then((a) => {
        setAgency(a);
        setForm({
          email: a.email,
          displayName: a.displayName,
          country: String(a.country),
          sharePercent: a.sharePercent != null ? String(a.sharePercent) : "",
          status: a.status,
        });
      })
      .catch((err) => {
        if (isNotFoundError(err)) toast("Agency not found");
        else error(err);
      });
  }, [params.id, error, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await adminApi.updateAgency(params.id, {
        email: form.email,
        displayName: form.displayName,
        country: form.country,
        sharePercent: form.sharePercent
          ? Number.parseFloat(form.sharePercent)
          : undefined,
        status: form.status,
      });
      setAgency(next);
      success("Agency updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitFreeze(e: FormEvent) {
    e.preventDefault();
    if (!freezeReason.trim()) return;
    setBusy(true);
    try {
      await adminApi.freezeAgency(params.id, freezeReason.trim());
      success("Agency frozen");
      setFreezeOpen(false);
      setFreezeReason("");
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!agency) return <LoadingBlock label="Loading agency…" />;

  return (
    <div>
      <PageHeader
        title={agency.displayName}
        description={`@${agency.username} · ${agency.country}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/agencies">
              <Button variant="secondary">Back</Button>
            </Link>
            {master ? (
              <Button variant="danger" onClick={() => setFreezeOpen(true)} disabled={busy}>
                Freeze (Master)
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Overview">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge tone={agency.status === "frozen" ? "danger" : "success"}>
                  {agency.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(agency.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="truncate font-mono text-xs">{agency.id}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Edit agency">
          <form onSubmit={saveProfile} className="space-y-3">
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Display name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
            <Select
              label="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              options={[
                { value: "PK", label: "PK" },
                { value: "IN", label: "IN" },
                { value: "BD", label: "BD" },
              ]}
            />
            <Input
              label="Share %"
              type="number"
              value={form.sharePercent}
              onChange={(e) => setForm({ ...form, sharePercent: e.target.value })}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as AgencyStatus })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "frozen", label: "Frozen" },
              ]}
            />
            <Button type="submit" disabled={busy}>
              Save changes
            </Button>
          </form>
        </Card>
      </div>

      <Modal open={freezeOpen} onClose={() => setFreezeOpen(false)} title="Freeze agency">
        <form onSubmit={submitFreeze} className="space-y-3">
          <Textarea
            label="Reason (required)"
            required
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
          />
          <Button type="submit" variant="danger" disabled={busy} className="w-full">
            Confirm freeze
          </Button>
        </form>
      </Modal>
    </div>
  );
}
