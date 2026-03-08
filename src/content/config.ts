// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const writeups = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    date:        z.date(),
    category:    z.string(),
    catColor:    z.enum(['cyan','green','orange','red','purple','gold']).default('cyan'),
    difficulty:  z.enum(['easy','medium','hard','insane']),
    tags:        z.array(z.string()),
    event:       z.string().optional(),
    readTime:    z.number().optional(),
    flag:        z.string().optional(),
    featured:    z.boolean().default(false),
    draft:       z.boolean().default(false),
  }),
})

export const collections = { writeups }
