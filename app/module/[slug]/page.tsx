import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ModuleProgress from "@/components/ModuleProgress";
import { loadModule, listModuleSlugs } from "@/lib/modules";
import { de } from "@/lib/i18n/messages/de";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await listModuleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = await loadModule(slug);
  if (!mod) return { title: "Typ2-Kompass" };
  return {
    title: `${mod.title} — Typ2-Kompass`,
    description: mod.summary,
    openGraph: {
      title: `${mod.title} — Typ2-Kompass`,
      description: mod.summary,
      locale: mod.locale === "de" ? "de_DE" : "en_US",
      type: "article",
    },
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = await loadModule(slug);
  if (!mod) notFound();

  const t = de.modulePage;

  return (
    <>
      <Nav />

      <article className="mx-auto max-w-2xl px-6 pb-16 pt-10 sm:pt-16">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-kompass-accent hover:text-kompass-accentDark"
        >
          <span aria-hidden>←</span>
          {t.backToOverview}
        </Link>

        <header className="mb-8">
          <h1 className="mb-3 text-3xl font-bold leading-tight text-kompass-ink sm:text-4xl">
            {mod.title}
          </h1>
          <p className="mb-4 text-lg leading-relaxed text-slate-600">{mod.summary}</p>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            {t.readingTimePrefix} {mod.readingMinutes} {t.readingTimeSuffix}
          </p>
        </header>

        <div
          className="module-content prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-kompass-ink prose-h2:mt-10 prose-h2:text-2xl prose-p:leading-relaxed prose-li:leading-relaxed prose-blockquote:border-l-kompass-accent prose-blockquote:text-slate-600 prose-a:text-kompass-accent hover:prose-a:text-kompass-accentDark"
          dangerouslySetInnerHTML={{ __html: mod.bodyHtml }}
        />

        {mod.medicalDisclaimer && (
          <p className="mt-10 rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {t.medicalDisclaimer}
          </p>
        )}

        {mod.sources.length > 0 && (
          <section className="mt-10 border-t border-slate-100 pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
              {t.sourcesHeading}
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {mod.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-kompass-accent hover:text-kompass-accentDark"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ModuleProgress slug={mod.slug} />
      </article>

      <Footer />
    </>
  );
}
