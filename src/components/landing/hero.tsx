import { BrandLogo } from "@/components/brand/logo";
import { landing } from "@/components/landing/content";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative flex min-h-[calc(100svh-5.5rem)] flex-col items-center justify-center px-4 pb-10 pt-2 text-center sm:min-h-[calc(100svh-4.5rem)] sm:px-6">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" aria-hidden />

      <div className="landing-float relative z-10 mb-4">
        <div className="landing-glow-ring rounded-full p-1">
          <BrandLogo href={null} size="lg" className="justify-center" />
        </div>
      </div>

      <p className="relative z-10 mb-2 text-xs font-medium tracking-[0.35em] text-primary uppercase">
        {landing.tagline}
      </p>
      <h1 className="relative z-10 max-w-3xl font-display text-3xl font-semibold tracking-tight text-gold-gradient sm:text-5xl md:text-6xl">
        {landing.headline}
      </h1>
      <p className="relative z-10 mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-lg">
        {landing.support}
      </p>
      <div className="relative z-10 mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:justify-center">
        <Link href="/admin/login" className="w-full sm:w-auto">
          <Button size="lg" className="landing-cta-shimmer w-full sm:w-auto">
            Admin Portal
          </Button>
        </Link>
        <Link href="/reseller/login" className="w-full sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto">
            Reseller Portal
          </Button>
        </Link>
      </div>
    </section>
  );
}
