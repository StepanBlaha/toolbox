import { useMemo, useState } from "react";
import { Check, Copy, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./ColorPalette.module.css";

interface Hsl {
  h: number;
  s: number;
  l: number;
}

type Harmony =
  | "Complementary"
  | "Analogous"
  | "Triadic"
  | "Tetradic"
  | "Split-Complementary"
  | "Monochromatic";

const HARMONIES: Harmony[] = [
  "Complementary",
  "Analogous",
  "Triadic",
  "Tetradic",
  "Split-Complementary",
  "Monochromatic",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex);
}

function normalizeHex(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return `#${clean
      .split("")
      .map((c) => c + c)
      .join("")}`.toUpperCase();
  }
  return `#${clean}`.toUpperCase();
}

function hexToHsl(hex: string): Hsl {
  const clean = normalizeHex(hex).replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (value: number) =>
    Math.round(clamp((value + m) * 255, 0, 255))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function buildPalette(base: Hsl, harmony: Harmony): Hsl[] {
  switch (harmony) {
    case "Complementary":
      return [base, { ...base, h: base.h + 180 }];
    case "Analogous":
      return [
        { ...base, h: base.h - 30 },
        base,
        { ...base, h: base.h + 30 },
        { ...base, h: base.h + 60 },
      ];
    case "Triadic":
      return [base, { ...base, h: base.h + 120 }, { ...base, h: base.h + 240 }];
    case "Tetradic":
      return [
        base,
        { ...base, h: base.h + 90 },
        { ...base, h: base.h + 180 },
        { ...base, h: base.h + 270 },
      ];
    case "Split-Complementary":
      return [
        base,
        { ...base, h: base.h + 150 },
        { ...base, h: base.h + 210 },
      ];
    case "Monochromatic":
      return [
        { ...base, l: clamp(base.l - 30, 5, 95) },
        { ...base, l: clamp(base.l - 15, 5, 95) },
        base,
        { ...base, l: clamp(base.l + 15, 5, 95) },
        { ...base, l: clamp(base.l + 30, 5, 95) },
      ];
    default:
      return [base];
  }
}

function randomPleasantHex(): string {
  const h = Math.round(Math.random() * 360);
  const s = 55 + Math.round(Math.random() * 25);
  const l = 45 + Math.round(Math.random() * 15);
  return hslToHex({ h, s, l });
}

export function ColorPalette() {
  const ready = useRevealReady();
  const [baseHex, setBaseHex] = useState("#3B82F6");
  const [hexInput, setHexInput] = useState("#3B82F6");
  const [harmony, setHarmony] = useState<Harmony>("Complementary");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const palette = useMemo(() => {
    const base = hexToHsl(baseHex);
    return buildPalette(base, harmony).map((c) => hslToHex(c));
  }, [baseHex, harmony]);

  function handleColorInput(value: string) {
    setBaseHex(value.toUpperCase());
    setHexInput(value.toUpperCase());
  }

  function handleHexInput(value: string) {
    setHexInput(value);
    if (isValidHex(value)) {
      setBaseHex(normalizeHex(value));
    }
  }

  function randomizeBase() {
    const hex = randomPleasantHex();
    setBaseHex(hex);
    setHexInput(hex);
  }

  async function copySwatch(hex: string) {
    await navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(palette.join(", "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Color Palette Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.left} variants={revealItem}>
          <div className={styles.baseRow}>
            <span
              className={styles.baseSwatch}
              style={{ background: baseHex }}
            />
            <div className={styles.baseFields}>
              <div className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={isValidHex(baseHex) ? baseHex : "#000000"}
                  onChange={(e) => handleColorInput(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={hexInput}
                  onChange={(e) => handleHexInput(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <button
                type="button"
                className={styles.randomBtn}
                onClick={randomizeBase}
              >
                <Shuffle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Randomize base
              </button>
            </div>
          </div>

          <div className={styles.harmonyRow}>
            {HARMONIES.map((h) => (
              <button
                key={h}
                type="button"
                className={clsx(
                  styles.harmonyChip,
                  harmony === h && styles.harmonyChipActive
                )}
                onClick={() => setHarmony(h)}
              >
                {h}
              </button>
            ))}
          </div>

          <div className={styles.previewStrip}>
            {palette.map((hex, idx) => (
              <span
                key={`${hex}-${idx}`}
                className={styles.previewChip}
                style={{ background: hex }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.right} variants={revealItem}>
          <div className={styles.grid}>
            {palette.map((hex, idx) => (
              <button
                key={`${hex}-${idx}`}
                type="button"
                className={styles.swatchCard}
                onClick={() => copySwatch(hex)}
                title={`Copy ${hex}`}
              >
                <span className={styles.swatchColor} style={{ background: hex }} />
                <span className={styles.swatchFooter}>
                  <span className={styles.swatchHex}>{hex}</span>
                  <span className={styles.swatchCopyIcon}>
                    {copiedHex === hex ? <Check size={13} /> : <Copy size={13} />}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={clsx(styles.copyAllBtn, copiedAll && styles.copied)}
            onClick={copyAll}
          >
            {copiedAll ? <Check size={13} /> : <Copy size={13} />}
            {copiedAll ? "Copied" : "Copy all"}
          </button>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default ColorPalette;
