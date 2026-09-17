"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/page";
import { PortalPageEnter } from "@/components/ui/portal-page-enter";
import { useAdminAuth } from "@/lib/auth/admin-store";
import { filterAdminNav } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

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
    <div className="portal-shell flex min-h-screen">
      <aside className="portal-sidebar sticky top-0 z-20 flex h-screen w-64 shrink-0 flex-col border-r border-primary/25 bg-sidebar/95 px-3 py-4 backdrop-blur-md">
        <div className="mb-6 px-2">
          <BrandLogo size="sm" showWordmark href="/admin" />
          <p className="mt-2 text-[10px] tracking-[0.22em] text-primary/80 uppercase">
            Master Admin
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((item, i) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ animationDelay: `${i * 40}ms` }}
                className={cn(
                  "portal-nav-item rounded-xl px-3 py-2.5 text-sm transition-all duration-300",
                  active
                    ? "portal-nav-active bg-gold-gradient font-medium text-primary-foreground shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-2 rounded-xl border border-primary/20 bg-muted/40 p-3">
          <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
          <p className="text-xs font-medium text-primary capitalize">
            {staff.role.replaceAll("_", " ")}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => logout()}
          >
            Log out
          </Button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 portal-main-glow" />
        <header className="portal-topbar sticky top-0 z-10 border-b border-primary/15 bg-background/70 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-primary uppercase">
                Euro Live
              </p>
              <h1 className="font-display text-lg font-semibold text-gold-soft">
                {title}
              </h1>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="portal-live-dot" aria-hidden />
              <span className="text-xs text-muted-foreground">Ops live</span>
            </div>
          </div>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <PortalPageEnter>{children}</PortalPageEnter>
        </main>
      </div>
    </div>
  );
}
