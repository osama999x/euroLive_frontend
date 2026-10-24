import { BrandLogo } from "@/components/brand/logo";
import { landing } from "@/components/landing/content";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-6 pb-8 text-center sm:px-6 sm:pt-8 sm:pb-12 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" aria-hidden />

      <div className="landing-float relative z-10 mb-4">
        <div className="landing-glow-ring rounded-full p-1">
          <BrandLogo href={null} size="lg" className="justify-center" />
        </div>
      </div>

      <p className="relative z-10 mb-2 max-w-full text-xs font-medium tracking-[0.22em] text-primary uppercase sm:tracking-[0.35em]">
        {landing.tagline}
      </p>
      <h1 className="relative z-10 max-w-3xl font-display text-3xl font-semibold tracking-tight text-gold-gradient sm:text-5xl md:text-6xl">
        {landing.headline}
      </h1>
      <p className="relative z-10 mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-lg">
        {landing.support}
      </p>
      <div className="relative z-10 mt-6 grid w-full max-w-md grid-cols-2 gap-2 sm:mt-8 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-3">
        <Link href="/admin/login" className="col-span-2 sm:w-auto">
          <Button size="lg" className="landing-cta-shimmer w-full sm:w-auto">
            Admin Portal
          </Button>
        </Link>
        <Link href="/agency/login" className="sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto">
            Agency
          </Button>
        </Link>
        <Link href="/reseller/login" className="sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto">
            Reseller
          </Button>
        </Link>
        <Link href="/app/login" className="col-span-2 sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto">
            App / Host
          </Button>
        </Link>
      </div>
    </section>
  );
}
