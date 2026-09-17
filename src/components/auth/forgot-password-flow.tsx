"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { resellerApi } from "@/lib/api/reseller";
import type { Portal } from "@/lib/auth/tokens";
import { formatMessage } from "@/lib/utils";

type Step = "email" | "otp" | "reset";

type ForgotPasswordFlowProps = {
  portal: Portal;
};

function apiFor(portal: Portal) {
  return portal === "admin" ? adminApi : resellerApi;
}

function messageText(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return formatMessage((err as { message: string | string[] }).message);
  }
  return "Something went wrong. Please try again.";
}

export function ForgotPasswordFlow({ portal }: ForgotPasswordFlowProps) {
  const router = useRouter();
  const { error, success, toast } = useToast();
  const loginPath = portal === "admin" ? "/admin/login" : "/reseller/login";
  const title = portal === "admin" ? "Admin" : "Reseller";

  const [step, setStep] = useState<Step>("email");
  const [login, setLogin] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const api = useMemo(() => apiFor(portal), [portal]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (step !== "otp" || !otpExpiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [step, otpExpiresAt]);

  const otpSecondsLeft = otpExpiresAt
    ? Math.max(0, Math.ceil((otpExpiresAt - now) / 1000))
    : 0;

  useEffect(() => {
    if (step === "otp" && otpExpiresAt && otpSecondsLeft <= 0) {
      toast("Code expired. Request a new one.", "danger");
      setStep("email");
      setOtp("");
      setOtpExpiresAt(null);
    }
  }, [step, otpExpiresAt, otpSecondsLeft, toast]);

  const startResendTimer = useCallback(() => setResendIn(60), []);

  async function sendOtp(e?: FormEvent) {
    e?.preventDefault();
    const value = login.trim();
    if (!value) return;
    setBusy(true);
    try {
      const data = await api.forgotPassword(value);
      setOtpExpiresAt(Date.now() + (data.expiresInSeconds || 600) * 1000);
      startResendTimer();
      setOtp("");
      setStep("otp");
      success(
        "If an account exists for that email/username, a 6-digit code was sent. Check inbox and spam.",
      );
    } catch (err) {
      const msg = messageText(err);
      const status = err instanceof ApiError ? err.statusCode : 0;
      if (status === 502 || /could not send|email/i.test(msg)) {
        error("Could not send reset email. Try again in a minute.");
        startResendTimer();
      } else {
        // Still show generic success-style copy for unknown/user-not-found
        // unless it's a clear server/email failure — prompt: never say user not found
        if (status === 404 || /not found/i.test(msg)) {
          success(
            "If an account exists for that email/username, a 6-digit code was sent. Check inbox and spam.",
          );
          setOtpExpiresAt(Date.now() + 600 * 1000);
          startResendTimer();
          setOtp("");
          setStep("otp");
        } else {
          error(err);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    try {
      const data = await api.forgotPassword(login.trim());
      setOtpExpiresAt(Date.now() + (data.expiresInSeconds || 600) * 1000);
      startResendTimer();
      setOtp("");
      success(
        "If an account exists for that email/username, a 6-digit code was sent. Check inbox and spam.",
      );
    } catch (err) {
      const status = err instanceof ApiError ? err.statusCode : 0;
      if (status === 502) {
        error("Could not send reset email. Try again in a minute.");
        startResendTimer();
      } else {
        error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setBusy(true);
    try {
      await api.verifyOtp(login.trim(), otp);
      setStep("reset");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (err) {
      const msg = messageText(err);
      setOtp("");
      otpRefs.current[0]?.focus();
      if (/too many invalid attempts/i.test(msg)) {
        error(err);
        setStep("email");
        setOtpExpiresAt(null);
      } else {
        error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(login.trim(), otp, newPassword);
      success("Password updated. Please log in.");
      setLogin("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpExpiresAt(null);
      router.replace(loginPath);
    } catch (err) {
      const msg = messageText(err);
      if (/invalid or expired otp/i.test(msg)) {
        error(err);
        setOtp("");
        setStep("otp");
      } else if (/too many invalid attempts/i.test(msg)) {
        error(err);
        setStep("email");
        setOtp("");
        setOtpExpiresAt(null);
      } else if (/newPassword|password|min/i.test(msg)) {
        setPasswordError(msg);
      } else {
        error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  function onOtpDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const chars = otp.padEnd(6, " ").split("");
    chars[index] = digit || " ";
    const next = chars.join("").replace(/ /g, "").slice(0, 6);
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function onOtpKeyDown(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function goBack() {
    if (step === "email") {
      router.push(loginPath);
      return;
    }
    if (step === "otp") {
      setStep("email");
      setOtp("");
      return;
    }
    setStep("otp");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  }

  const minutes = Math.floor(otpSecondsLeft / 60);
  const seconds = otpSecondsLeft % 60;

  return (
    <div className="portal-login relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" />
      <div className="portal-login-card relative z-10 w-full max-w-md rounded-2xl border border-primary/30 bg-card/90 p-6 shadow-[0_0_60px_rgba(212,175,55,0.12)] backdrop-blur-md sm:p-8">
        <div className="mb-2 text-center">
          <h1 className="font-display text-2xl font-semibold text-gold-gradient">
            {step === "email" && "Forgot password"}
            {step === "otp" && "Enter code"}
            {step === "reset" && "New password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {title} portal recovery
          </p>
        </div>
        <div className="landing-float mb-6 flex justify-center">
          <div className="landing-glow-ring rounded-full p-0.5">
            <BrandLogo href="/" size="md" />
          </div>
        </div>

        {step === "email" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <Input
              label="Email or username"
              name="login"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="landing-cta-shimmer w-full"
              disabled={busy || resendIn > 0}
            >
              {busy
                ? "Sending…"
                : resendIn > 0
                  ? `Wait ${resendIn}s`
                  : "Send code"}
            </Button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={onVerifyOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Code sent for <span className="text-foreground">{login}</span>
            </p>
            <p className="text-xs text-primary">
              OTP expires in {minutes}:{String(seconds).padStart(2, "0")}
            </p>
            <div>
              <span className="mb-1.5 block text-sm text-muted-foreground">
                6-digit code
              </span>
              <div className="flex justify-between gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={otp[i] ?? ""}
                    onChange={(e) => onOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(i, e.key)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (!pasted) return;
                      setOtp(pasted);
                      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
                    }}
                    className="h-11 w-10 rounded-lg border border-border bg-muted/60 text-center text-lg text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 sm:w-11"
                    required
                  />
                ))}
              </div>
            </div>
            <Button
              type="submit"
              className="landing-cta-shimmer w-full"
              disabled={busy || otp.length !== 6}
            >
              {busy ? "Checking…" : "Verify code"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy || resendIn > 0}
              onClick={onResend}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </Button>
          </form>
        ) : null}

        {step === "reset" ? (
          <form onSubmit={onReset} className="space-y-4">
            <PasswordInput
              label="New password"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError("");
              }}
              minLength={8}
              required
              error={passwordError || undefined}
            />
            <PasswordInput
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError("");
              }}
              minLength={8}
              required
            />
            <Button
              type="submit"
              className="landing-cta-shimmer w-full"
              disabled={busy}
            >
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" variant="ghost" className="w-full" onClick={goBack}>
            Back
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href={loginPath} className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
