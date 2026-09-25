"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { appApi } from "@/lib/api/app";
import type { DeviceRecord } from "@/lib/api/types";
import { useAppAuth } from "@/lib/auth/app-store";
import { asList, formatDate } from "@/lib/utils";

export default function AppDevicesPage() {
  const { logout } = useAppAuth();
  const { error, success } = useToast();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeReason, setFreezeReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await appApi.devices();
      setDevices(asList(data));
    } catch (err) {
      error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logoutAll() {
    if (!window.confirm("Sign out all devices? You will need to sign in again.")) {
      return;
    }
    setBusy(true);
    try {
      await appApi.logoutAll();
      success("All sessions revoked");
      await logout();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function freezeAccount(e: FormEvent) {
    e.preventDefault();
    const reason = freezeReason.trim();
    if (
      !window.confirm(
        "Freeze your account? You may lose access until support restores it.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await appApi.freeze(reason);
      success("Account freeze requested");
      setFreezeReason("");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Devices"
        description="Review signed-in devices and session security."
      />

      <Card
        className="mb-4"
        title="Sessions"
        action={
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => void logoutAll()}
          >
            Log out all devices
          </Button>
        }
      >
        {loading ? (
          <LoadingBlock label="Loading devices…" />
        ) : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices recorded.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {devices.map((d) => (
              <li
                key={d.id}
                className={`flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0 ${
                  d.isNew ? "rounded-lg bg-primary/5 px-2 -mx-2" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {d.deviceName ?? "Unknown device"}
                    </span>
                    {d.isNew ? <Badge tone="gold">New</Badge> : null}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    {d.deviceId}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Last seen {formatDate(d.lastSeenAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Freeze account">
        <p className="mb-3 text-sm text-muted-foreground">
          Self-freeze if your account may be compromised. Support must unfreeze
          you.
        </p>
        <form onSubmit={freezeAccount} className="space-y-3">
          <Textarea
            label="Reason"
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
            required
            placeholder="Why are you freezing this account?"
          />
          <Button type="submit" variant="danger" disabled={busy}>
            Freeze account
          </Button>
        </form>
      </Card>
    </div>
  );
}
