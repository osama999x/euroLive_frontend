"use client";

import { useEffect, type ReactNode } from "react";

import { ResellerShell } from "@/components/reseller/shell";
import { LoadingBlock } from "@/components/ui/page";
import { ResellerAuthProvider, useResellerAuth } from "@/lib/auth/reseller-store";
import { getAccessToken } from "@/lib/auth/tokens";

function Guard({ children }: { children: ReactNode }) {
  const { reseller, loading } = useResellerAuth();

  useEffect(() => {
    if (loading) return;
    if (!getAccessToken("reseller") || !reseller) {
      window.location.replace("/reseller/login");
    }
  }, [loading, reseller]);

  if (loading) return <LoadingBlock label="Checking session…" />;
  if (!reseller || !getAccessToken("reseller")) {
    return <LoadingBlock label="Redirecting to login…" />;
  }
  return <ResellerShell>{children}</ResellerShell>;
}

export default function ResellerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ResellerAuthProvider>
      <Guard>{children}</Guard>
    </ResellerAuthProvider>
  );
}
