import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { ToolCard } from "../../components/ToolCard/ToolCard";
import { tools } from "../../data/tools";
import { revealContainer } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Landing.module.css";

// Query-term aliases so search matches intent, not just the literal name/desc.
// e.g. typing "colour", "rgb" or "opacity" still surfaces the color tools.
const ALIASES: Record<string, string> = {
  colour: "color",
  css: "css style",
  img: "image",
  pic: "image photo",
  photo: "image",
  picture: "image",
  txt: "text",
  rgb: "color convert",
  hex: "color convert",
  hsl: "color convert",
  opacity: "color",
  transparent: "color background",
  rounded: "radius corner",
  crypto: "hash encrypt aes password",
  encrypt: "aes encrypt cipher",
  decode: "base64 jwt decode",
  minify: "json format minify",
  seo: "meta og sitemap",
  social: "og image share",
  animation: "keyframes animate motion loader easing",
  spinner: "loader",
  font: "font type text",
  typography: "font type scale",
  resize: "image compressor resize",
  compress: "image compressor",
  retro: "dither pixel ascii",
  pixel: "dither pixelate ascii",
  emoji: "favicon ascii",
  time: "timestamp cron date",
  date: "timestamp cron",
  regexp: "regex",
  qr: "qr logo",
  gradient: "gradient mesh grainy",
};

function expand(term: string): string[] {
  const t = term.toLowerCase();
  return ALIASES[t] ? [t, ...ALIASES[t].split(" ")] : [t];
}

export function Landing() {
  const ready = useRevealReady();
  const [query, setQuery] = useState("");

  const haystacks = useMemo(
    () =>
      tools.map((t) => ({
        tool: t,
        text: `${t.name} ${t.description} ${t.slug.replace(/-/g, " ")}`.toLowerCase(),
      })),
    []
  );

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return tools;
    const terms = q.split(/\s+/).filter(Boolean);
    return haystacks
      .filter(({ text }) =>
        // every typed term (or one of its aliases) must appear somewhere
        terms.every((term) => expand(term).some((v) => text.includes(v)))
      )
      .map(({ tool }) => tool);
  }, [q, haystacks]);

  const searching = q.length > 0;

  return (
    <Frame>
      <div className={styles.intro}>
        <h1 className={styles.title}>toolbox</h1>
        <p className={styles.subtitle}>
          A small collection of design &amp; dev utilities.
        </p>
      </div>

      <div className={styles.search}>
        <Search size={16} className={styles.searchIcon} strokeWidth={1.9} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search tools - try “gradient”, “color”, “encrypt”…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tools"
        />
        {searching && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      <SectionHeading title="Tools" count={filtered.length} level="h2" />

      {searching ? (
        filtered.length > 0 ? (
          <div className={styles.grid}>
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No tools match “{query}”. Try a different word.
          </p>
        )
      ) : (
        <motion.div
          className={styles.grid}
          variants={revealContainer(0.03)}
          initial="hidden"
          animate={ready ? "show" : "hidden"}
        >
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </motion.div>
      )}
    </Frame>
  );
}
