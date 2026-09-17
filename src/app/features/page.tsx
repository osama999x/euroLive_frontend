import type { Metadata } from "next";

import { featuresPage } from "@/components/landing/pages-content";
import { Reveal } from "@/components/landing/reveal";
import { PageHero, SitePage } from "@/components/landing/site-shell";

export const metadata: Metadata = {
  title: "Features",
  description: "Euro Live platform features for creators, fans, resellers, and operators.",
};

export default function FeaturesPage() {
  return (
    <SitePage activeHref="/features">
      <PageHero
        eyebrow={featuresPage.eyebrow}
        title={featuresPage.title}
        intro={featuresPage.intro}
      />
      <div className="mx-auto max-w-5xl space-y-16 px-4 py-16 sm:px-6">
        {featuresPage.groups.map((group, gi) => (
          <Reveal key={group.title} delayMs={gi * 60}>
            <section>
              <h2 className="font-display text-2xl font-semibold text-gold-gradient sm:text-3xl">
                {group.title}
              </h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article
                    key={item.title}
                    className="border-l-2 border-primary/40 pl-4"
                  >
                    <h3 className="font-medium text-gold-soft">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </SitePage>
  );
}
