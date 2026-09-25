"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PortalFrame } from "@/components/layout/portal-frame";
import { Badge } from "@/components/ui/badge";
import { LoadingBlock } from "@/components/ui/page";
import { useAppAuth } from "@/lib/auth/app-store";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/rooms", label: "Rooms" },
  { href: "/app/complaints", label: "Complaints" },
  { href: "/app/sos", label: "SOS" },
  { href: "/app/salary", label: "Salary" },
  { href: "/app/devices", label: "Devices" },
  { href: "/app/report", label: "Report" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAppAuth();
  const pathname = usePathname();

  if (loading) return <LoadingBlock label="Loading app session…" />;
  if (!user) return null;

  const title =
    NAV.find((item) =>
      item.href === "/app"
        ? pathname === "/app"
        : pathname.startsWith(item.href),
    )?.label ?? "App";

  return (
    <PortalFrame
      rootHref="/app"
      brandSub="App / Host"
      nav={NAV}
      title={title}
      statusLabel="Live"
      onLogout={() => logout()}
      account={() => (
        <>
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-medium text-foreground">
              {user.displayName}
            </p>
            {user.isOfficial ? (
              <Badge tone="gold" className="shrink-0 px-1.5 py-0 text-[10px]">
                Official
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-primary">@{user.username}</p>
        </>
      )}
    >
      {children}
    </PortalFrame>
  );
}
