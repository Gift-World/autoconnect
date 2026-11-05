import { Link } from "@tanstack/react-router";
import { ArrowUpRight, FileCheck2, LifeBuoy, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Section = { title: string; body: string };

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Calm long-form layout for policy pages: a plain header, a sticky table of
 * contents on desktop and a readable max-w-prose body.
 * No overflow-hidden ancestors, so the sticky contents column works.
 */
export function PublicPolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
}) {
  const items = sections.map((section, index) => ({
    ...section,
    id: `${index + 1}-${slug(section.title)}`,
    number: String(index + 1).padStart(2, "0"),
  }));

  return (
    <main className="bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-4 py-14 sm:px-6 sm:py-20">
          <p className="brand-kicker text-muted-foreground">{eyebrow}</p>
          <h1 className="font-brand mt-4 max-w-4xl text-3xl text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-prose text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {intro}
          </p>
          <p className="mt-6 inline-flex rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            Last updated: 24 August 2026. Obtain local legal review before public launch.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        {/* Table of contents: inline on mobile, sticky on desktop */}
        <nav aria-label="On this page" className="lg:self-start lg:sticky lg:top-24">
          <p className="brand-kicker text-muted-foreground">On this page</p>
          <ol className="mt-4 space-y-1 border-l border-border">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="-ml-px flex min-h-11 items-center gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground"
                >
                  <span className="font-mono text-xs text-muted-foreground/70">{item.number}</span>
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-prose">
          {items.map((item) => (
            <section
              key={item.id}
              id={item.id}
              aria-labelledby={`${item.id}-title`}
              className="scroll-mt-24 border-b border-border py-8 first:pt-0 last:border-b-0"
            >
              <p className="font-mono text-xs text-muted-foreground">{item.number}</p>
              <h2 id={`${item.id}-title`} className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {item.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-foreground/80">{item.body}</p>
            </section>
          ))}

          <div className="mt-10 rounded-3xl border border-border bg-card p-6">
            <p className="font-bold text-foreground">Related</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Action icon={ShieldCheck} label="Trust center" to="/trust" />
              <Action icon={FileCheck2} label="Payment process" to="/how-payments-work" />
              <Action icon={LifeBuoy} label="Get support" to="/support" />
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

function Action({ icon: Icon, label, to }: { icon: LucideIcon; label: string; to: string }) {
  return (
    <Link
      to={to as never}
      className="flex min-h-12 items-center justify-between gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:border-foreground/40"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-ac-accent" />
        {label}
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
