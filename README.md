# toolbox

A collection of **55+ design & developer utilities** — CSS generators, color tools, image tools, and IT utilities. Fast, free, and **fully client-side**: nothing you paste, upload, or generate ever leaves your browser.

Built to match the visual language of [stepanblaha.com](https://www.stepanblaha.com) — a minimal, monochrome, editorial style with a custom cursor, scroll reveals, and first-class dark mode.

## Tools

**CSS generators** — Box Shadow · Text Shadow · Gradient · Gradient Text · Gradient Border · Grainy Gradient · Mesh Gradient · Noise Texture · Pattern · Glassmorphism · Neumorphism · Clip-path · Border Radius · Scrollbar · CSS Animation (keyframes) · CSS Loaders · 3D Transform · Shape · Blob · SVG Waves · CSS Filters · SVG→CSS

**Color & type** — Contrast Checker · Color Converter (HEX/RGB/HSL/OKLCH) · Color Palette Generator · Palette Extractor · Font Pairing (138 Google fonts) · Type Scale

**Image** — Background Remover (in-browser ML) · Image Compressor · Duotone · Favicon Generator · OG Image Generator

**Dev & IT utilities** — JSON Formatter · Base64 · Hash (SHA-1/256/384/512) · JWT Decoder · AES Encrypt (AES-GCM) · UUID · Password Generator · Regex Tester · Diff Checker · Cron Helper · Timestamp Converter · Base Converter · Case Converter · URL Tools · Unit Converter · Meta Tag Generator · Text Stats · Lorem Ipsum · QR Code

## Stack

- **React 19** + **TypeScript** + **Vite**
- **react-router-dom** (routes are code-split with `React.lazy`)
- **framer-motion** for reveals & the custom cursor
- **CSS Modules** per component (no CSS framework) with a shared design-token layer in `src/index.css`
- Client-only libraries where needed: `@imgly/background-removal`, `qr-code-styling`, `qrcode`

## Develop

```bash
npm install
npm run dev      # start Vite on http://localhost:5173
npm run build    # tsc + vite build + per-route SEO prerender → dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  components/<Name>/       Shared shell: Frame, TopNav, Cursor, GridFrame,
                          Preloader, SiteFooter, SectionHeading, HatchDivider, ToolCard
  pages/<tool>/           One folder per tool: <Tool>.tsx + <Tool>.module.css
  pages/landing/          Tool grid
  pages/not-found/        404 page
  data/tools.ts           Single source of truth — the tool registry (add tools here)
  lib/reveal.ts           framer-motion reveal variants + shared EASE
  context/                RevealReadyContext (gates reveals on the preloader)
  hooks/                  useTheme (dark mode + circular view-transition)
scripts/seo-prerender.mjs Post-build: writes a static <head> per tool route
public/                   favicons, manifest.json, robots.txt, sitemap.xml, og.png
```

### Adding a tool

1. Create `src/pages/<slug>/<Component>.tsx` (+ `.module.css`) — wrap it in `<Frame wide>` with a `<SectionHeading>`, use the design tokens, and add the reveal wrapper.
2. Register it in `src/data/tools.ts` (slug, name, description, icon, path).
3. Add a lazy route in `src/App.tsx`.

The sitemap, per-route SEO prerender, and landing grid all derive from `data/tools.ts` automatically.

## SEO & deployment

- **Per-route metadata**: `npm run build` prerenders a static `dist/<route>/index.html` for every tool with its own `<title>`, description, canonical, and Open Graph/Twitter tags — so crawlers and social scrapers (which don't run the SPA's JS) get correct per-page metadata. In-app navigation keeps the head in sync via a small `usePageSeo` hook.
- **Host configs** included for **Vercel** (`vercel.json`), **Netlify** (`netlify.toml`), and **Cloudflare Pages** (`public/_redirects`) — SPA fallback + cache headers.
- Ships `robots.txt`, `sitemap.xml`, `manifest.json`, and a full favicon/OG image set.

> Before deploying, replace the placeholder domain `toolbox.stepanblaha.com` with your real one in `index.html`, `src/App.tsx` (`SITE_URL`), `scripts/seo-prerender.mjs`, `public/robots.txt`, and `public/sitemap.xml`.

## License

MIT © Štěpán Bláha
