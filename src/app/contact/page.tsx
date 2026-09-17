import type { Metadata } from "next";
import Link from "next/link";

import { contactPage } from "@/components/landing/pages-content";
import { Reveal } from "@/components/landing/reveal";
import { PageHero, SitePage } from "@/components/landing/site-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Euro Live for partnerships, operations, and security.",
};

export default function ContactPage() {
  return (
    <SitePage activeHref="/contact">
      <PageHero
        eyebrow={contactPage.eyebrow}
        title={contactPage.title}
        intro={contactPage.intro}
      />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {contactPage.channels.map((channel, i) => (
            <Reveal key={channel.title} delayMs={i * 80}>
              <article className="border-t border-primary/25 pt-5">
                <h2 className="font-display text-xl text-gold-soft">
                  {channel.title}
                </h2>
                <a
                  href={`mailto:${channel.detail}`}
                  className="mt-3 block text-sm text-primary hover:underline"
                >
                  {channel.detail}
                </a>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {channel.note}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={120}>
          <p className="mt-12 text-sm leading-7 text-muted-foreground">
            {contactPage.hours}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {contactPage.formNote}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/login">
              <Button>Admin Portal</Button>
            </Link>
            <Link href="/reseller/login">
              <Button variant="secondary">Reseller Portal</Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </SitePage>
  );
}
