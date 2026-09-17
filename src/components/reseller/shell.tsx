"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PortalFrame } from "@/components/layout/portal-frame";
import { LoadingBlock } from "@/components/ui/page";
import { useResellerAuth } from "@/lib/auth/reseller-store";

export function ResellerShell({ children }: { children: ReactNode }) {
  const { reseller, loading, logout } = useResellerAuth();
  const pathname = usePathname();

  if (loading) return <LoadingBlock label="Loading reseller session…" />;
  if (!reseller) return null;

  const perms = reseller.permissions;
  const nav = [
    { href: "/reseller", label: "Dashboard", show: true },
    { href: "/reseller/transfer", label: "Transfer coins", show: perms.canRecharge },
    {
      href: "/reseller/assign",
      label: "Assign items",
      show:
        perms.canAssignFrame || perms.canAssignEntry || perms.canAssignBadge,
    },
    { href: "/reseller/transactions", label: "Transactions", show: true },
    { href: "/reseller/reports", label: "Reports", show: true },
    { href: "/reseller/limits", label: "My limits", show: true },
  ]
    .filter((i) => i.show)
    .map(({ href, label }) => ({ href, label }));

  const title =
    nav.find((item) =>
      item.href === "/reseller"
        ? pathname === "/reseller"
        : pathname.startsWith(item.href),
    )?.label ?? "Reseller";

  return (
    <PortalFrame
      rootHref="/reseller"
      brandSub="Reseller"
      nav={nav}
      title={title}
      statusLabel="Edge live"
      onLogout={() => logout()}
      account={() => (
        <>
          <p className="truncate text-xs font-medium text-foreground">
            {reseller.displayName}
          </p>
          <p className="truncate text-xs text-primary">{reseller.email}</p>
        </>
      )}
    >
      {children}
    </PortalFrame>
  );
}
