import { useMemo, useState } from "react";
import { Check, Copy, Download, Shapes, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Blob.module.css";

const SIZE = 200;
const CENTER = SIZE / 2;
const PADDING = 20;
const BASE_RADIUS = CENTER - PADDING;

function makeFactors(count: number): number[] {
  return Array.from({ length: count }, () => Math.random());
}

function buildPath(count: number, randomness: number, factors: number[]): string {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const factor = factors[i] ?? 0;
    const radius = BASE_RADIUS * (1 - randomness * factor);
    points.push({
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    });
  }

  const n = points.length;
  if (n < 3) return "";

  // Catmull-Rom -> cubic bezier through the closed loop of points.
  const getPoint = (i: number) => points[((i % n) + n) % n];

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const p0 = getPoint(i - 1);
    const p1 = getPoint(i);
    const p2 = getPoint(i + 1);
    const p3 = getPoint(i + 2);

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

export default function Blob() {
  const ready = useRevealReady();
  const [complexity, setComplexity] = useState(6);
  const [randomness, setRandomness] = useState(0.4);
  const [color, setColor] = useState("#3b82f6");
  const [factors, setFactors] = useState<number[]>(() => makeFactors(6));
  const [copied, setCopied] = useState(false);

  const path = useMemo(
    () => buildPath(complexity, randomness, factors),
    [complexity, randomness, factors]
  );

  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}"><path d="${path}" fill="${color}" /></svg>`;

  function handleComplexityChange(next: number) {
    setComplexity(next);
    setFactors(makeFactors(next));
  }

  function randomize() {
    setFactors(makeFactors(complexity));
  }

  async function copy() {
    await navigator.clipboard.writeText(svgMarkup);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const file = new globalThis.Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blob.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Frame wide>
      <SectionHeading title="Blob Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <svg
            className={styles.previewSvg}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={path} fill={color} />
          </svg>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="complexity">
                Complexity <span className={styles.fieldValue}>{complexity}</span>
              </label>
              <input
                id="complexity"
                type="range"
                min={3}
                max={12}
                step={1}
                value={complexity}
                onChange={(e) => handleComplexityChange(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="randomness">
                Randomness <span className={styles.fieldValue}>{randomness.toFixed(2)}</span>
              </label>
              <input
                id="randomness"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={randomness}
                onChange={(e) => setRandomness(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="blobColor">Fill color</label>
              <div className={styles.colorRow}>
                <input
                  id="blobColor"
                  type="color"
                  className={styles.colorInput}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>&nbsp;</label>
              <button type="button" className={styles.randomizeBtn} onClick={randomize}>
                <Shuffle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Randomize
              </button>
            </div>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>
                <Shapes size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                SVG output
              </span>
              <div className={styles.outputActions}>
                <button
                  type="button"
                  className={clsx(styles.copyBtn, copied && styles.copied)}
                  onClick={copy}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button type="button" className={styles.downloadBtn} onClick={download}>
                  <Download size={13} />
                  Download SVG
                </button>
              </div>
            </div>
            <pre className={styles.pre}>{svgMarkup}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export { Blob };
