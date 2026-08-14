import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./DesignTokens.module.css";

interface Hsl {
  h: number;
  s: number;
  l: number;
}

interface ColorStep {
  step: number;
  hex: string;
}

type Format = "CSS" | "JSON" | "Tailwind";

const FORMATS: Format[] = ["CSS", "JSON", "Tailwind"];

const COLOR_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const RATIOS = [1.2, 1.25, 1.333] as const;
type Ratio = (typeof RATIOS)[number];

const FONT_SCALE_KEYS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"] as const;
const FONT_SCALE_EXPONENTS: Record<(typeof FONT_SCALE_KEYS)[number], number> = {
  xs: -2,
  sm: -1,
  base: 0,
  lg: 1,
  xl: 2,
  "2xl": 3,
  "3xl": 4,
};

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

/** Builds an 11-step 50..950 tint/shade scale from a base color, keeping
 *  hue roughly fixed, ramping lightness so the 500 step matches the base
 *  color, and gently desaturating toward the light/dark extremes. */
function buildColorScale(base: Hsl): ColorStep[] {
  const LIGHT_MAX = 97;
  const DARK_MIN = 9;

  return COLOR_STEPS.map((step, idx) => {
    const t = idx / (COLOR_STEPS.length - 1);
    let l: number;
    if (t <= 0.5) {
      l = LIGHT_MAX + (base.l - LIGHT_MAX) * (t / 0.5);
    } else {
      l = base.l + (DARK_MIN - base.l) * ((t - 0.5) / 0.5);
    }
    const distFromMid = Math.abs(t - 0.5) * 2;
    const s = clamp(base.s * (1 - distFromMid * 0.35), 0, 100);
    const hex = hslToHex({ h: base.h, s, l: clamp(l, 5, 98) });
    return { step, hex };
  });
}

function buildSpacingScale(baseUnit: number, count: number): { step: number; px: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    step: i + 1,
    px: baseUnit * (i + 1),
  }));
}

interface RadiusScale {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

function buildRadiusScale(base: number): RadiusScale {
  return {
    sm: Math.round(base),
    md: Math.round(base * 2),
    lg: Math.round(base * 4),
    xl: Math.round(base * 6),
  };
}

function buildFontScale(basePx: number, ratio: Ratio): { key: string; px: number; rem: number }[] {
  return FONT_SCALE_KEYS.map((key) => {
    const exponent = FONT_SCALE_EXPONENTS[key];
    const px = basePx * Math.pow(ratio, exponent);
    return { key, px, rem: px / 16 };
  });
}

function formatNum(value: number, digits = 3): string {
  return Number(value.toFixed(digits)).toString();
}

function buildCss(
  colors: ColorStep[],
  spacing: { step: number; px: number }[],
  radius: RadiusScale,
  fonts: { key: string; px: number; rem: number }[]
): string {
  const lines: string[] = [":root {"];
  colors.forEach((c) => lines.push(`  --color-${c.step}: ${c.hex};`));
  spacing.forEach((s) => lines.push(`  --space-${s.step}: ${formatNum(s.px)}px;`));
  lines.push(`  --radius-sm: ${radius.sm}px;`);
  lines.push(`  --radius-md: ${radius.md}px;`);
  lines.push(`  --radius-lg: ${radius.lg}px;`);
  lines.push(`  --radius-xl: ${radius.xl}px;`);
  lines.push(`  --radius-full: 9999px;`);
  fonts.forEach((f) => lines.push(`  --text-${f.key}: ${formatNum(f.rem)}rem;`));
  lines.push("}");
  return lines.join("\n");
}

function buildJson(
  colors: ColorStep[],
  spacing: { step: number; px: number }[],
  radius: RadiusScale,
  fonts: { key: string; px: number; rem: number }[]
): string {
  const obj = {
    colors: Object.fromEntries(colors.map((c) => [String(c.step), c.hex])),
    spacing: Object.fromEntries(spacing.map((s) => [String(s.step), `${formatNum(s.px)}px`])),
    radius: {
      sm: `${radius.sm}px`,
      md: `${radius.md}px`,
      lg: `${radius.lg}px`,
      xl: `${radius.xl}px`,
      full: "9999px",
    },
    fontSize: Object.fromEntries(fonts.map((f) => [f.key, `${formatNum(f.rem)}rem`])),
  };
  return JSON.stringify(obj, null, 2);
}

function buildTailwind(
  colors: ColorStep[],
  spacing: { step: number; px: number }[],
  radius: RadiusScale,
  fonts: { key: string; px: number; rem: number }[]
): string {
  const colorLines = colors.map((c) => `        ${c.step}: "${c.hex}",`).join("\n");
  const spacingLines = spacing
    .map((s) => `        ${s.step}: "${formatNum(s.px)}px",`)
    .join("\n");
  const fontLines = fonts.map((f) => `        ${f.key}: "${formatNum(f.rem)}rem",`).join("\n");

  return `module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
${colorLines}
        },
      },
      spacing: {
${spacingLines}
      },
      borderRadius: {
        sm: "${radius.sm}px",
        md: "${radius.md}px",
        lg: "${radius.lg}px",
        xl: "${radius.xl}px",
        full: "9999px",
      },
      fontSize: {
${fontLines}
      },
    },
  },
};`;
}

export function DesignTokens() {
  const ready = useRevealReady();

  const [baseHex, setBaseHex] = useState("#3B82F6");
  const [hexInput, setHexInput] = useState("#3B82F6");

  const [spaceUnit, setSpaceUnit] = useState(4);
  const [spaceCount, setSpaceCount] = useState(12);

  const [radiusBase, setRadiusBase] = useState(4);

  const [fontBase, setFontBase] = useState(16);
  const [ratio, setRatio] = useState<Ratio>(1.25);

  const [format, setFormat] = useState<Format>("CSS");
  const [copied, setCopied] = useState(false);

  const colorScale = useMemo(() => {
    if (!isValidHex(baseHex)) return [];
    return buildColorScale(hexToHsl(baseHex));
  }, [baseHex]);

  const spacingScale = useMemo(
    () => buildSpacingScale(spaceUnit, clamp(spaceCount, 1, 24)),
    [spaceUnit, spaceCount]
  );

  const radiusScale = useMemo(() => buildRadiusScale(radiusBase), [radiusBase]);

  const fontScale = useMemo(() => buildFontScale(fontBase, ratio), [fontBase, ratio]);

  const output = useMemo(() => {
    switch (format) {
      case "CSS":
        return buildCss(colorScale, spacingScale, radiusScale, fontScale);
      case "JSON":
        return buildJson(colorScale, spacingScale, radiusScale, fontScale);
      case "Tailwind":
        return buildTailwind(colorScale, spacingScale, radiusScale, fontScale);
      default:
        return "";
    }
  }, [format, colorScale, spacingScale, radiusScale, fontScale]);

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

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Design Tokens" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.section className={styles.section} variants={revealItem}>
          <h2 className={styles.sectionTitle}>Color scale</h2>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="baseColor">Base color</label>
              <div className={styles.colorRow}>
                <input
                  id="baseColor"
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
            </div>
          </div>
          <div className={styles.swatchRow}>
            {colorScale.map((c) => (
              <div className={styles.swatchCol} key={c.step}>
                <span className={styles.swatch} style={{ background: c.hex }} />
                <span className={styles.swatchLabel}>{c.step}</span>
                <span className={styles.swatchHex}>{c.hex}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className={styles.section} variants={revealItem}>
          <h2 className={styles.sectionTitle}>Spacing scale</h2>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="spaceUnit">
                Base unit <span className={styles.fieldValue}>{spaceUnit}px</span>
              </label>
              <input
                id="spaceUnit"
                type="range"
                min={2}
                max={16}
                value={spaceUnit}
                onChange={(e) => setSpaceUnit(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="spaceCount">
                Steps <span className={styles.fieldValue}>{spaceCount}</span>
              </label>
              <input
                id="spaceCount"
                type="range"
                min={4}
                max={24}
                value={spaceCount}
                onChange={(e) => setSpaceCount(Number(e.target.value))}
              />
            </div>
          </div>
          <div className={styles.spacingRow}>
            {spacingScale.map((s) => (
              <div className={styles.spacingCol} key={s.step}>
                <span
                  className={styles.spacingBlock}
                  style={{ width: `${s.px}px`, height: `${s.px}px` }}
                />
                <span className={styles.swatchLabel}>{s.step}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className={styles.section} variants={revealItem}>
          <h2 className={styles.sectionTitle}>Radius scale</h2>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="radiusBase">
                Base radius <span className={styles.fieldValue}>{radiusBase}px</span>
              </label>
              <input
                id="radiusBase"
                type="range"
                min={1}
                max={16}
                value={radiusBase}
                onChange={(e) => setRadiusBase(Number(e.target.value))}
              />
            </div>
          </div>
          <div className={styles.radiusRow}>
            {(
              [
                ["sm", radiusScale.sm],
                ["md", radiusScale.md],
                ["lg", radiusScale.lg],
                ["xl", radiusScale.xl],
                ["full", 9999],
              ] as const
            ).map(([label, px]) => (
              <div className={styles.radiusCol} key={label}>
                <span
                  className={styles.radiusBlock}
                  style={{ borderRadius: `${Math.min(px, 40)}px` }}
                />
                <span className={styles.swatchLabel}>{label}</span>
                <span className={styles.swatchHex}>{label === "full" ? "9999px" : `${px}px`}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className={styles.section} variants={revealItem}>
          <h2 className={styles.sectionTitle}>Font-size scale</h2>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fontBase">
                Base size <span className={styles.fieldValue}>{fontBase}px</span>
              </label>
              <input
                id="fontBase"
                type="range"
                min={12}
                max={24}
                value={fontBase}
                onChange={(e) => setFontBase(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label>Ratio</label>
              <div className={styles.chipRow}>
                {RATIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={clsx(styles.chip, ratio === r && styles.chipActive)}
                    onClick={() => setRatio(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.fontCol}>
            {fontScale.map((f) => (
              <div className={styles.fontRow} key={f.key}>
                <span className={styles.swatchLabel}>--text-{f.key}</span>
                <span
                  className={styles.fontSample}
                  style={{ fontSize: `${clamp(f.px, 10, 64)}px` }}
                >
                  Aa
                </span>
                <span className={styles.swatchHex}>
                  {formatNum(f.rem)}rem / {formatNum(f.px, 1)}px
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className={styles.section} variants={revealItem}>
          <div className={styles.outputHead}>
            <h2 className={styles.sectionTitle}>Output</h2>
            <div className={styles.chipRow}>
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={clsx(styles.chip, format === f && styles.chipActive)}
                  onClick={() => setFormat(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.outputBlock}>
            <div className={styles.outputToolbar}>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copy}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{output}</pre>
          </div>
        </motion.section>
      </motion.div>
    </Frame>
  );
}

export default DesignTokens;
