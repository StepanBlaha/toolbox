import { useMemo, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Transform3D.module.css";

interface TransformState {
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  translateZ: number;
  scale: number;
  skewX: number;
  skewY: number;
}

const DEFAULT_STATE: TransformState = {
  perspective: 800,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  translateZ: 0,
  scale: 1,
  skewX: 0,
  skewY: 0,
};

interface SliderConfig {
  key: keyof TransformState;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit: string;
}

const SLIDERS: SliderConfig[] = [
  { key: "perspective", label: "Perspective", min: 200, max: 2000, unit: "px" },
  { key: "rotateX", label: "Rotate X", min: -180, max: 180, unit: "deg" },
  { key: "rotateY", label: "Rotate Y", min: -180, max: 180, unit: "deg" },
  { key: "rotateZ", label: "Rotate Z", min: -180, max: 180, unit: "deg" },
  { key: "translateZ", label: "Translate Z", min: -200, max: 200, unit: "px" },
  { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.01, unit: "" },
  { key: "skewX", label: "Skew X", min: -45, max: 45, unit: "deg" },
  { key: "skewY", label: "Skew Y", min: -45, max: 45, unit: "deg" },
];

function formatValue(value: number, unit: string): string {
  if (unit === "") return value.toFixed(2);
  return `${Math.round(value)}${unit}`;
}

function buildTransform(state: TransformState): string {
  const parts: string[] = [];
  if (state.rotateX !== 0) parts.push(`rotateX(${state.rotateX}deg)`);
  if (state.rotateY !== 0) parts.push(`rotateY(${state.rotateY}deg)`);
  if (state.rotateZ !== 0) parts.push(`rotateZ(${state.rotateZ}deg)`);
  if (state.translateZ !== 0) parts.push(`translateZ(${state.translateZ}px)`);
  if (state.scale !== 1) parts.push(`scale(${state.scale})`);
  if (state.skewX !== 0) parts.push(`skewX(${state.skewX}deg)`);
  if (state.skewY !== 0) parts.push(`skewY(${state.skewY}deg)`);
  return parts.join(" ");
}

export function Transform3D() {
  const ready = useRevealReady();
  const [state, setState] = useState<TransformState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);

  const transform = useMemo(() => buildTransform(state), [state]);

  const cssText = useMemo(() => {
    const lines = [`perspective: ${state.perspective}px;`];
    lines.push(`transform: ${transform || "none"};`);
    return lines.join("\n");
  }, [state, transform]);

  function update(key: keyof TransformState, value: number) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setState(DEFAULT_STATE);
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="3D Transform" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.stage}
            style={{ perspective: `${state.perspective}px` }}
          >
            <div
              className={styles.card}
              style={{
                transform: transform || "none",
              }}
            >
              <span className={styles.cardLabel}>3D Transform</span>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.slidersHead}>
            <span className={styles.slidersTitle}>Controls</span>
            <button type="button" className={styles.resetBtn} onClick={reset}>
              <RotateCcw size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Reset
            </button>
          </div>

          <div className={styles.sliders}>
            {SLIDERS.map((slider) => (
              <div className={styles.field} key={slider.key}>
                <label htmlFor={slider.key}>
                  {slider.label}{" "}
                  <span className={styles.fieldValue}>
                    {formatValue(state[slider.key], slider.unit)}
                  </span>
                </label>
                <input
                  id={slider.key}
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step ?? 1}
                  value={state[slider.key]}
                  onChange={(e) => update(slider.key, Number(e.target.value))}
                />
              </div>
            ))}
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

export default Transform3D;
