"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type {
  BanDuration,
  BanType,
  ConsumerUser,
  CreateUserBanBody,
  LedgerDirection,
  UserBanRecord,
  UserDeviceRecord,
  WalletCurrency,
} from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster, staffHasRole } from "@/lib/auth/roles";
import { asList, cn, formatDate, newIdempotencyKey } from "@/lib/utils";

const DURATION_OPTIONS: { value: BanDuration; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "permanent", label: "Permanent" },
  { value: "custom", label: "Custom hours" },
];

function banStatus(ban: UserBanRecord): "Active" | "Expired" | "Revoked" {
  if (ban.revokedAt) return "Revoked";
  if (ban.expiresAt && new Date(ban.expiresAt).getTime() <= Date.now()) {
    return "Expired";
  }
  return "Active";
}

function untilLabel(banned: boolean | undefined, until: string | null | undefined) {
  if (!banned) return null;
  if (!until) return "Permanent";
  return formatDate(until);
}

type BanTab = BanType;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles ?? (staff ? [staff.role] : []));
  const roles = staff?.roles ?? (staff ? [staff.role] : []);
  const canMutateBans = staffHasRole(roles, [
    "super_admin",
    "admin",
    "moderator",
  ]);
  const canListBans = canMutateBans || staffHasRole(roles, ["support"]);

  const { error, success } = useToast();
  const [user, setUser] = useState<ConsumerUser | null>(null);
  const [devices, setDevices] = useState<UserDeviceRecord[]>([]);
  const [bans, setBans] = useState<UserBanRecord[]>([]);
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState<LedgerDirection>("credit");
  const [currency, setCurrency] = useState<WalletCurrency>("coin");
  const [note, setNote] = useState("");
  const [officialId, setOfficialId] = useState("");
  const [busy, setBusy] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [banTab, setBanTab] = useState<BanTab>("id");
  const [duration, setDuration] = useState<BanDuration>("24h");
  const [customHours, setCustomHours] = useState("12");
  const [reason, setReason] = useState("");
  const [includeDevices, setIncludeDevices] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const u = await adminApi.getUser(params.id);
      setUser(u);
      setOfficialId(u.officialId ?? "");
      if (canListBans) {
        const [devRes, banRes] = await Promise.all([
          adminApi.listUserDevices(params.id),
          adminApi.listUserBans(params.id),
        ]);
        const nextDevices = asList(devRes);
        setDevices(nextDevices);
        setBans(asList(banRes));
        setSelectedDeviceId((prev) =>
          prev && nextDevices.some((d) => d.deviceId === prev)
            ? prev
            : (nextDevices[0]?.deviceId ?? ""),
        );
      }
    } catch (err) {
      error(err);
    }
  }, [params.id, canListBans, error]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const idUntil = useMemo(
    () => untilLabel(user?.idBanned ?? user?.status === "banned", user?.idBannedUntil),
    [user],
  );
  const liveUntil = useMemo(
    () => untilLabel(user?.liveBanned, user?.liveBannedUntil),
    [user],
  );

  async function liftAllIdBans() {
    if (!user || !canMutateBans) return;
    setBusy(true);
    try {
      await adminApi.unbanUser(user.id);
      success("All active ID bans lifted");
      await loadAll();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitBan(e: FormEvent) {
    e.preventDefault();
    if (!user || !canMutateBans) return;

    const body: CreateUserBanBody = {
      type: banTab,
      duration,
    };
    if (duration === "custom") {
      const hours = Number.parseInt(customHours, 10);
      if (!Number.isFinite(hours) || hours < 1) {
        error("Custom hours must be an integer ≥ 1");
        return;
      }
      body.customHours = hours;
    }
    if (reason.trim()) body.reason = reason.trim();
    if (banTab === "id" && includeDevices) body.includeDevices = true;
    if (banTab === "device") {
      if (!selectedDeviceId) {
        error("Select a device");
        return;
      }
      body.deviceId = selectedDeviceId;
    }

    setBusy(true);
    try {
      const res = await adminApi.createUserBan(user.id, body);
      setUser(res.user);
      success(
        banTab === "id"
          ? "ID ban applied"
          : banTab === "device"
            ? "Device ban applied"
            : "Live streaming ban applied",
      );
      setReason("");
      setIncludeDevices(false);
      await loadAll();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function revokeBan(banId: string) {
    if (!user || !canMutateBans) return;
    setBusy(true);
    try {
      await adminApi.revokeUserBan(user.id, banId);
      success("Ban revoked");
      await loadAll();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOfficial(next: boolean) {
    if (!user || !master) return;
    setBusy(true);
    try {
      const updated = await adminApi.setUserOfficial(user.id, {
        isOfficial: next,
        officialId: next && officialId.trim() ? officialId.trim() : undefined,
      });
      setUser(updated);
      setOfficialId(updated.officialId ?? "");
      success(next ? "Official account enabled" : "Official account disabled");
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

  const idBannedActive = Boolean(user.idBanned) || user.status === "banned";

  return (
    <div className="portal-list space-y-4">
      <PageHeader
        title={user.displayName}
        description={`@${user.username}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users">
              <Button variant="secondary" className="btn-press">
                Back
              </Button>
            </Link>
            {canListBans ? (
              <Button
                className="btn-press"
                variant="danger"
                onClick={() => setBanOpen(true)}
              >
                Ban
              </Button>
            ) : null}
            {canMutateBans && idBannedActive ? (
              <Button
                className="btn-press"
                disabled={busy}
                onClick={() => void liftAllIdBans()}
              >
                Unban
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          <Badge tone={user.status === "banned" ? "danger" : "success"}>
            {user.status}
          </Badge>
          {idBannedActive ? (
            <Badge tone="danger">
              ID banned · {idUntil ?? "Permanent"}
            </Badge>
          ) : null}
          {user.liveBanned ? (
            <Badge tone="danger">
              Live banned · {liveUntil ?? "Permanent"}
            </Badge>
          ) : null}
          {user.isOfficial ? <Badge tone="gold">Official</Badge> : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Public ID</dt>
              <dd className="font-mono text-lg text-primary">{user.publicId}</dd>
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
              <dt className="text-muted-foreground">ID ban until</dt>
              <dd>{idUntil ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Live ban until</dt>
              <dd>{liveUntil ?? "—"}</dd>
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

        {canListBans ? (
          <Card title="Devices" description="Used for device bans. deviceId comes from app login.">
            {devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No devices recorded — user must log in from the app with deviceId.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {devices.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {d.deviceName || d.deviceId}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {d.deviceId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last seen {formatDate(d.lastSeenAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {d.isNew ? <Badge tone="info">New</Badge> : null}
                      {d.banned ? (
                        <Badge tone="danger">
                          Banned
                          {d.bannedUntil
                            ? ` · ${formatDate(d.bannedUntil)}`
                            : " · Permanent"}
                        </Badge>
                      ) : (
                        <Badge tone="success">OK</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}

        {master ? (
          <Card
            title="Official account (Master)"
            description="Mark verified official hosts or brands."
          >
            <div className="space-y-3">
              <Input
                label="Official ID (optional)"
                value={officialId}
                onChange={(e) => setOfficialId(e.target.value)}
                placeholder="Display badge id"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="btn-press"
                  disabled={busy || user.isOfficial}
                  onClick={() => void toggleOfficial(true)}
                >
                  Enable official
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-press"
                  disabled={busy || !user.isOfficial}
                  onClick={() => void toggleOfficial(false)}
                >
                  Remove official
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <Card
          title="Wallet adjust"
          description="Uses UUID ownerId. Amounts are integers."
        >
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
              onChange={(e) =>
                setDirection(e.target.value as LedgerDirection)
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" className="btn-press" disabled={busy}>
              Save adjust
            </Button>
          </form>
        </Card>
      </div>

      {canListBans ? (
        <Card title="Ban history" description="Newest first.">
          {bans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bans yet.</p>
          ) : (
            <div className="portal-table-scroll">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Device</th>
                    <th className="px-2 py-2 font-medium">Reason</th>
                    <th className="px-2 py-2 font-medium">Starts</th>
                    <th className="px-2 py-2 font-medium">Expires</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {bans.map((ban) => {
                    const status = banStatus(ban);
                    return (
                      <tr
                        key={ban.id}
                        className="border-b border-border/60"
                      >
                        <td className="px-2 py-3 capitalize">{ban.type}</td>
                        <td className="px-2 py-3 font-mono text-xs">
                          {ban.deviceId ?? "—"}
                        </td>
                        <td className="px-2 py-3">{ban.reason ?? "—"}</td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {formatDate(ban.startsAt)}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {ban.expiresAt ? formatDate(ban.expiresAt) : "Permanent"}
                        </td>
                        <td className="px-2 py-3">
                          <Badge
                            tone={
                              status === "Active"
                                ? "danger"
                                : status === "Revoked"
                                  ? "default"
                                  : "info"
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-right">
                          {canMutateBans && status === "Active" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="btn-press"
                              disabled={busy}
                              onClick={() => void revokeBan(ban.id)}
                            >
                              Revoke
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      <Modal
        open={banOpen}
        onClose={() => setBanOpen(false)}
        title={`Ban · ${user.username}`}
        className="max-w-xl"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["id", "ID Ban"],
              ["device", "Device Ban"],
              ["live", "Live Streaming Ban"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setBanTab(id)}
              className={cn(
                "btn-press rounded-lg border px-3 py-1.5 text-sm transition",
                banTab === id
                  ? "border-primary bg-gold-gradient font-medium text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          {banTab === "id"
            ? "Blocks login. Optional: also ban all known devices for the same duration."
            : banTab === "device"
              ? "Blocks login from this deviceId only (even on a new account). User status stays active."
              : "User can still log in. Host Go Live / create room returns 403 until the ban ends."}
        </p>

        <form onSubmit={submitBan} className="space-y-3">
          {banTab === "device" ? (
            devices.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                No devices recorded — user must log in from the app with deviceId.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Device</p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {devices.map((d) => (
                    <label
                      key={d.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition",
                        selectedDeviceId === d.deviceId
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="deviceId"
                        className="mt-1"
                        checked={selectedDeviceId === d.deviceId}
                        onChange={() => setSelectedDeviceId(d.deviceId)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">
                          {d.deviceName || d.deviceId}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                          {d.deviceId}
                        </span>
                      </span>
                      {d.banned ? <Badge tone="danger">Banned</Badge> : null}
                    </label>
                  ))}
                </div>
              </div>
            )
          ) : null}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={cn(
                    "btn-press rounded-lg border px-3 py-1.5 text-sm transition",
                    duration === opt.value
                      ? "border-primary bg-gold-gradient font-medium text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {duration === "custom" ? (
            <Input
              label="Custom hours"
              type="number"
              min={1}
              step={1}
              required
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
            />
          ) : null}

          <Textarea
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />

          {banTab === "id" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeDevices}
                onChange={(e) => setIncludeDevices(e.target.checked)}
              />
              Also ban all known devices
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="submit"
              variant="danger"
              className="btn-press"
              disabled={
                busy ||
                !canMutateBans ||
                (banTab === "device" && devices.length === 0)
              }
            >
              {busy ? "Applying…" : `Apply ${banTab} ban`}
            </Button>
            {canMutateBans && idBannedActive ? (
              <Button
                type="button"
                className="btn-press"
                disabled={busy}
                onClick={() => void liftAllIdBans()}
              >
                Unban (lift all ID bans)
              </Button>
            ) : null}
          </div>
          {!canMutateBans ? (
            <p className="text-xs text-muted-foreground">
              Support role can view bans only.
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
