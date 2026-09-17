import { CountUp } from "@/components/landing/count-up";
import { landing } from "@/components/landing/content";
import { Reveal } from "@/components/landing/reveal";

export function LandingMarket() {
  return (
    <section className="border-t border-primary/15 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium tracking-[0.28em] text-primary uppercase">
            Market pulse
          </p>
          <h2 className="font-display text-3xl font-semibold text-gold-gradient sm:text-4xl">
            {landing.market.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {landing.market.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {landing.market.stats.map((stat, i) => (
            <Reveal key={stat.id} delayMs={i * 120} className="text-center sm:text-left">
              <p className="font-display text-4xl font-semibold text-gold-gradient sm:text-5xl">
                <CountUp
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {stat.label}
              </p>
              <a
                href={stat.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary/80 underline-offset-4 hover:text-primary hover:underline"
              >
                {stat.source}
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={200}>
          <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-muted-foreground/80">
            {landing.market.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
