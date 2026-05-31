import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

const CONTENT_ROOT = path.join(process.cwd(), "content", "modules");

export type ModuleSource = {
  label: string;
  url: string;
};

export type ModuleFrontmatter = {
  slug: string;
  title: string;
  summary: string;
  locale: Locale;
  readingMinutes: number;
  tags: string[];
  sources: ModuleSource[];
  medicalDisclaimer: boolean;
  order: number;
};

export type Module = ModuleFrontmatter & {
  bodyHtml: string;
};

export type ModuleSummary = Pick<
  ModuleFrontmatter,
  "slug" | "title" | "summary" | "locale" | "readingMinutes" | "tags" | "order"
>;

function parseFrontmatter(raw: Record<string, unknown>, fallbackSlug: string): ModuleFrontmatter {
  const slug = typeof raw.slug === "string" ? raw.slug : fallbackSlug;
  const title = typeof raw.title === "string" ? raw.title : slug;
  const summary = typeof raw.summary === "string" ? raw.summary : "";
  const locale: Locale = raw.locale === "en" ? "en" : DEFAULT_LOCALE;
  const readingMinutes =
    typeof raw.readingMinutes === "number" && Number.isFinite(raw.readingMinutes)
      ? Math.max(1, Math.round(raw.readingMinutes))
      : 5;
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [];
  const sources: ModuleSource[] = Array.isArray(raw.sources)
    ? raw.sources
        .map((s) => {
          if (s && typeof s === "object" && "label" in s && "url" in s) {
            const label = (s as { label: unknown }).label;
            const url = (s as { url: unknown }).url;
            if (typeof label === "string" && typeof url === "string") {
              return { label, url };
            }
          }
          return null;
        })
        .filter((s): s is ModuleSource => s !== null)
    : [];
  const medicalDisclaimer = raw.medicalDisclaimer !== false;
  const order = typeof raw.order === "number" ? raw.order : 0;

  return {
    slug,
    title,
    summary,
    locale,
    readingMinutes,
    tags,
    sources,
    medicalDisclaimer,
    order,
  };
}

async function renderMarkdown(markdown: string): Promise<string> {
  const file = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(markdown);
  return String(file);
}

export async function listModuleSlugs(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(CONTENT_ROOT);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""))
    .sort();
}

export async function listModules(): Promise<ModuleSummary[]> {
  const slugs = await listModuleSlugs();
  const modules = await Promise.all(slugs.map((slug) => loadModuleFrontmatter(slug)));
  return modules
    .filter((m): m is ModuleFrontmatter => m !== null)
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      slug: m.slug,
      title: m.title,
      summary: m.summary,
      locale: m.locale,
      readingMinutes: m.readingMinutes,
      tags: m.tags,
      order: m.order,
    }));
}

async function loadModuleFrontmatter(slug: string): Promise<ModuleFrontmatter | null> {
  const filePath = path.join(CONTENT_ROOT, `${slug}.md`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
  const { data } = matter(raw);
  return parseFrontmatter(data, slug);
}

export async function loadModule(slug: string): Promise<Module | null> {
  const filePath = path.join(CONTENT_ROOT, `${slug}.md`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const frontmatter = parseFrontmatter(data, slug);
  const stripped = stripClinicalReviewComments(content);
  const bodyHtml = await renderMarkdown(stripped);
  return { ...frontmatter, bodyHtml };
}

function stripClinicalReviewComments(markdown: string): string {
  return markdown.replace(/<!--\s*CLINICAL-REVIEW[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n");
}
