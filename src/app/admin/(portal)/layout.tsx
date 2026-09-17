"use client";

import { useEffect, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/shell";
import { LoadingBlock } from "@/components/ui/page";
import { AdminAuthProvider, useAdminAuth } from "@/lib/auth/admin-store";
import { getAccessToken } from "@/lib/auth/tokens";

function Guard({ children }: { children: ReactNode }) {
  const { staff, loading } = useAdminAuth();

  useEffect(() => {
    if (loading) return;
    if (!getAccessToken("admin") || !staff) {
      window.location.replace("/admin/login");
    }
  }, [loading, staff]);

  if (loading) return <LoadingBlock label="Checking session…" />;
  if (!staff || !getAccessToken("admin")) {
    return <LoadingBlock label="Redirecting to login…" />;
  }
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <Guard>{children}</Guard>
    </AdminAuthProvider>
  );
}
