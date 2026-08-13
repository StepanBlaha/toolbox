import { useMemo, useState } from "react";
import { Check, Copy, Pause, Play, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Keyframes.module.css";

interface KeyframeStep {
  stop: string;
  styles: string;
}

interface Preset {
  id: string;
  label: string;
  steps: KeyframeStep[];
}

const PRESETS: Preset[] = [
  {
    id: "fade-in",
    label: "Fade In",
    steps: [
      { stop: "0%", styles: "opacity: 0;" },
      { stop: "100%", styles: "opacity: 1;" },
    ],
  },
  {
    id: "slide-in",
    label: "Slide In",
    steps: [
      { stop: "0%", styles: "opacity: 0;\n    transform: translateY(24px);" },
      { stop: "100%", styles: "opacity: 1;\n    transform: translateY(0);" },
    ],
  },
  {
    id: "scale-in",
    label: "Scale In",
    steps: [
      { stop: "0%", styles: "opacity: 0;\n    transform: scale(0.6);" },
      { stop: "100%", styles: "opacity: 1;\n    transform: scale(1);" },
    ],
  },
  {
    id: "bounce",
    label: "Bounce",
    steps: [
      { stop: "0%", styles: "transform: translateY(0);" },
      { stop: "20%", styles: "transform: translateY(0);" },
      { stop: "40%", styles: "transform: translateY(-30px);" },
      { stop: "50%", styles: "transform: translateY(-30px);" },
      { stop: "60%", styles: "transform: translateY(-15px);" },
      { stop: "80%", styles: "transform: translateY(0);" },
      { stop: "100%", styles: "transform: translateY(0);" },
    ],
  },
  {
    id: "pulse",
    label: "Pulse",
    steps: [
      { stop: "0%", styles: "transform: scale(1);" },
      { stop: "50%", styles: "transform: scale(1.1);" },
      { stop: "100%", styles: "transform: scale(1);" },
    ],
  },
  {
    id: "spin",
    label: "Spin",
    steps: [
      { stop: "0%", styles: "transform: rotate(0deg);" },
      { stop: "100%", styles: "transform: rotate(360deg);" },
    ],
  },
  {
    id: "shake",
    label: "Shake",
    steps: [
      { stop: "0%", styles: "transform: translateX(0);" },
      { stop: "20%", styles: "transform: translateX(-8px);" },
      { stop: "40%", styles: "transform: translateX(8px);" },
      { stop: "60%", styles: "transform: translateX(-6px);" },
      { stop: "80%", styles: "transform: translateX(6px);" },
      { stop: "100%", styles: "transform: translateX(0);" },
    ],
  },
  {
    id: "flip",
    label: "Flip",
    steps: [
      { stop: "0%", styles: "transform: perspective(400px) rotateY(0);" },
      { stop: "50%", styles: "transform: perspective(400px) rotateY(-180deg);" },
      { stop: "100%", styles: "transform: perspective(400px) rotateY(-360deg);" },
    ],
  },
];

const TIMING_FUNCTIONS = [
  { value: "linear", label: "linear" },
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", label: "back (cubic-bezier)" },
  { value: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", label: "elastic (cubic-bezier)" },
];

const DIRECTIONS = ["normal", "alternate", "reverse", "alternate-reverse"] as const;
const FILL_MODES = ["none", "forwards", "both", "backwards"] as const;

type Direction = (typeof DIRECTIONS)[number];
type FillMode = (typeof FILL_MODES)[number];

const ANIM_NAME = "toolbox-anim";

function buildKeyframesCss(preset: Preset): string {
  const body = preset.steps
    .map((step) => `  ${step.stop} {\n    ${step.styles}\n  }`)
    .join("\n");
  return `@keyframes ${ANIM_NAME} {\n${body}\n}`;
}

export function Keyframes() {
  const ready = useRevealReady();
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [duration, setDuration] = useState(1.2);
  const [delay, setDelay] = useState(0);
  const [timingFunction, setTimingFunction] = useState(TIMING_FUNCTIONS[1].value);
  const [iterationCount, setIterationCount] = useState(1);
  const [infinite, setInfinite] = useState(false);
  const [direction, setDirection] = useState<Direction>("normal");
  const [fillMode, setFillMode] = useState<FillMode>("both");
  const [playing, setPlaying] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0],
    [presetId]
  );

  const keyframesCss = useMemo(() => buildKeyframesCss(preset), [preset]);

  const iterationValue = infinite ? "infinite" : String(iterationCount);

  const animationShorthand = `${ANIM_NAME} ${duration}s ${timingFunction} ${delay}s ${iterationValue} ${direction} ${fillMode}`;

  const cssText = `${keyframesCss}\n\nanimation: ${animationShorthand};`;

  function replay() {
    setReplayKey((k) => k + 1);
    setPlaying(true);
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="CSS Animation" />

      <style>{keyframesCss}</style>

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            key={replayKey}
            className={styles.previewBox}
            style={{
              animationName: ANIM_NAME,
              animationDuration: `${duration}s`,
              animationTimingFunction: timingFunction,
              animationDelay: `${delay}s`,
              animationIterationCount: iterationValue,
              animationDirection: direction,
              animationFillMode: fillMode,
              animationPlayState: playing ? "running" : "paused",
            }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.chips}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={clsx(styles.chip, p.id === presetId && styles.chipActive)}
                onClick={() => {
                  setPresetId(p.id);
                  setReplayKey((k) => k + 1);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={styles.playRow}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" className={styles.iconBtn} onClick={replay} aria-label="Replay">
              <RotateCcw size={14} />
              Replay
            </button>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="duration">
                Duration <span className={styles.fieldValue}>{duration}s</span>
              </label>
              <input
                id="duration"
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="delay">
                Delay <span className={styles.fieldValue}>{delay}s</span>
              </label>
              <input
                id="delay"
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="timing">Timing function</label>
              <select
                id="timing"
                className={styles.select}
                value={timingFunction}
                onChange={(e) => setTimingFunction(e.target.value)}
              >
                {TIMING_FUNCTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="iterations">Iterations</label>
              <div className={styles.colorRow}>
                <input
                  id="iterations"
                  type="number"
                  min={1}
                  className={styles.numberInput}
                  value={iterationCount}
                  disabled={infinite}
                  onChange={(e) =>
                    setIterationCount(Math.max(1, Number(e.target.value) || 1))
                  }
                />
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={infinite}
                    onChange={(e) => setInfinite(e.target.checked)}
                  />
                  infinite
                </label>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="direction">Direction</label>
              <select
                id="direction"
                className={styles.select}
                value={direction}
                onChange={(e) => setDirection(e.target.value as Direction)}
              >
                {DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="fillMode">Fill mode</label>
              <select
                id="fillMode"
                className={styles.select}
                value={fillMode}
                onChange={(e) => setFillMode(e.target.value as FillMode)}
              >
                {FILL_MODES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
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

export default Keyframes;
