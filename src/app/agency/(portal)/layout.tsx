"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AgencyShell } from "@/components/agency/shell";
import { LoadingBlock } from "@/components/ui/page";
import { AgencyAuthProvider, useAgencyAuth } from "@/lib/auth/agency-store";
import { getAccessToken } from "@/lib/auth/tokens";

function Guard({ children }: { children: ReactNode }) {
  const { agency, loading } = useAgencyAuth();
  const router = useRouter();
  const authed = Boolean(agency && getAccessToken("agency"));

  useEffect(() => {
    if (loading) return;
    if (!authed) router.replace("/agency/login");
  }, [loading, authed, router]);

  if (loading) return <LoadingBlock label="Checking session…" />;
  if (!authed) return <LoadingBlock label="Redirecting to login…" />;
  return <AgencyShell>{children}</AgencyShell>;
}

export default function AgencyPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AgencyAuthProvider>
      <Guard>{children}</Guard>
    </AgencyAuthProvider>
  );
}
