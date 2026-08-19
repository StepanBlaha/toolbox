import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./Pattern.module.css";

type PatternType =
  | "stripes"
  | "vstripes"
  | "dots"
  | "grid"
  | "checkerboard"
  | "zigzag";

interface PatternDef {
  id: PatternType;
  label: string;
  hasAngle?: boolean;
  hasThickness?: boolean;
  thicknessLabel?: string;
}

const PATTERNS: PatternDef[] = [
  { id: "stripes", label: "Stripes", hasAngle: true, hasThickness: true, thicknessLabel: "Line thickness" },
  { id: "vstripes", label: "Vertical Stripes", hasThickness: true, thicknessLabel: "Line thickness" },
  { id: "dots", label: "Dots", hasThickness: true, thicknessLabel: "Dot radius" },
  { id: "grid", label: "Grid", hasThickness: true, thicknessLabel: "Line thickness" },
  { id: "checkerboard", label: "Checkerboard" },
  { id: "zigzag", label: "Zigzag" },
];

interface Composed {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize?: string;
  backgroundPosition?: string;
}

function buildPattern(
  type: PatternType,
  fg: string,
  bg: string,
  size: number,
  thickness: number,
  angle: number
): Composed {
  switch (type) {
    case "stripes":
      return {
        backgroundColor: bg,
        backgroundImage: `repeating-linear-gradient(${angle}deg, ${fg} 0 ${thickness}px, ${bg} ${thickness}px ${size}px)`,
      };
    case "vstripes":
      return {
        backgroundColor: bg,
        backgroundImage: `repeating-linear-gradient(90deg, ${fg} 0 ${thickness}px, ${bg} ${thickness}px ${size}px)`,
      };
    case "dots":
      return {
        backgroundColor: bg,
        backgroundImage: `radial-gradient(circle, ${fg} ${thickness}px, transparent ${thickness}px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    case "grid":
      return {
        backgroundColor: bg,
        backgroundImage: `repeating-linear-gradient(0deg, ${fg} 0 ${thickness}px, transparent ${thickness}px ${size}px), repeating-linear-gradient(90deg, ${fg} 0 ${thickness}px, transparent ${thickness}px ${size}px)`,
      };
    case "checkerboard":
      return {
        backgroundColor: bg,
        backgroundImage: `conic-gradient(${fg} 90deg, ${bg} 90deg 180deg, ${fg} 180deg 270deg, ${bg} 270deg)`,
        backgroundSize: `${size}px ${size}px`,
      };
    case "zigzag": {
      const half = size / 2;
      return {
        backgroundColor: bg,
        backgroundImage: `linear-gradient(135deg, ${fg} 25%, transparent 25%), linear-gradient(225deg, ${fg} 25%, transparent 25%), linear-gradient(315deg, ${fg} 25%, transparent 25%), linear-gradient(45deg, ${fg} 25%, ${bg} 25%)`,
        backgroundPosition: `-${half}px 0, -${half}px 0, 0 0, 0 0`,
        backgroundSize: `${size}px ${size}px`,
      };
    }
  }
}

function composedToCss(c: Composed): string {
  const lines = [`background-color: ${c.backgroundColor};`, `background-image: ${c.backgroundImage};`];
  if (c.backgroundPosition) lines.push(`background-position: ${c.backgroundPosition};`);
  if (c.backgroundSize) lines.push(`background-size: ${c.backgroundSize};`);
  return lines.join("\n");
}

interface PatternState {
  type: PatternType;
  fg: string;
  bg: string;
  size: number;
  thickness: number;
  angle: number;
}

const DEFAULT_STATE: PatternState = {
  type: "stripes",
  fg: "#09090b",
  bg: "#fafafa",
  size: 40,
  thickness: 8,
  angle: 45,
};

export function Pattern() {
  const ready = useRevealReady();
  const [state, setState] = useUrlState<PatternState>(DEFAULT_STATE);
  const { type, fg, bg, size, thickness, angle } = state;
  const [copied, setCopied] = useState(false);

  function setType(type: PatternType) {
    setState((prev) => ({ ...prev, type }));
  }

  function setFg(fg: string) {
    setState((prev) => ({ ...prev, fg }));
  }

  function setBg(bg: string) {
    setState((prev) => ({ ...prev, bg }));
  }

  function setSize(size: number) {
    setState((prev) => ({ ...prev, size }));
  }

  function setThickness(thickness: number) {
    setState((prev) => ({ ...prev, thickness }));
  }

  function setAngle(angle: number) {
    setState((prev) => ({ ...prev, angle }));
  }

  const def = useMemo(() => PATTERNS.find((p) => p.id === type)!, [type]);

  const composed = useMemo(
    () => buildPattern(type, fg, bg, size, thickness, angle),
    [type, fg, bg, size, thickness, angle]
  );

  const cssText = useMemo(() => composedToCss(composed), [composed]);

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="CSS Pattern Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewBox}
            style={{
              backgroundColor: composed.backgroundColor,
              backgroundImage: composed.backgroundImage,
              backgroundSize: composed.backgroundSize,
              backgroundPosition: composed.backgroundPosition,
            }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.chips}>
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={clsx(styles.chip, type === p.id && styles.chipActive)}
                onClick={() => setType(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fg">Foreground color</label>
              <div className={styles.colorRow}>
                <input
                  id="fg"
                  type="color"
                  className={styles.colorInput}
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="bg">Background color</label>
              <div className={styles.colorRow}>
                <input
                  id="bg"
                  type="color"
                  className={styles.colorInput}
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="size">
                Tile size <span className={styles.fieldValue}>{size}px</span>
              </label>
              <input
                id="size"
                type="range"
                min={8}
                max={120}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>

            {def.hasThickness && (
              <div className={styles.field}>
                <label htmlFor="thickness">
                  {def.thicknessLabel}{" "}
                  <span className={styles.fieldValue}>{thickness}px</span>
                </label>
                <input
                  id="thickness"
                  type="range"
                  min={1}
                  max={Math.max(2, Math.floor(size / 2))}
                  value={thickness}
                  onChange={(e) => setThickness(Number(e.target.value))}
                />
              </div>
            )}

            {def.hasAngle && (
              <div className={styles.field}>
                <label htmlFor="angle">
                  Angle <span className={styles.fieldValue}>{angle}&deg;</span>
                </label>
                <input
                  id="angle"
                  type="range"
                  min={0}
                  max={180}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                />
              </div>
            )}
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

export default Pattern;
