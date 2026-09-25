"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/shell";
import { LoadingBlock } from "@/components/ui/page";
import { AppAuthProvider, useAppAuth } from "@/lib/auth/app-store";
import { getAccessToken } from "@/lib/auth/tokens";

function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAppAuth();
  const router = useRouter();
  const authed = Boolean(user && getAccessToken("app"));

  useEffect(() => {
    if (loading) return;
    if (!authed) router.replace("/app/login");
  }, [loading, authed, router]);

  if (loading) return <LoadingBlock label="Checking session…" />;
  if (!authed) return <LoadingBlock label="Redirecting to login…" />;
  return <AppShell>{children}</AppShell>;
}

export default function AppPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthProvider>
      <Guard>{children}</Guard>
    </AppAuthProvider>
  );
}
