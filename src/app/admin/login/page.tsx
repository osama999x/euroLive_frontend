"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api/admin";
import { AdminAuthProvider, useAdminAuth } from "@/lib/auth/admin-store";
import { getAccessToken } from "@/lib/auth/tokens";

function AdminLoginForm() {
  const { setSession } = useAdminAuth();
  const router = useRouter();
  const { error, success } = useToast();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getAccessToken("admin")) router.replace("/admin");
  }, [router]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await adminApi.login({ login, password });
      if (data.requires2fa) {
        setChallengeToken(data.challengeToken);
        success("Enter your 2FA code");
        return;
      }
      setSession(data.staff, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace("/admin");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setBusy(true);
    try {
      const data = await adminApi.verify2fa({ challengeToken, code });
      setSession(data.staff, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace("/admin");
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-login relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" />
      <div className="portal-login-card relative z-10 w-full max-w-md rounded-2xl border border-primary/30 bg-card/90 p-6 shadow-[0_0_60px_rgba(212,175,55,0.12)] backdrop-blur-md sm:p-8">
        <div className="mb-2 text-center">
          <h1 className="font-display text-2xl font-semibold text-gold-gradient">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Master Admin portal</p>
        </div>
        <div className="landing-float mb-6 flex justify-center">
          <div className="landing-glow-ring rounded-full p-0.5">
            <BrandLogo href="/" size="md" />
          </div>
        </div>
        {!challengeToken ? (
          <form onSubmit={onLogin} className="space-y-4">
            <Input
              label="Email or username"
              name="login"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
            <PasswordInput
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <div className="-mt-2 text-right">
              <Link
                href="/admin/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              className="landing-cta-shimmer w-full"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-4">
            <Input
              label="2FA code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Button type="submit" className="landing-cta-shimmer w-full" disabled={busy}>
              {busy ? "Verifying…" : "Verify"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setChallengeToken(null);
                setCode("");
              }}
            >
              Back
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <AdminLoginForm />
    </AdminAuthProvider>
  );
}
