"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PortalFrame } from "@/components/layout/portal-frame";
import { LoadingBlock } from "@/components/ui/page";
import { useAgencyAuth } from "@/lib/auth/agency-store";

export function AgencyShell({ children }: { children: ReactNode }) {
  const { agency, loading, logout } = useAgencyAuth();
  const pathname = usePathname();

  if (loading) return <LoadingBlock label="Loading agency session…" />;
  if (!agency) return null;

  const nav = [
    { href: "/agency", label: "Dashboard" },
    { href: "/agency/hosts", label: "Hosts" },
    { href: "/agency/shares", label: "Shares" },
  ];

  const title =
    nav.find((item) =>
      item.href === "/agency"
        ? pathname === "/agency"
        : pathname.startsWith(item.href),
    )?.label ?? "Agency";

  return (
    <PortalFrame
      rootHref="/agency"
      brandSub="Agency"
      nav={nav}
      title={title}
      statusLabel="Edge live"
      onLogout={() => logout()}
      account={() => (
        <>
          <p className="truncate text-xs font-medium text-foreground">
            {agency.displayName}
          </p>
          <p className="truncate text-xs text-primary">{agency.email}</p>
        </>
      )}
    >
      {children}
    </PortalFrame>
  );
}
