import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./TypeScale.module.css";

interface RatioPreset {
  label: string;
  value: number;
}

const RATIO_PRESETS: RatioPreset[] = [
  { label: "Minor Second (1.067)", value: 1.067 },
  { label: "Major Second (1.125)", value: 1.125 },
  { label: "Minor Third (1.2)", value: 1.2 },
  { label: "Major Third (1.25)", value: 1.25 },
  { label: "Perfect Fourth (1.333)", value: 1.333 },
  { label: "Augmented Fourth (1.414)", value: 1.414 },
  { label: "Perfect Fifth (1.5)", value: 1.5 },
  { label: "Golden Ratio (1.618)", value: 1.618 },
];

const CUSTOM_VALUE = "custom";
const REM_BASE = 16;

interface ScaleStep {
  n: number;
  name: string;
  px: number;
  rem: number;
}

function roundPx(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundRem(n: number): number {
  return Math.round(n * 100) / 100;
}

function nameForStep(n: number): string {
  if (n === 0) return "base";
  if (n > 0) {
    if (n === 1) return "lg";
    if (n === 2) return "xl";
    return `${n - 1}xl`;
  }
  const down = -n;
  if (down === 1) return "sm";
  if (down === 2) return "xs";
  return `${down - 1}xs`;
}

function buildScale(
  base: number,
  ratio: number,
  stepsUp: number,
  stepsDown: number
): ScaleStep[] {
  const steps: ScaleStep[] = [];
  for (let n = stepsUp; n >= -stepsDown; n--) {
    const px = base * Math.pow(ratio, n);
    steps.push({
      n,
      name: nameForStep(n),
      px: roundPx(px),
      rem: roundRem(px / REM_BASE),
    });
  }
  return steps;
}

export function TypeScale() {
  const ready = useRevealReady();
  const [base, setBase] = useState(16);
  const [ratioChoice, setRatioChoice] = useState<string>("1.25");
  const [customRatio, setCustomRatio] = useState(1.3);
  const [stepsUp, setStepsUp] = useState(6);
  const [stepsDown, setStepsDown] = useState(2);
  const [unit, setUnit] = useState<"rem" | "px">("rem");
  const [copied, setCopied] = useState(false);

  const ratio = useMemo(() => {
    if (ratioChoice === CUSTOM_VALUE) return customRatio;
    return Number(ratioChoice);
  }, [ratioChoice, customRatio]);

  const scale = useMemo(
    () => buildScale(base, ratio, stepsUp, stepsDown),
    [base, ratio, stepsUp, stepsDown]
  );

  const cssText = useMemo(() => {
    const lines = scale
      .slice()
      .reverse()
      .map((s) => `  --text-${s.name}: ${unit === "rem" ? `${s.rem}rem` : `${s.px}px`};`);
    return `:root {\n${lines.join("\n")}\n}`;
  }, [scale, unit]);

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Type Scale" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          {scale.map((s) => (
            <div className={styles.previewRow} key={s.n}>
              <div
                className={styles.previewSample}
                style={{ fontSize: `${s.px}px` }}
              >
                Aa Heading
              </div>
              <div className={styles.previewMeta}>
                <span className={styles.previewName}>--text-{s.name}</span>
                <span className={styles.previewValue}>
                  {s.px}px / {s.rem}rem
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="base">
                Base size <span className={styles.fieldValue}>{base}px</span>
              </label>
              <input
                id="base"
                type="number"
                className={styles.numberInput}
                min={8}
                max={64}
                value={base}
                onChange={(e) => setBase(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="ratio">Scale ratio</label>
              <select
                id="ratio"
                className={styles.select}
                value={ratioChoice}
                onChange={(e) => setRatioChoice(e.target.value)}
              >
                {RATIO_PRESETS.map((p) => (
                  <option key={p.value} value={String(p.value)}>
                    {p.label}
                  </option>
                ))}
                <option value={CUSTOM_VALUE}>Custom</option>
              </select>
            </div>
          </div>

          {ratioChoice === CUSTOM_VALUE && (
            <div className={styles.field}>
              <label htmlFor="customRatio">
                Custom ratio <span className={styles.fieldValue}>{customRatio}</span>
              </label>
              <input
                id="customRatio"
                type="number"
                step={0.001}
                min={1.001}
                max={3}
                className={styles.numberInput}
                value={customRatio}
                onChange={(e) => setCustomRatio(Number(e.target.value))}
              />
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="stepsUp">
                Steps up <span className={styles.fieldValue}>{stepsUp}</span>
              </label>
              <input
                id="stepsUp"
                type="range"
                min={0}
                max={10}
                value={stepsUp}
                onChange={(e) => setStepsUp(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="stepsDown">
                Steps down <span className={styles.fieldValue}>{stepsDown}</span>
              </label>
              <input
                id="stepsDown"
                type="range"
                min={0}
                max={6}
                value={stepsDown}
                onChange={(e) => setStepsDown(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="unit">Output unit</label>
            <select
              id="unit"
              className={styles.select}
              value={unit}
              onChange={(e) => setUnit(e.target.value as "rem" | "px")}
            >
              <option value="rem">rem</option>
              <option value="px">px</option>
            </select>
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

export default TypeScale;
