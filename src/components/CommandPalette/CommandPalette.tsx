import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { tools } from "../../data/tools";
import { prefersReducedMotion } from "../../lib/motionPref";
import styles from "./CommandPalette.module.css";

// Mirrors the synonym map in Landing.tsx so "⌘K" search understands intent,
// not just literal substrings (e.g. "rgb" should surface color tools).
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

const MAX_RESULTS = 10;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const reduced = prefersReducedMotion();

  const haystacks = useMemo(
    () =>
      tools.map((t) => ({
        tool: t,
        text: `${t.name} ${t.description} ${t.slug.replace(/-/g, " ")}`.toLowerCase(),
      })),
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools.slice(0, MAX_RESULTS);
    const terms = q.split(/\s+/).filter(Boolean);
    return haystacks
      .filter(({ text }) =>
        terms.every((term) => expand(term).some((v) => text.includes(v)))
      )
      .map(({ tool }) => tool)
      .slice(0, MAX_RESULTS);
  }, [query, haystacks]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // Global Cmd+K / Ctrl+K toggle, plus Esc to close.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
      close();
    },
    [navigate, close]
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const tool = results[activeIndex];
      if (tool) go(tool.path);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          role="presentation"
        >
          <motion.div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: reduced ? 0 : -12, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8, scale: reduced ? 1 : 0.98 }}
            transition={{ duration: reduced ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.searchRow}>
              <Search size={16} className={styles.searchIcon} strokeWidth={1.9} />
              <input
                ref={inputRef}
                type="text"
                className={styles.input}
                placeholder="Search tools…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                aria-label="Search tools"
                aria-activedescendant={
                  results[activeIndex] ? `cmdk-item-${results[activeIndex].slug}` : undefined
                }
                role="combobox"
                aria-expanded="true"
                aria-controls="cmdk-list"
              />
              <kbd className={styles.esc}>esc</kbd>
            </div>

            <div className={styles.list} ref={listRef} id="cmdk-list" role="listbox">
              {results.length === 0 ? (
                <p className={styles.empty}>No tools found.</p>
              ) : (
                results.map((tool, i) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.slug}
                      id={`cmdk-item-${tool.slug}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={i === activeIndex ? `${styles.item} ${styles.itemActive}` : styles.item}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(tool.path)}
                    >
                      <span className={styles.itemIcon}>
                        <Icon size={16} strokeWidth={1.75} />
                      </span>
                      <span className={styles.itemText}>
                        <span className={styles.itemName}>{tool.name}</span>
                        <span className={styles.itemDesc}>{tool.description}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
