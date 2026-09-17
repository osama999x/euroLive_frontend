"use client";

import { FormEvent, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import { useAdminAuth } from "@/lib/auth/admin-store";

export default function AdminSecurityPage() {
  const { staff, refreshMe } = useAdminAuth();
  const { error, success } = useToast();
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(
    null,
  );
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setBusy(true);
    try {
      const data = await adminApi.setup2fa();
      setSetup(data);
      success("Scan the QR, then enter a code to enable");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function enable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.enable2fa(enableCode);
      success("2FA enabled");
      setSetup(null);
      setEnableCode("");
      await refreshMe();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.disable2fa(disableCode);
      success("2FA disabled");
      setDisableCode("");
      await refreshMe();
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Security"
        description="Manage your own staff two-factor authentication."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Status">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">TOTP</span>
            <Badge tone={staff?.totpEnabled ? "success" : "default"}>
              {staff?.totpEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          {!staff?.totpEnabled ? (
            <Button className="mt-4" onClick={startSetup} disabled={busy}>
              Set up 2FA
            </Button>
          ) : null}
        </Card>

        {setup ? (
          <Card title="Scan QR" description="Secret is shown for backup only.">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={setup.otpauthUrl} size={180} />
              </div>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {setup.secret}
              </p>
              <form onSubmit={enable} className="w-full space-y-3">
                <Input
                  label="Verification code"
                  value={enableCode}
                  onChange={(e) => setEnableCode(e.target.value)}
                  required
                />
                <Button type="submit" disabled={busy} className="w-full">
                  Enable 2FA
                </Button>
              </form>
            </div>
          </Card>
        ) : null}

        {staff?.totpEnabled ? (
          <Card title="Disable 2FA">
            <form onSubmit={disable} className="space-y-3">
              <Input
                label="Current code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                required
              />
              <Button type="submit" variant="danger" disabled={busy}>
                Disable 2FA
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
