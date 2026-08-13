import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./ColorConverter.module.css";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

interface Oklch {
  l: number;
  c: number;
  h: number;
}

function normalizeHex(value: string): string | null {
  const cleaned = value.trim();
  const short = /^#?([0-9a-fA-F]{3})$/;
  const long = /^#?([0-9a-fA-F]{6})$/;

  const shortMatch = cleaned.match(short);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const longMatch = cleaned.match(long);
  if (longMatch) {
    return `#${longMatch[1]}`.toLowerCase();
  }

  return null;
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function alphaToHex(alpha: number): string {
  const a = Math.round(clamp(alpha, 0, 1) * 255);
  return a.toString(16).padStart(2, "0");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s: s * 100, l: l * 100 };
}

// sRGB channel (0-255) -> linear light (0-1)
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Accurate sRGB -> OKLCH via linear RGB -> OKLab, using the standard
// Björn Ottosson matrices.
function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L * 100, c: C, h: C < 0.0001 ? 0 : H };
}

interface ConversionRow {
  key: string;
  label: string;
  value: string;
}

export function ColorConverter() {
  const ready = useRevealReady();
  const [hex, setHex] = useState("#3b82f6");
  const [draft, setDraft] = useState("#3b82f6");
  const [alpha, setAlpha] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function commitDraft(next: string) {
    setDraft(next);
    const normalized = normalizeHex(next);
    if (normalized) {
      setHex(normalized);
    }
  }

  function setBoth(next: string) {
    const normalized = normalizeHex(next) ?? next;
    setHex(normalized);
    setDraft(normalized);
  }

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const oklch = useMemo(() => rgbToOklch(rgb), [rgb]);

  const hex8 = useMemo(() => `${rgbToHex(rgb)}${alphaToHex(alpha)}`, [rgb, alpha]);
  const hasAlpha = alpha < 1;

  const rgbText = useMemo(() => {
    const base = `rgb(${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)}`;
    return hasAlpha ? `${base} / ${alpha.toFixed(2)})` : `${base})`;
  }, [rgb, alpha, hasAlpha]);

  const hslText = useMemo(() => {
    const base = `hsl(${hsl.h.toFixed(0)} ${hsl.s.toFixed(0)}% ${hsl.l.toFixed(0)}%`;
    return hasAlpha ? `${base} / ${alpha.toFixed(2)})` : `${base})`;
  }, [hsl, alpha, hasAlpha]);

  const oklchText = useMemo(() => {
    const base = `oklch(${oklch.l.toFixed(1)}% ${oklch.c.toFixed(3)} ${oklch.h.toFixed(2)}`;
    return hasAlpha ? `${base} / ${alpha.toFixed(2)})` : `${base})`;
  }, [oklch, alpha, hasAlpha]);

  const rows: ConversionRow[] = [
    { key: "hex", label: "HEX", value: rgbToHex(rgb) },
    { key: "hex8", label: "HEX8", value: hex8 },
    { key: "rgb", label: "RGB", value: rgbText },
    { key: "hsl", label: "HSL", value: hslText },
    { key: "oklch", label: "OKLCH", value: oklchText },
  ];

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
  }

  const swatchRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

  return (
    <Frame wide>
      <SectionHeading title="Color Converter" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.side} variants={revealItem}>
          <div className={styles.swatchWrap}>
            <div className={styles.checkerboard} />
            <div className={styles.swatch} style={{ background: swatchRgba }} />
          </div>

          <div className={styles.field}>
            <label htmlFor="colorHex">Color</label>
            <div className={styles.colorRow}>
              <input
                id="colorHex"
                type="color"
                className={styles.colorInput}
                value={hex}
                onChange={(e) => setBoth(e.target.value)}
              />
              <input
                type="text"
                className={styles.textInput}
                value={draft}
                onChange={(e) => commitDraft(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="alpha">
              Alpha <span className={styles.fieldValue}>{alpha.toFixed(2)}</span>
            </label>
            <input
              id="alpha"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            />
          </div>
        </motion.div>

        <motion.div className={styles.rows} variants={revealItem}>
          {rows.map((row) => (
            <div className={styles.row} key={row.key}>
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowValue}>{row.value}</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copiedKey === row.key && styles.copied)}
                onClick={() => copy(row.key, row.value)}
                aria-label={`Copy ${row.label}`}
              >
                {copiedKey === row.key ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === row.key ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default ColorConverter;
