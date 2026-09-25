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
import type { HostProfile, HostStatus } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { formatDate, isNotFoundError } from "@/lib/utils";

export default function HostDetailPage() {
  const params = useParams<{ id: string }>();
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [host, setHost] = useState<HostProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [lockForm, setLockForm] = useState({ reason: "", hours: "24" });
  const [freezeReason, setFreezeReason] = useState("");
  const [profile, setProfile] = useState({
    country: "PK",
    agencyId: "",
    status: "active" as HostStatus,
  });
  const [hoursForm, setHoursForm] = useState({
    periodId: "",
    liveHours: "0",
    liveDays: "0",
    beans: "",
  });

  const load = useCallback(() => {
    adminApi
      .getHost(params.id)
      .then((h) => {
        setHost(h);
        setProfile({
          country: String(h.country),
          agencyId: h.agencyId ?? "",
          status: h.status,
        });
      })
      .catch((err) => {
        if (isNotFoundError(err)) toast("Host not found");
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
      const next = await adminApi.updateHost(params.id, {
        country: profile.country,
        agencyId: profile.agencyId || null,
        status: profile.status,
      });
      setHost(next);
      success("Host updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitLock(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.protectionLock(params.id, {
        reason: lockForm.reason,
        hours: lockForm.hours ? Number.parseInt(lockForm.hours, 10) : undefined,
      });
      success("Protection lock applied");
      setLockOpen(false);
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    setBusy(true);
    try {
      await adminApi.protectionUnlock(params.id);
      success("Protection unlocked");
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitFreeze(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.freezeHost(params.id, freezeReason.trim());
      success("Host frozen");
      setFreezeOpen(false);
      load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function postHours(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.postHostHours(params.id, {
        periodId: hoursForm.periodId.trim(),
        liveHours: Number.parseFloat(hoursForm.liveHours),
        liveDays: Number.parseInt(hoursForm.liveDays, 10),
        beans: hoursForm.beans ? Number.parseInt(hoursForm.beans, 10) : undefined,
      });
      success("Hours posted");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (!host) return <LoadingBlock label="Loading host…" />;

  return (
    <div>
      <PageHeader
        title={host.user?.displayName ?? "Host"}
        description={
          host.user
            ? `@${host.user.username} · ${host.country}`
            : `User ${host.userId}`
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/hosts">
              <Button variant="secondary">Back</Button>
            </Link>
            {master && host.protectionLocked ? (
              <Button variant="secondary" disabled={busy} onClick={() => void unlock()}>
                Unlock protection
              </Button>
            ) : null}
            {master && !host.protectionLocked ? (
              <Button variant="secondary" onClick={() => setLockOpen(true)}>
                Protection lock
              </Button>
            ) : null}
            {master ? (
              <Button variant="danger" onClick={() => setFreezeOpen(true)} disabled={busy}>
                Freeze
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={host.status === "active" ? "success" : "danger"}>{host.status}</Badge>
        {host.protectionLocked ? (
          <Badge tone="gold">
            Protection lock
            {host.protectionCaseNumber ? ` · ${host.protectionCaseNumber}` : ""}
          </Badge>
        ) : null}
        {host.protectionLockedUntil ? (
          <span className="text-sm text-muted-foreground">
            Until {formatDate(host.protectionLockedUntil)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Host ID</dt>
              <dd className="font-mono text-xs">{host.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs">{host.userId}</dd>
            </div>
            {host.user?.publicId ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Public ID</dt>
                <dd className="font-mono text-primary">{host.user.publicId}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Agency</dt>
              <dd>{host.agency?.displayName ?? "—"}</dd>
            </div>
          </dl>
          <form onSubmit={saveProfile} className="space-y-3">
            <Select
              label="Country"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              options={[
                { value: "PK", label: "PK" },
                { value: "IN", label: "IN" },
                { value: "BD", label: "BD" },
              ]}
            />
            <Input
              label="Agency ID"
              value={profile.agencyId}
              onChange={(e) => setProfile({ ...profile, agencyId: e.target.value })}
            />
            <Select
              label="Status"
              value={profile.status}
              onChange={(e) =>
                setProfile({ ...profile, status: e.target.value as HostStatus })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "frozen", label: "Frozen" },
              ]}
            />
            <Button type="submit" disabled={busy}>
              Save
            </Button>
          </form>
        </Card>

        <Card title="Post live hours" description="Attach hours to a salary period.">
          <form onSubmit={postHours} className="space-y-3">
            <Input
              label="Period ID"
              required
              value={hoursForm.periodId}
              onChange={(e) => setHoursForm({ ...hoursForm, periodId: e.target.value })}
            />
            <Input
              label="Live hours"
              type="number"
              min={0}
              step={0.1}
              required
              value={hoursForm.liveHours}
              onChange={(e) => setHoursForm({ ...hoursForm, liveHours: e.target.value })}
            />
            <Input
              label="Live days"
              type="number"
              min={0}
              required
              value={hoursForm.liveDays}
              onChange={(e) => setHoursForm({ ...hoursForm, liveDays: e.target.value })}
            />
            <Input
              label="Beans (optional)"
              type="number"
              min={0}
              value={hoursForm.beans}
              onChange={(e) => setHoursForm({ ...hoursForm, beans: e.target.value })}
            />
            <Button type="submit" disabled={busy}>
              Post hours
            </Button>
          </form>
        </Card>
      </div>

      <Modal open={lockOpen} onClose={() => setLockOpen(false)} title="Protection lock">
        <form onSubmit={submitLock} className="space-y-3">
          <Textarea
            label="Reason"
            required
            value={lockForm.reason}
            onChange={(e) => setLockForm({ ...lockForm, reason: e.target.value })}
          />
          <Input
            label="Hours (optional)"
            type="number"
            min={1}
            value={lockForm.hours}
            onChange={(e) => setLockForm({ ...lockForm, hours: e.target.value })}
          />
          <Button type="submit" disabled={busy} className="w-full">
            Apply lock
          </Button>
        </form>
      </Modal>

      <Modal open={freezeOpen} onClose={() => setFreezeOpen(false)} title="Freeze host">
        <form onSubmit={submitFreeze} className="space-y-3">
          <Textarea
            label="Reason"
            required
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
          />
          <Button type="submit" variant="danger" disabled={busy} className="w-full">
            Freeze
          </Button>
        </form>
      </Modal>
    </div>
  );
}
