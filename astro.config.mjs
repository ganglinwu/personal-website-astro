import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import AutoImport from "astro-auto-import";
import { defineConfig } from "astro/config";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import config from "./src/config/config.json";

const base_path = config?.site?.base_path ?? "/";
const trailing_slash = config?.site?.trailing_slash ? "always" : "never";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://ganglin.net",
  base: base_path,
  trailingSlash: trailing_slash,
  image: {
  },
  integrations: [
    react(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),
    mdx(),
    sitemap(),
  ],
  markdown: {
    rehypePlugins: [rehypeKatex],
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
      remarkMath,
    ],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
    extendDefaultPlugins: true,
  },
});
