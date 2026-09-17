"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PortalPageEnter } from "@/components/ui/portal-page-enter";
import { cn } from "@/lib/utils";

export type PortalNavItem = {
  href: string;
  label: string;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden>
      <span
        className={cn(
          "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-200",
          open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-200",
          open && "opacity-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-200",
          open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
        )}
      />
    </span>
  );
}

function isActivePath(pathname: string, href: string, rootHref: string) {
  if (href === rootHref) return pathname === rootHref;
  return pathname.startsWith(href);
}

function SidebarBody({
  rootHref,
  brandSub,
  nav,
  account,
  onLogout,
  onNavigate,
  showClose,
  onClose,
}: {
  rootHref: string;
  brandSub: string;
  nav: PortalNavItem[];
  account: () => ReactNode;
  onLogout: () => void;
  onNavigate: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-2 px-2">
        <div className="min-w-0">
          <BrandLogo size="sm" showWordmark href={rootHref} />
          <p className="mt-2 text-[10px] tracking-[0.22em] text-primary/80 uppercase">
            {brandSub}
          </p>
        </div>
        {showClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="btn-press shrink-0"
            aria-label="Close menu"
            onClick={onClose}
          >
            <MenuIcon open />
          </Button>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
        {nav.map((item, i) => {
          const active = isActivePath(pathname, item.href, rootHref);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={onNavigate}
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
        {account()}
        <Button
          variant="secondary"
          size="sm"
          className="btn-press w-full"
          onClick={() => {
            onNavigate();
            onLogout();
          }}
        >
          Log out
        </Button>
      </div>
    </>
  );
}

export function PortalFrame({
  rootHref,
  brandSub,
  nav,
  title,
  statusLabel,
  account,
  onLogout,
  children,
}: {
  rootHref: string;
  brandSub: string;
  nav: PortalNavItem[];
  title: string;
  statusLabel: string;
  account: () => ReactNode;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="portal-shell flex min-h-screen overflow-x-hidden">
      <aside className="portal-sidebar sticky top-0 z-20 hidden h-screen w-64 shrink-0 flex-col border-r border-primary/25 bg-sidebar/95 px-3 py-4 backdrop-blur-md lg:flex">
        <SidebarBody
          rootHref={rootHref}
          brandSub={brandSub}
          nav={nav}
          account={account}
          onLogout={onLogout}
          onNavigate={close}
        />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={close}
        />
        <aside
          className={cn(
            "portal-sidebar absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-primary/25 bg-sidebar px-3 py-4 shadow-2xl transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarBody
            rootHref={rootHref}
            brandSub={brandSub}
            nav={nav}
            account={account}
            onLogout={onLogout}
            onNavigate={close}
            showClose
            onClose={close}
          />
        </aside>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 portal-main-glow" />
        <header className="portal-topbar sticky top-0 z-30 border-b border-primary/15 bg-background/70 px-3 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="btn-press shrink-0 lg:hidden"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
              >
                <MenuIcon open={open} />
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.2em] text-primary uppercase">
                  Euro Live
                </p>
                <h1 className="truncate font-display text-base font-semibold text-gold-soft sm:text-lg">
                  {title}
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="portal-live-dot" aria-hidden />
              <span className="text-xs text-muted-foreground">{statusLabel}</span>
            </div>
          </div>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
          <PortalPageEnter>{children}</PortalPageEnter>
        </main>
      </div>
    </div>
  );
}
