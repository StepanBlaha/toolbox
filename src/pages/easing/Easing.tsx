import { useCallback, useRef, useState } from "react";
import { Check, Copy, Pause, Play } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Easing.module.css";

interface Point {
  x: number;
  y: number;
}

interface Preset {
  label: string;
  values: [number, number, number, number];
}

const PRESETS: Preset[] = [
  { label: "linear", values: [0, 0, 1, 1] },
  { label: "ease", values: [0.25, 0.1, 0.25, 1] },
  { label: "ease-in", values: [0.42, 0, 1, 1] },
  { label: "ease-out", values: [0, 0, 0.58, 1] },
  { label: "ease-in-out", values: [0.42, 0, 0.58, 1] },
  { label: "easeOutBack", values: [0.34, 1.56, 0.64, 1] },
];

const SVG_SIZE = 320;
const PAD = 40;
const PLOT = SVG_SIZE - PAD * 2;

// curve space y range shown: [-0.5, 1.5], curve space x range: [0, 1]
const Y_MIN = -0.5;
const Y_MAX = 1.5;
const Y_RANGE = Y_MAX - Y_MIN;

function toSvgX(x: number): number {
  return PAD + x * PLOT;
}

function toSvgY(y: number): number {
  return PAD + (Y_MAX - y) * (PLOT / Y_RANGE);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function Easing() {
  const ready = useRevealReady();
  const [x1, setX1] = useState(0.25);
  const [y1, setY1] = useState(0.1);
  const [x2, setX2] = useState(0.25);
  const [y2, setY2] = useState(1);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef<"p1" | "p2" | null>(null);

  const cssText = `transition-timing-function: cubic-bezier(${x1}, ${y1}, ${x2}, ${y2});`;

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number, which: "p1" | "p2") => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_SIZE / rect.width;
      const scaleY = SVG_SIZE / rect.height;
      const localX = (clientX - rect.left) * scaleX;
      const localY = (clientY - rect.top) * scaleY;

      const curveX = clamp((localX - PAD) / PLOT, 0, 1);
      const curveY = clamp(
        Y_MAX - (localY - PAD) / (PLOT / Y_RANGE),
        Y_MIN,
        Y_MAX
      );

      if (which === "p1") {
        setX1(Math.round(curveX * 100) / 100);
        setY1(Math.round(curveY * 100) / 100);
      } else {
        setX2(Math.round(curveX * 100) / 100);
        setY2(Math.round(curveY * 100) / 100);
      }
    },
    []
  );

  function handlePointerDown(which: "p1" | "p2") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = which;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY, draggingRef.current);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (draggingRef.current) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
    draggingRef.current = null;
  }

  function applyPreset(preset: Preset) {
    const [px1, py1, px2, py2] = preset.values;
    setX1(px1);
    setY1(py1);
    setX2(px2);
    setY2(py2);
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function togglePlay() {
    setPlaying((prev) => !prev);
  }

  const p0 = { x: toSvgX(0), y: toSvgY(0) };
  const p3 = { x: toSvgX(1), y: toSvgY(1) };
  const p1: Point = { x: toSvgX(x1), y: toSvgY(y1) };
  const p2: Point = { x: toSvgX(x2), y: toSvgY(y2) };

  const curvePath = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  const gridStart = toSvgY(0);
  const gridEnd = toSvgY(1);
  const gridLeft = toSvgX(0);
  const gridRight = toSvgX(1);

  return (
    <Frame wide>
      <SectionHeading title="Cubic-Bezier Easing" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.editorPanel} variants={revealItem}>
          <svg
            ref={svgRef}
            className={styles.svg}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* unit box baseline grid */}
            <rect
              x={gridLeft}
              y={gridEnd}
              width={gridRight - gridLeft}
              height={gridStart - gridEnd}
              className={styles.gridBox}
            />
            {/* diagonal reference line */}
            <line
              x1={gridLeft}
              y1={gridStart}
              x2={gridRight}
              y2={gridEnd}
              className={styles.diagonal}
            />
            {/* handle guide lines */}
            <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} className={styles.guide} />
            <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} className={styles.guide} />
            {/* bezier curve */}
            <path d={curvePath} className={styles.curve} />
            {/* endpoints */}
            <circle cx={p0.x} cy={p0.y} r={3} className={styles.endpoint} />
            <circle cx={p3.x} cy={p3.y} r={3} className={styles.endpoint} />
            {/* draggable handles */}
            <circle
              cx={p1.x}
              cy={p1.y}
              r={7}
              className={styles.handle}
              onPointerDown={handlePointerDown("p1")}
            />
            <circle
              cx={p2.x}
              cy={p2.y}
              r={7}
              className={styles.handle}
              onPointerDown={handlePointerDown("p2")}
            />
          </svg>

          <div className={styles.playRow}>
            <button type="button" className={styles.playBtn} onClick={togglePlay}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? "Pause" : "Play"}
            </button>
            <div className={styles.track}>
              <div
                className={styles.travelDot}
                style={{
                  left: playing ? "calc(100% - 14px)" : "0%",
                  transition: `left 1s cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.inputsRow}>
            <div className={styles.field}>
              <label htmlFor="x1">x1</label>
              <input
                id="x1"
                type="number"
                step={0.01}
                className={styles.numberInput}
                value={x1}
                onChange={(e) => setX1(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="y1">y1</label>
              <input
                id="y1"
                type="number"
                step={0.01}
                className={styles.numberInput}
                value={y1}
                onChange={(e) => setY1(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="x2">x2</label>
              <input
                id="x2"
                type="number"
                step={0.01}
                className={styles.numberInput}
                value={x2}
                onChange={(e) => setX2(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="y2">y2</label>
              <input
                id="y2"
                type="number"
                step={0.01}
                className={styles.numberInput}
                value={y2}
                onChange={(e) => setY2(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.presets}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
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

export default Easing;
export { Easing };
