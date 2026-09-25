"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import type { BackupRun, BackupSettings } from "@/lib/api/types";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { isMaster } from "@/lib/auth/roles";
import { asList, formatDate, isNotFoundError } from "@/lib/utils";

export default function AdminBackupsPage() {
  const { staff } = useAdminAuth();
  const master = isMaster(staff?.roles);
  const { error, success, toast } = useToast();
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableForm, setDisableForm] = useState({
    password: "",
    totp: "",
    reason: "",
  });
  const [intervalHours, setIntervalHours] = useState("24");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        adminApi.backupSettings(),
        adminApi.listBackups(),
      ]);
      setSettings(s);
      setIntervalHours(String(s.intervalHours));
      setRuns(asList(r));
    } catch (err) {
      if (isNotFoundError(err)) toast("Backups API not available yet");
      else error(err);
    } finally {
      setLoading(false);
    }
  }, [error, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setBusy(true);
    try {
      const next = await adminApi.updateBackupSettings({
        enabled: true,
        intervalHours: Number.parseInt(intervalHours, 10),
      });
      setSettings(next);
      success("Settings updated");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitDisable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await adminApi.updateBackupSettings({
        enabled: false,
        password: disableForm.password,
        totp: disableForm.totp.replace(/\D/g, "").slice(0, 6),
        reason: disableForm.reason,
      });
      setSettings(next);
      success("Backups disabled");
      setDisableOpen(false);
      setDisableForm({ password: "", totp: "", reason: "" });
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function runBackup() {
    if (!master) return;
    setBusy(true);
    try {
      await adminApi.runBackup();
      success("Backup started");
      void load();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading backups…" />;

  return (
    <div>
      <PageHeader
        title="Backups"
        description="Scheduled database backups. Restore is not exposed in admin UI."
        action={
          master ? (
            <Button disabled={busy} onClick={() => void runBackup()}>
              Run backup now
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Settings">
          {settings ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Badge tone={settings.enabled ? "success" : "danger"}>
                  {settings.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last run: {formatDate(settings.lastRunAt)}
                </span>
              </div>
              {settings.disabledReason ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  Disabled: {settings.disabledReason}
                </p>
              ) : null}
              <form onSubmit={saveSettings} className="space-y-3">
                <Input
                  label="Interval (hours)"
                  type="number"
                  min={1}
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>
                    Save & enable
                  </Button>
                  {settings.enabled ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setDisableOpen(true)}
                    >
                      Disable backups…
                    </Button>
                  ) : null}
                </div>
              </form>
            </>
          ) : (
            <EmptyState title="No settings" />
          )}
        </Card>

        <Card title="Recent runs">
          {runs.length === 0 ? (
            <EmptyState title="No backup runs yet" />
          ) : (
            <ul className="space-y-2 text-sm">
              {runs.map((run, i) => (
                <li
                  key={run.id ?? `run-${i}`}
                  className="rounded border border-border px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={run.status === "success" ? "success" : "default"}>
                      {run.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDate(run.createdAt)}
                    </span>
                  </div>
                  {run.manual ? (
                    <span className="text-xs text-muted-foreground">Manual</span>
                  ) : null}
                  {run.path ? (
                    <div className="mt-1 truncate font-mono text-xs">{run.path}</div>
                  ) : null}
                  {run.error ? (
                    <div className="mt-1 text-xs text-danger">{String(run.error)}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={disableOpen} onClose={() => setDisableOpen(false)} title="Disable backups">
        <form onSubmit={submitDisable} className="space-y-3">
          <Input
            label="Password"
            type="password"
            required
            value={disableForm.password}
            onChange={(e) =>
              setDisableForm({ ...disableForm, password: e.target.value })
            }
          />
          <Input
            label="TOTP code"
            required
            inputMode="numeric"
            value={disableForm.totp}
            onChange={(e) => setDisableForm({ ...disableForm, totp: e.target.value })}
          />
          <Textarea
            label="Reason"
            required
            value={disableForm.reason}
            onChange={(e) => setDisableForm({ ...disableForm, reason: e.target.value })}
          />
          <Button type="submit" variant="danger" disabled={busy} className="w-full">
            Confirm disable
          </Button>
        </form>
      </Modal>
    </div>
  );
}
