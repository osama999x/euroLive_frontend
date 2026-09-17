import type { Metadata } from "next";

import { termsPage } from "@/components/landing/pages-content";
import { Reveal } from "@/components/landing/reveal";
import { PageHero, SitePage } from "@/components/landing/site-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Euro Live terms of service.",
};

export default function TermsPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow={termsPage.eyebrow}
        title={termsPage.title}
        intro={termsPage.intro}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="mb-10 text-xs text-muted-foreground">
          Last updated: {termsPage.updated}
        </p>
        <div className="space-y-10">
          {termsPage.sections.map((section, i) => (
            <Reveal key={section.title} delayMs={i * 50}>
              <article>
                <h2 className="font-display text-xl font-semibold text-gold-soft">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  {section.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </SitePage>
  );
}
