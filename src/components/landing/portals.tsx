import Link from "next/link";

import { landing } from "@/components/landing/content";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";

export function LandingPortals() {
  return (
    <section className="border-t border-primary/15 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-[0.28em] text-primary uppercase">
            Access
          </p>
          <h2 className="font-display text-3xl font-semibold text-gold-gradient sm:text-4xl">
            {landing.portals.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {landing.portals.subtitle}
          </p>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2">
          {landing.portals.items.map((item, i) => (
            <Reveal key={item.title} delayMs={i * 100}>
              <div className="flex h-full flex-col border-l-2 border-primary/50 pl-5">
                <h3 className="font-display text-2xl font-semibold text-gold-soft">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                  {item.body}
                </p>
                <Link href={item.href} className="mt-6 inline-flex">
                  <Button
                    className={
                      i === 0 ? "landing-cta-shimmer" : undefined
                    }
                    variant={i === 0 ? "primary" : "secondary"}
                  >
                    {item.cta}
                  </Button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
