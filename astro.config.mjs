// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './src/config.js';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',

  integrations: [
    preact(),
    sitemap({
      // Split large sitemaps automatically; exclude nothing — every page earns its place.
      entryLimit: 5000,
    }),
  ],

  build: {
    format: 'directory',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare()
});