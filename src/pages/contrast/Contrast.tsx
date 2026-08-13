import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeftRight, Check, CheckCircle2, Copy, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Contrast.module.css";

interface WcagRule {
  key: string;
  label: string;
  threshold: number;
}

interface Rating {
  label: "Poor" | "OK" | "Good" | "Great";
  color: string;
}

function getRating(ratio: number): Rating {
  if (ratio < 3) return { label: "Poor", color: "#ef4444" };
  if (ratio < 4.5) return { label: "OK", color: "#f59e0b" };
  if (ratio < 7) return { label: "Good", color: "#22c55e" };
  return { label: "Great", color: "#22c55e" };
}

const RULES: WcagRule[] = [
  { key: "aa-normal", label: "Normal text AA", threshold: 4.5 },
  { key: "aaa-normal", label: "Normal text AAA", threshold: 7 },
  { key: "aa-large", label: "Large text AA", threshold: 3 },
  { key: "aaa-large", label: "Large text AAA", threshold: 4.5 },
  { key: "ui", label: "UI components / graphical", threshold: 3 },
];

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

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function useHexField(initial: string) {
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(initial);

  function commitDraft(next: string) {
    setDraft(next);
    const normalized = normalizeHex(next);
    if (normalized) {
      setValue(normalized);
    }
  }

  function setBoth(next: string) {
    const normalized = normalizeHex(next) ?? next;
    setValue(normalized);
    setDraft(normalized);
  }

  return { value, draft, commitDraft, setBoth };
}

export function Contrast() {
  const ready = useRevealReady();
  const fg = useHexField("#09090b");
  const bg = useHexField("#ffffff");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const ratio = useMemo(() => contrastRatio(fg.value, bg.value), [fg.value, bg.value]);
  const rating = useMemo(() => getRating(ratio), [ratio]);

  function swap() {
    const nextFg = bg.value;
    const nextBg = fg.value;
    fg.setBoth(nextFg);
    bg.setBoth(nextBg);
  }

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Contrast Checker" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.colorFields}>
            <div className={styles.field}>
              <label htmlFor="fgColor">Foreground (text)</label>
              <div className={styles.colorRow}>
                <input
                  id="fgColor"
                  type="color"
                  className={styles.colorInput}
                  value={fg.value}
                  onChange={(e) => fg.setBoth(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={fg.draft}
                  onChange={(e) => fg.commitDraft(e.target.value)}
                />
                <button
                  type="button"
                  className={clsx(styles.copyBtn, copiedKey === "fg" && styles.copied)}
                  onClick={() => copy("fg", fg.value)}
                  aria-label="Copy foreground hex"
                >
                  {copiedKey === "fg" ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="bgColor">Background</label>
              <div className={styles.colorRow}>
                <input
                  id="bgColor"
                  type="color"
                  className={styles.colorInput}
                  value={bg.value}
                  onChange={(e) => bg.setBoth(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={bg.draft}
                  onChange={(e) => bg.commitDraft(e.target.value)}
                />
                <button
                  type="button"
                  className={clsx(styles.copyBtn, copiedKey === "bg" && styles.copied)}
                  onClick={() => copy("bg", bg.value)}
                  aria-label="Copy background hex"
                >
                  {copiedKey === "bg" ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <button type="button" className={styles.swapBtn} onClick={swap}>
              <ArrowLeftRight size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Swap
            </button>
          </div>

          <div
            className={styles.ratioBlock}
            data-rating={rating.label}
            style={{ "--rating-color": rating.color } as CSSProperties}
          >
            <span className={styles.ratioLabel}>Contrast ratio</span>
            <span className={styles.ratioValue}>{ratio.toFixed(2)} : 1</span>
            <span className={styles.ratingRow}>
              <span className={styles.ratingDot} />
              <span className={styles.ratingLabel}>{rating.label}</span>
            </span>
          </div>

          <div className={styles.badges}>
            {RULES.map((rule) => {
              const pass = ratio >= rule.threshold;
              return (
                <div
                  key={rule.key}
                  className={clsx(styles.badge, pass ? styles.pass : styles.fail)}
                >
                  {pass ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  <span className={styles.badgeLabel}>{rule.label}</span>
                  <span className={styles.badgeThreshold}>{rule.threshold}+</span>
                </div>
              );
            })}
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>Pair</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, styles.copyBtnWide, copiedKey === "pair" && styles.copied)}
                onClick={() => copy("pair", `${fg.value} / ${bg.value}`)}
              >
                {copiedKey === "pair" ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === "pair" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{`color: ${fg.value};\nbackground: ${bg.value};`}</pre>
          </div>
        </motion.div>

        <motion.div
          className={styles.previewPanel}
          style={{ background: bg.value }}
          variants={revealItem}
        >
          <div className={styles.previewInner}>
            <p className={styles.previewLarge} style={{ color: fg.value }}>
              Aa
            </p>
            <p className={styles.previewHeading} style={{ color: fg.value }}>
              The quick brown fox jumps
            </p>
            <p className={styles.previewBody} style={{ color: fg.value }}>
              This is normal body text used to preview how legible the
              foreground color is against the chosen background, at a
              typical reading size.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Contrast;
