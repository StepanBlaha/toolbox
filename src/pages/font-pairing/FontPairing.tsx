import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Shuffle, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./FontPairing.module.css";

type FontCategory = "sans-serif" | "serif" | "display" | "handwriting" | "monospace";

interface FontEntry {
  name: string;
  category: FontCategory;
}

const FONTS: FontEntry[] = [
  // sans-serif
  { name: "Inter", category: "sans-serif" },
  { name: "Roboto", category: "sans-serif" },
  { name: "Open Sans", category: "sans-serif" },
  { name: "Lato", category: "sans-serif" },
  { name: "Montserrat", category: "sans-serif" },
  { name: "Poppins", category: "sans-serif" },
  { name: "Raleway", category: "sans-serif" },
  { name: "Nunito", category: "sans-serif" },
  { name: "Nunito Sans", category: "sans-serif" },
  { name: "Work Sans", category: "sans-serif" },
  { name: "Source Sans 3", category: "sans-serif" },
  { name: "Noto Sans", category: "sans-serif" },
  { name: "Rubik", category: "sans-serif" },
  { name: "Manrope", category: "sans-serif" },
  { name: "DM Sans", category: "sans-serif" },
  { name: "Mulish", category: "sans-serif" },
  { name: "Karla", category: "sans-serif" },
  { name: "Barlow", category: "sans-serif" },
  { name: "Archivo", category: "sans-serif" },
  { name: "Space Grotesk", category: "sans-serif" },
  { name: "Sora", category: "sans-serif" },
  { name: "Outfit", category: "sans-serif" },
  { name: "Plus Jakarta Sans", category: "sans-serif" },
  { name: "Figtree", category: "sans-serif" },
  { name: "Lexend", category: "sans-serif" },
  { name: "Red Hat Display", category: "sans-serif" },
  { name: "Public Sans", category: "sans-serif" },
  { name: "Albert Sans", category: "sans-serif" },
  { name: "Onest", category: "sans-serif" },
  { name: "Hanken Grotesk", category: "sans-serif" },
  { name: "Instrument Sans", category: "sans-serif" },
  { name: "Schibsted Grotesk", category: "sans-serif" },
  { name: "Geist", category: "sans-serif" },
  { name: "Libre Franklin", category: "sans-serif" },
  { name: "Josefin Sans", category: "sans-serif" },
  { name: "Comfortaa", category: "sans-serif" },
  { name: "Quicksand", category: "sans-serif" },
  { name: "Chivo", category: "sans-serif" },
  { name: "Cabin", category: "sans-serif" },
  { name: "Catamaran", category: "sans-serif" },
  { name: "Assistant", category: "sans-serif" },
  { name: "Heebo", category: "sans-serif" },
  { name: "Hind", category: "sans-serif" },
  { name: "Overpass", category: "sans-serif" },
  { name: "Exo 2", category: "sans-serif" },
  { name: "Kanit", category: "sans-serif" },
  { name: "Prompt", category: "sans-serif" },
  { name: "Saira", category: "sans-serif" },
  { name: "Signika", category: "sans-serif" },
  { name: "Maven Pro", category: "sans-serif" },
  { name: "Asap", category: "sans-serif" },
  { name: "Jost", category: "sans-serif" },
  { name: "Urbanist", category: "sans-serif" },
  { name: "Epilogue", category: "sans-serif" },
  { name: "Be Vietnam Pro", category: "sans-serif" },
  { name: "Readex Pro", category: "sans-serif" },
  { name: "Spline Sans", category: "sans-serif" },
  { name: "Unbounded", category: "sans-serif" },
  { name: "Gabarito", category: "sans-serif" },
  { name: "IBM Plex Sans", category: "sans-serif" },
  { name: "Ubuntu", category: "sans-serif" },
  { name: "PT Sans", category: "sans-serif" },
  { name: "Roboto Condensed", category: "sans-serif" },
  { name: "Bricolage Grotesque", category: "sans-serif" },
  { name: "Alegreya Sans", category: "sans-serif" },
  // serif
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "PT Serif", category: "serif" },
  { name: "Noto Serif", category: "serif" },
  { name: "Source Serif 4", category: "serif" },
  { name: "Bitter", category: "serif" },
  { name: "Crimson Text", category: "serif" },
  { name: "Crimson Pro", category: "serif" },
  { name: "EB Garamond", category: "serif" },
  { name: "Cormorant", category: "serif" },
  { name: "Cormorant Garamond", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "Spectral", category: "serif" },
  { name: "Domine", category: "serif" },
  { name: "Frank Ruhl Libre", category: "serif" },
  { name: "Zilla Slab", category: "serif" },
  { name: "Fraunces", category: "serif" },
  { name: "Newsreader", category: "serif" },
  { name: "Literata", category: "serif" },
  { name: "DM Serif Display", category: "serif" },
  { name: "DM Serif Text", category: "serif" },
  { name: "Marcellus", category: "serif" },
  { name: "Cardo", category: "serif" },
  { name: "Vollkorn", category: "serif" },
  { name: "Alegreya", category: "serif" },
  { name: "Josefin Slab", category: "serif" },
  { name: "Playfair Display SC", category: "serif" },
  { name: "Cinzel", category: "serif" },
  { name: "Philosopher", category: "serif" },
  { name: "Bodoni Moda", category: "serif" },
  { name: "Petrona", category: "serif" },
  { name: "IBM Plex Serif", category: "serif" },
  { name: "Roboto Slab", category: "serif" },
  // display
  { name: "Bebas Neue", category: "display" },
  { name: "Anton", category: "display" },
  { name: "Archivo Black", category: "display" },
  { name: "Righteous", category: "display" },
  { name: "Abril Fatface", category: "display" },
  { name: "Bungee", category: "display" },
  { name: "Fjalla One", category: "display" },
  { name: "Teko", category: "display" },
  { name: "Titan One", category: "display" },
  { name: "Passion One", category: "display" },
  { name: "Staatliches", category: "display" },
  { name: "Alfa Slab One", category: "display" },
  { name: "Ultra", category: "display" },
  // handwriting
  { name: "Pacifico", category: "handwriting" },
  { name: "Lobster", category: "handwriting" },
  { name: "Dancing Script", category: "handwriting" },
  { name: "Caveat", category: "handwriting" },
  { name: "Satisfy", category: "handwriting" },
  { name: "Great Vibes", category: "handwriting" },
  { name: "Sacramento", category: "handwriting" },
  { name: "Kalam", category: "handwriting" },
  { name: "Shadows Into Light", category: "handwriting" },
  { name: "Permanent Marker", category: "handwriting" },
  { name: "Amatic SC", category: "handwriting" },
  { name: "Indie Flower", category: "handwriting" },
  { name: "Patrick Hand", category: "handwriting" },
  { name: "Courgette", category: "handwriting" },
  { name: "Cookie", category: "handwriting" },
  { name: "Parisienne", category: "handwriting" },
  { name: "Yellowtail", category: "handwriting" },
  // monospace
  { name: "JetBrains Mono", category: "monospace" },
  { name: "Fira Code", category: "monospace" },
  { name: "Fira Mono", category: "monospace" },
  { name: "Source Code Pro", category: "monospace" },
  { name: "IBM Plex Mono", category: "monospace" },
  { name: "Space Mono", category: "monospace" },
  { name: "Roboto Mono", category: "monospace" },
  { name: "Inconsolata", category: "monospace" },
  { name: "Ubuntu Mono", category: "monospace" },
];

const FALLBACK_BY_CATEGORY: Record<FontCategory, string> = {
  "sans-serif": "sans-serif",
  serif: "serif",
  display: "sans-serif",
  handwriting: "cursive",
  monospace: "monospace",
};

const DEFAULT_HEADING_TEXT = "Design that speaks for itself";
const DEFAULT_BODY_TEXT =
  "Great typography pairs a distinctive display face with a calm, readable body font. This preview lets you see how the two work together in real sentences, at real sizes, before you commit to them in a project.";

const LINK_ID = "font-pairing-fonts";

function findFont(name: string): FontEntry {
  return FONTS.find((f) => f.name === name) ?? FONTS[0];
}

function toFontUrlName(family: string): string {
  return family.trim().replace(/\s+/g, "+");
}

function buildGoogleFontsHref(headingFont: string, bodyFont: string): string {
  const heading = toFontUrlName(headingFont);
  const body = toFontUrlName(bodyFont);
  if (headingFont === bodyFont) {
    return `https://fonts.googleapis.com/css2?family=${heading}:wght@400;500;600;700&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${heading}:wght@400;600;700&family=${body}:wght@400;500;600;700&display=swap`;
}

interface FontPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (name: string) => void;
}

function FontPicker({ id, label, value, onChange }: FontPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? FONTS.filter((f) => f.name.toLowerCase().includes(q))
      : FONTS;
    return list.slice(0, 40);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectFont(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = matches[highlight];
      if (picked) selectFont(picked.name);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className={styles.field} ref={rootRef}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.pickerWrap}>
        <input
          id={id}
          type="text"
          className={styles.pickerInput}
          placeholder="Search fonts…"
          value={open ? query : value}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setHighlight(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          autoComplete="off"
        />
        {open && (
          <ul className={styles.pickerList} id={`${id}-listbox`} role="listbox">
            {matches.length === 0 && (
              <li className={styles.pickerEmpty}>No fonts found</li>
            )}
            {matches.map((f, i) => (
              <li
                key={f.name}
                role="option"
                aria-selected={f.name === value}
                className={clsx(
                  styles.pickerOption,
                  i === highlight && styles.pickerOptionActive,
                  f.name === value && styles.pickerOptionSelected
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectFont(f.name);
                }}
                onMouseEnter={() => setHighlight(i)}
              >
                <span>{f.name}</span>
                <span className={styles.pickerCategory}>{f.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function FontPairing() {
  const ready = useRevealReady();
  const [headingFont, setHeadingFont] = useState("Playfair Display");
  const [bodyFont, setBodyFont] = useState("Source Sans 3");
  const [headingText, setHeadingText] = useState(DEFAULT_HEADING_TEXT);
  const [bodyText, setBodyText] = useState(DEFAULT_BODY_TEXT);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = buildGoogleFontsHref(headingFont, bodyFont);

    return () => {
      const existing = document.getElementById(LINK_ID);
      if (existing) existing.remove();
    };
  }, [headingFont, bodyFont]);

  function randomize() {
    const nextHeading = FONTS[Math.floor(Math.random() * FONTS.length)].name;
    const nextBody = FONTS[Math.floor(Math.random() * FONTS.length)].name;
    setHeadingFont(nextHeading);
    setBodyFont(nextBody);
  }

  const cssText = useMemo(() => {
    const href = buildGoogleFontsHref(headingFont, bodyFont);
    const headingFallback = FALLBACK_BY_CATEGORY[findFont(headingFont).category];
    const bodyFallback = FALLBACK_BY_CATEGORY[findFont(bodyFont).category];
    return `@import url('${href}');

h1, h2, h3 {
  font-family: '${headingFont}', ${headingFallback};
}

body {
  font-family: '${bodyFont}', ${bodyFallback};
}`;
  }, [headingFont, bodyFont]);

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const headingFallback = FALLBACK_BY_CATEGORY[findFont(headingFont).category];
  const bodyFallback = FALLBACK_BY_CATEGORY[findFont(bodyFont).category];

  return (
    <Frame wide>
      <SectionHeading title="Font Pairing" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div className={styles.previewLabels}>
            <span className={styles.previewLabel}>
              Heading: <b>{headingFont}</b>
            </span>
            <span className={styles.previewLabel}>
              Body: <b>{bodyFont}</b>
            </span>
          </div>
          <div
            className={styles.previewHeading}
            style={{ fontFamily: `'${headingFont}', ${headingFallback}`, fontWeight: 700 }}
          >
            {headingText}
          </div>
          <div
            className={styles.previewBody}
            style={{ fontFamily: `'${bodyFont}', ${bodyFallback}`, fontWeight: 400 }}
          >
            {bodyText}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <FontPicker
            id="headingFont"
            label="Heading font"
            value={headingFont}
            onChange={setHeadingFont}
          />
          <FontPicker
            id="bodyFont"
            label="Body font"
            value={bodyFont}
            onChange={setBodyFont}
          />

          <button type="button" className={styles.randomBtn} onClick={randomize}>
            <Shuffle size={13} />
            Randomize both
          </button>

          <div className={styles.field}>
            <label htmlFor="headingText">Heading text</label>
            <input
              id="headingText"
              type="text"
              className={styles.textInput}
              value={headingText}
              onChange={(e) => setHeadingText(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="bodyText">Body text</label>
            <textarea
              id="bodyText"
              className={styles.textareaInput}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>CSS output</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copy}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{cssText}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export { FontPairing };
