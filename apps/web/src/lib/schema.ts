import { SITE, absoluteUrl } from './site';

type FaqItem = { q: string; a: string };

type ArticleSchemaInput = {
  type: 'Article' | 'MedicalScholarlyArticle';
  headline: string;
  description: string;
  slug: string;
  datePublished: Date;
  dateModified: Date;
  inLanguage?: string;
  heroImage?: string;
  authorName?: string;
};

export function buildArticleSchema(input: ArticleSchemaInput) {
  const url = absoluteUrl(input.slug);
  return {
    '@context': 'https://schema.org',
    '@type': input.type,
    headline: input.headline,
    description: input.description,
    inLanguage: input.inLanguage ?? SITE.defaultLocale,
    datePublished: input.datePublished.toISOString(),
    dateModified: input.dateModified.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    image: input.heroImage ? absoluteUrl(input.heroImage) : undefined,
    author: {
      '@type': 'Organization',
      name: input.authorName ?? SITE.author.name,
      url: SITE.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SITE.publisher.logo),
      },
    },
  };
}

export function buildFaqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };
}

export function buildMedicalConditionSchema(name: string, code?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    name,
    ...(code
      ? {
          code: {
            '@type': 'MedicalCode',
            codeValue: code,
            codingSystem: 'ICD-10',
          },
        }
      : {}),
  };
}
