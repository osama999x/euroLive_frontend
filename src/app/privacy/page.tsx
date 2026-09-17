import type { Metadata } from "next";

import { privacyPage } from "@/components/landing/pages-content";
import { Reveal } from "@/components/landing/reveal";
import { PageHero, SitePage } from "@/components/landing/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Euro Live privacy policy.",
};

export default function PrivacyPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow={privacyPage.eyebrow}
        title={privacyPage.title}
        intro={privacyPage.intro}
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="mb-10 text-xs text-muted-foreground">
          Last updated: {privacyPage.updated}
        </p>
        <div className="space-y-10">
          {privacyPage.sections.map((section, i) => (
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
