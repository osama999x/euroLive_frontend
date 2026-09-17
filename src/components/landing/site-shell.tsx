import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/logo";
import { landing } from "@/components/landing/content";
import { legalNav, siteNav } from "@/components/landing/pages-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  return (
    <header className="relative z-20 border-b border-primary/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <BrandLogo size="sm" showWordmark />
        <nav className="hidden items-center gap-1 md:flex">
          {siteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition",
                activeHref === item.href
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/admin/login">
            <Button variant="ghost" size="sm">
              Admin
            </Button>
          </Link>
          <Link href="/reseller/login">
            <Button variant="secondary" size="sm">
              Reseller
            </Button>
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3 md:hidden sm:px-6">
        {siteNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs",
              activeHref === item.href
                ? "border-primary/50 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-primary/20 px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BrandLogo size="sm" showWordmark />
            <p className="mt-3 text-xs tracking-[0.28em] text-primary uppercase">
              {landing.tagline}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Explore</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary">
                    Home
                  </Link>
                </li>
                {siteNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Portals</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/admin/login" className="hover:text-primary">
                    Admin
                  </Link>
                </li>
                <li>
                  <Link href="/reseller/login" className="hover:text-primary">
                    Reseller
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Legal</p>
              <ul className="space-y-2 text-muted-foreground">
                {legalNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sources</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground/80">
            {landing.sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} Euro Live. Live more together.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function SitePage({
  activeHref,
  children,
}: {
  activeHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader activeHref={activeHref} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-primary/15 px-4 py-16 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow opacity-60" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-medium tracking-[0.28em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl font-semibold text-gold-gradient sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
          {intro}
        </p>
      </div>
    </section>
  );
}
