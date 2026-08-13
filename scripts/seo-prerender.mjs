// Post-build SEO step: for every tool route, emit a static
// dist/<path>/index.html whose <head> carries that tool's own title,
// description, canonical, and Open Graph/Twitter tags. Social scrapers and
// crawlers (which don't run the SPA's JS) then get correct per-page metadata,
// while the SPA still boots and renders normally. No prerender browser needed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE_URL = "https://toolbox.stepanblaha.com";

// Read the tool registry straight from the source (name/description/path).
const toolsSrc = readFileSync(resolve(root, "src/data/tools.ts"), "utf8");
const objects = toolsSrc.match(/\{[\s\S]*?\}/g) ?? [];
const tools = objects
  .map((o) => {
    const name = o.match(/name:\s*"([^"]+)"/)?.[1];
    const description = o.match(/description:\s*"([^"]+)"/)?.[1];
    const path = o.match(/path:\s*"([^"]+)"/)?.[1];
    return name && description && path ? { name, description, path } : null;
  })
  .filter(Boolean);

const template = readFileSync(resolve(root, "dist/index.html"), "utf8");
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Replace the content of a <meta>/<link> tag identified by an attribute
// key/value, tolerating arbitrary whitespace/newlines between attributes.
function replaceAttr(html, tagAttr, tagVal, contentAttr, newVal) {
  const re = new RegExp(
    `(<(?:meta|link)\\s+${tagAttr}="${tagVal}"\\s+${contentAttr}=")[^"]*(")`,
    "i"
  );
  return html.replace(re, `$1${esc(newVal)}$2`);
}

function pageHtml(title, description, url) {
  let html = template.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${esc(title)}</title>`
  );
  html = replaceAttr(html, "name", "description", "content", description);
  html = replaceAttr(html, "rel", "canonical", "href", url);
  html = replaceAttr(html, "property", "og:title", "content", title);
  html = replaceAttr(html, "property", "og:description", "content", description);
  html = replaceAttr(html, "property", "og:url", "content", url);
  html = replaceAttr(html, "name", "twitter:title", "content", title);
  html = replaceAttr(html, "name", "twitter:description", "content", description);
  return html;
}

let count = 0;
for (const t of tools) {
  const title = `${t.name} · toolbox`;
  const url = SITE_URL + t.path;
  const outDir = resolve(root, "dist" + t.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "index.html"), pageHtml(title, t.description, url));
  count++;
}

console.log(`[seo-prerender] wrote ${count} per-route HTML files`);
