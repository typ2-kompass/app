import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const PRODUCTION_SITE = process.env.PUBLIC_SITE_URL ?? 'https://typ2-kompass.de';

export default defineConfig({
  site: PRODUCTION_SITE,
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
  vite: {
    server: { fs: { strict: true } },
  },
});
