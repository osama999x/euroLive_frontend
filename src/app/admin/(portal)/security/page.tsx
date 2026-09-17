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

function normalizeTotpCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export default function AdminSecurityPage() {
  const { staff, refreshMe, patchStaff } = useAdminAuth();
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
    const code = normalizeTotpCode(enableCode);
    if (code.length !== 6) {
      error("Enter the 6-digit authenticator code");
      return;
    }
    setBusy(true);
    try {
      await adminApi.enable2fa(code);
      patchStaff({ totpEnabled: true });
      setSetup(null);
      setEnableCode("");
      success("2FA enabled");
      try {
        await refreshMe();
      } catch {
        // local patch already applied
      }
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    const code = normalizeTotpCode(disableCode);
    if (code.length !== 6) {
      error("Enter the 6-digit authenticator code");
      return;
    }
    setBusy(true);
    try {
      await adminApi.disable2fa(code);
      // Update UI immediately — don't depend on /me alone
      patchStaff({ totpEnabled: false });
      setDisableCode("");
      setSetup(null);
      success("2FA disabled");
      try {
        const me = await refreshMe();
        // If /me is stale and still says enabled, keep the successful disable
        if (me?.totpEnabled) patchStaff({ totpEnabled: false });
      } catch {
        // disable already succeeded; keep optimistic state
      }
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

        {setup && !staff?.totpEnabled ? (
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
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={enableCode}
                  onChange={(e) => setEnableCode(normalizeTotpCode(e.target.value))}
                  required
                />
                <Button type="submit" disabled={busy || enableCode.length !== 6} className="w-full">
                  Enable 2FA
                </Button>
              </form>
            </div>
          </Card>
        ) : null}

        {staff?.totpEnabled ? (
          <Card
            title="Disable 2FA"
            description="Enter the current 6-digit code from your authenticator app."
          >
            <form onSubmit={disable} className="space-y-3">
              <Input
                label="Current code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(normalizeTotpCode(e.target.value))}
                required
              />
              <Button
                type="submit"
                variant="danger"
                disabled={busy || disableCode.length !== 6}
              >
                {busy ? "Disabling…" : "Disable 2FA"}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
