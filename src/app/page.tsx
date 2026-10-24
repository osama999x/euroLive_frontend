import { LandingHero } from "@/components/landing/hero";
import { LandingMarket } from "@/components/landing/market";
import { LandingPillars } from "@/components/landing/pillars";
import { LandingPortals } from "@/components/landing/portals";
import { LandingStory } from "@/components/landing/story";
import { SiteFooter, SiteHeader } from "@/components/landing/site-shell";

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh w-full max-w-full flex-col overflow-x-clip">
      <SiteHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingStory />
        <LandingMarket />
        <LandingPillars />
        <LandingPortals />
      </main>
      <SiteFooter />
    </div>
  );
}
