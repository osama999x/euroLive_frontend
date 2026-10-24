"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { appApi } from "@/lib/api/app";
import { AppAuthProvider, useAppAuth } from "@/lib/auth/app-store";
import { getAccessToken } from "@/lib/auth/tokens";

const DEVICE_ID_KEY = "kl_device_id";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    try {
      id = crypto.randomUUID();
    } catch {
      id = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function deviceNameFromUa(): string {
  if (typeof navigator === "undefined") return "Web";
  return navigator.userAgent.slice(0, 120);
}

function AppLoginForm() {
  const { setSession } = useAppAuth();
  const router = useRouter();
  const { error } = useToast();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getAccessToken("app")) router.replace("/app");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await appApi.login({
        login,
        password,
        deviceId: getOrCreateDeviceId(),
        deviceName: deviceNameFromUa(),
      });
      setSession(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      // Hard navigate so the portal provider remounts with tokens from storage.
      window.location.assign("/app");
      return;
    } catch (err) {
      error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-login relative flex min-h-dvh w-full max-w-full items-start justify-center overflow-x-clip overflow-y-auto px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" />
      <div className="portal-login-card relative z-10 w-full max-w-md rounded-2xl border border-primary/30 bg-card/90 p-6 shadow-[0_0_60px_rgba(212,175,55,0.12)] backdrop-blur-md sm:p-8">
        <div className="mb-2 text-center">
          <h1 className="font-display text-2xl font-semibold text-gold-gradient">
            App sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">App / Host portal</p>
        </div>
        <div className="landing-float mb-6 flex justify-center">
          <div className="landing-glow-ring rounded-full p-0.5">
            <BrandLogo href="/" size="md" />
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Login or username"
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
          <Button
            type="submit"
            className="landing-cta-shimmer w-full"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo seeds:{" "}
          <span className="font-mono text-foreground/80">host_pk_1</span> /{" "}
          <span className="font-mono text-foreground/80">Host@1234</span>
          {" · "}
          <span className="font-mono text-foreground/80">demo_user</span> /{" "}
          <span className="font-mono text-foreground/80">Demo@1234</span>
        </p>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AppLoginPage() {
  return (
    <AppAuthProvider>
      <AppLoginForm />
    </AppAuthProvider>
  );
}
