import { landing } from "@/components/landing/content";
import { Reveal } from "@/components/landing/reveal";

export function LandingPillars() {
  return (
    <section className="border-t border-primary/15 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-[0.28em] text-primary uppercase">
            Platform
          </p>
          <h2 className="font-display text-3xl font-semibold text-gold-gradient sm:text-4xl">
            Four pillars of Euro Live
          </h2>
        </Reveal>

        <div className="space-y-0">
          {landing.pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delayMs={i * 80}>
              <article className="grid gap-3 border-t border-primary/20 py-8 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] sm:gap-10">
                <h3 className="font-display text-2xl font-semibold text-gold-soft">
                  {pillar.title}
                </h3>
                <p className="text-base leading-7 text-muted-foreground">
                  {pillar.body}
                </p>
              </article>
            </Reveal>
          ))}
          <div className="border-t border-primary/20" />
        </div>
      </div>
    </section>
  );
}
