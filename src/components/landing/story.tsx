import { landing } from "@/components/landing/content";
import { Reveal } from "@/components/landing/reveal";

export function LandingStory() {
  return (
    <section className="border-t border-primary/15 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="mb-3 text-xs font-medium tracking-[0.28em] text-primary uppercase">
            The vision
          </p>
          <h2 className="font-display text-3xl font-semibold text-gold-gradient sm:text-4xl">
            {landing.story.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            {landing.story.body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
