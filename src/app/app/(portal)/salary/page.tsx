"use client";

import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { hostApi } from "@/lib/api/app";
import type { HostSalaryView } from "@/lib/api/types";

export default function AppSalaryPage() {
  const { error, success } = useToast();
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [viewPin, setViewPin] = useState("");
  const [salary, setSalary] = useState<HostSalaryView | null>(null);
  const [otp, setOtp] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function setSalaryPin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await hostApi.setSalaryPin({
        pin,
        currentPin: currentPin.trim() || undefined,
      });
      success("Salary PIN updated");
      setPin("");
      setCurrentPin("");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function viewSalary(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await hostApi.viewSalary(viewPin);
      setSalary(data);
    } catch (err) {
      setSalary(null);
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function forgotPin() {
    setBusy(true);
    try {
      await hostApi.forgotSalaryPin();
      setForgotSent(true);
      success("OTP sent — check your registered contact");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function resetPinSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await hostApi.resetSalaryPin({ otp: otp.trim(), pin: resetPin });
      success("PIN reset — you can view salary with the new PIN");
      setOtp("");
      setResetPin("");
      setForgotSent(false);
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-list">
      <PageHeader
        title="Salary"
        description="Protect and view host salary details with a PIN."
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Biometric unlock (if offered in the mobile app) is handled on the client
        only — this portal uses PIN and OTP APIs.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Set or change PIN">
          <form onSubmit={setSalaryPin} className="space-y-3">
            <PasswordInput
              label="New PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              minLength={4}
              required
            />
            <PasswordInput
              label="Current PIN (if changing)"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={busy}>
              Save PIN
            </Button>
          </form>
        </Card>

        <Card title="View salary">
          <form onSubmit={viewSalary} className="space-y-3">
            <PasswordInput
              label="Salary PIN"
              value={viewPin}
              onChange={(e) => setViewPin(e.target.value)}
              required
            />
            <Button type="submit" disabled={busy}>
              Unlock
            </Button>
          </form>
        </Card>

        <Card title="Forgot PIN" className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Request a one-time code, then set a new PIN.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                disabled={busy}
                onClick={() => void forgotPin()}
              >
                Send OTP
              </Button>
              {forgotSent ? (
                <p className="mt-2 text-xs text-success">OTP requested.</p>
              ) : null}
            </div>
            <form onSubmit={resetPinSubmit} className="flex-1 space-y-3">
              <Input
                label="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <PasswordInput
                label="New PIN"
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value)}
                minLength={4}
                required
              />
              <Button type="submit" disabled={busy}>
                Reset PIN
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {salary ? (
        <div className="mt-6">
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <StatCard label="Coin balance" value={salary.wallet.coinBalance} />
            <StatCard
              label="Diamond balance"
              value={salary.wallet.diamondBalance}
            />
          </div>
          <Card title="Salary lines">
            {salary.lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lines for this period.</p>
            ) : (
              <ul className="space-y-3">
                {salary.lines.map((line, i) => (
                  <li
                    key={`${line.period}-${i}`}
                    className="rounded-lg border border-border/60 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{line.period}</span>
                      <Badge tone={line.targetMet ? "success" : "default"}>
                        {line.status}
                      </Badge>
                      {line.hold ? <Badge tone="danger">Hold</Badge> : null}
                    </div>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-xs text-muted-foreground">Live hours</dt>
                        <dd>{line.liveHours}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Live days</dt>
                        <dd>{line.liveDays}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Earned</dt>
                        <dd>{line.earned}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Bonus</dt>
                        <dd>{line.bonus}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Deductions</dt>
                        <dd>{line.deductions}</dd>
                      </div>
                      {line.deductionReason ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-muted-foreground">Deduction reason</dt>
                          <dd>{line.deductionReason}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
