"use client";

import type { ReactNode } from "react";

import { PortalFrame } from "@/components/layout/portal-frame";
import { LoadingBlock } from "@/components/ui/page";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { filterAdminNav } from "@/lib/auth/roles";
import { usePathname } from "next/navigation";

export function AdminShell({ children }: { children: ReactNode }) {
  const { staff, loading, logout } = useAdminAuth();
  const pathname = usePathname();

  if (loading) return <LoadingBlock label="Loading admin session…" />;
  if (!staff) return null;

  const nav = filterAdminNav(staff.roles ?? [staff.role]);
  const title =
    nav.find((item) =>
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href),
    )?.label ?? "Admin";

  return (
    <PortalFrame
      rootHref="/admin"
      brandSub="Master Admin"
      nav={nav}
      title={title}
      statusLabel="Ops live"
      onLogout={() => logout()}
      account={() => (
        <>
          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
          <p className="text-xs font-medium text-primary capitalize">
            {staff.role.replaceAll("_", " ")}
          </p>
        </>
      )}
    >
      {children}
    </PortalFrame>
  );
}
