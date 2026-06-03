import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().max(70),
    metaDescription: z.string().max(170),
    slug: z.string(),
    primaryKeyword: z.string().optional(),
    pillar: z.boolean().default(false),
    datePublished: z.coerce.date(),
    dateModified: z.coerce.date(),
    nextReviewDate: z.coerce.date().optional(),
    heroAlt: z.string(),
    schemaType: z.enum(['Article', 'MedicalScholarlyArticle']).default('Article'),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .optional(),
    medicalConditions: z
      .array(
        z.object({
          name: z.string(),
          code: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { articles };
