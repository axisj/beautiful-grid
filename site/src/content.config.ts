import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';


const comparisons = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/comparisons" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    targetProduct: z.string(),
    locale: z.enum(['ko', 'en']),
    canonicalPath: z.string(),
    lastVerifiedAt: z.string(),
    summary: z.string(),
    disclaimer: z.string().optional(),
    order: z.number().optional(),
  })
});

const learn = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/learn" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum([
      'getting-started',
      'data-and-columns',
      'interaction',
      'advanced',
      'styling-and-accessibility',
    ]),
    order: z.number().int().nonnegative(),
    locale: z.enum(['ko', 'en']),
    canonicalPath: z.string(),
    demoId: z.string().optional(),
    features: z.array(z.string()),
    relatedGuides: z.array(z.string()).default([]),
    relatedApi: z.array(z.string()).default([]),
    lastReviewedAt: z.string(),
    indexable: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

export const collections = { comparisons, learn };
