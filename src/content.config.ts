import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        published: z.boolean().optional().default(true),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
    }),
});

const projects = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: z.object({
        title: z.string(),
        shortDesc: z.string(),
        date: z.coerce.date(),
        tech: z.string(),
        codeLink: z.string().optional(),
        webHost: z.string().optional(),
        selfHost: z.string().optional(),
        dockerLink: z.string().optional(),
        organisation: z.string().optional(),
        organisationUrl: z.string().optional(),
        status: z.string().optional(),
        featured: z.boolean().optional().default(false),
        published: z.boolean().optional().default(true),
    }),
});

export const collections = { blog, projects };
