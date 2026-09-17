import type { Metadata } from "next";

import { aboutPage } from "@/components/landing/pages-content";
import { Reveal } from "@/components/landing/reveal";
import { PageHero, SitePage } from "@/components/landing/site-shell";

export const metadata: Metadata = {
  title: "About",
  description: "About Euro Live — live more together.",
};

export default function AboutPage() {
  return (
    <SitePage activeHref="/about">
      <PageHero
        eyebrow={aboutPage.eyebrow}
        title={aboutPage.title}
        intro={aboutPage.intro}
      />
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-16 sm:px-6">
        {aboutPage.sections.map((section, i) => (
          <Reveal key={section.title} delayMs={i * 80}>
            <article className="border-t border-primary/20 pt-8">
              <h2 className="font-display text-2xl font-semibold text-gold-soft">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-8 text-muted-foreground">
                {section.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </SitePage>
  );
}
