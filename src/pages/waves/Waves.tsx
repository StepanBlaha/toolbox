import { useMemo, useState } from "react";
import { Check, Copy, Download, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Waves.module.css";

const VIEW_WIDTH = 1440;
const VIEW_HEIGHT = 320;
const MAX_LAYERS = 5;
const MAX_POINTS = 9; // complexity (max 8) + 1

interface Point {
  x: number;
  y: number;
}

function generateOffsets(): number[][] {
  const offsets: number[][] = [];
  for (let l = 0; l < MAX_LAYERS; l++) {
    const row: number[] = [];
    for (let p = 0; p < MAX_POINTS; p++) {
      row.push(Math.random() * 2 - 1);
    }
    offsets.push(row);
  }
  return offsets;
}

function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${round(cp1x)},${round(cp1y)} ${round(cp2x)},${round(cp2y)} ${round(
      p2.x
    )},${round(p2.y)}`;
  }
  return d;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

interface LayerPath {
  d: string;
  opacity: number;
}

function buildLayerPaths(
  layerCount: number,
  complexity: number,
  amplitude: number,
  offsets: number[][]
): LayerPath[] {
  const midY = VIEW_HEIGHT * 0.52;
  const numPoints = complexity + 1;
  const step = VIEW_WIDTH / complexity;

  const result: LayerPath[] = [];

  for (let layer = 0; layer < layerCount; layer++) {
    const points: Point[] = [];
    const baselineShift = layer * 10;
    for (let idx = 0; idx < numPoints; idx++) {
      const x = idx * step;
      const offset = offsets[layer % MAX_LAYERS][idx % MAX_POINTS];
      const y = midY + baselineShift + offset * amplitude;
      points.push({ x: round(x), y: round(y) });
    }

    const line = buildSmoothPath(points);
    const d = `${line} L ${VIEW_WIDTH},${VIEW_HEIGHT} L 0,${VIEW_HEIGHT} Z`;

    const opacity =
      layerCount > 1 ? 0.4 + (0.6 * layer) / (layerCount - 1) : 1;

    result.push({ d, opacity: round(opacity) });
  }

  return result;
}

function buildSvgMarkup(
  layerPaths: LayerPath[],
  color: string,
  flip: boolean
): string {
  const groupOpen = flip
    ? `  <g transform="scale(1,-1) translate(0,-${VIEW_HEIGHT})">\n`
    : `  <g>\n`;
  const paths = layerPaths
    .map(
      (layer) =>
        `    <path d="${layer.d}" fill="${color}" fill-opacity="${layer.opacity}" />`
    )
    .join("\n");

  return `<svg viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
${groupOpen}${paths}
  </g>
</svg>`;
}

export default function Waves() {
  const ready = useRevealReady();
  const [layerCount, setLayerCount] = useState(3);
  const [amplitude, setAmplitude] = useState(40);
  const [complexity, setComplexity] = useState(4);
  const [color, setColor] = useState("#3b82f6");
  const [flip, setFlip] = useState(false);
  const [offsets, setOffsets] = useState<number[][]>(() => generateOffsets());
  const [copied, setCopied] = useState(false);

  const layerPaths = useMemo(
    () => buildLayerPaths(layerCount, complexity, amplitude, offsets),
    [layerCount, complexity, amplitude, offsets]
  );

  const svgMarkup = useMemo(
    () => buildSvgMarkup(layerPaths, color, flip),
    [layerPaths, color, flip]
  );

  function reseed() {
    setOffsets(generateOffsets());
  }

  async function copy() {
    await navigator.clipboard.writeText(svgMarkup);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wave.svg";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Frame wide>
      <SectionHeading title="SVG Wave Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <svg
            className={styles.previewSvg}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <g
              transform={
                flip
                  ? `scale(1,-1) translate(0,-${VIEW_HEIGHT})`
                  : undefined
              }
            >
              {layerPaths.map((layer, idx) => (
                <path
                  key={idx}
                  d={layer.d}
                  fill={color}
                  fillOpacity={layer.opacity}
                />
              ))}
            </g>
          </svg>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="layers">
                Layers <span className={styles.fieldValue}>{layerCount}</span>
              </label>
              <input
                id="layers"
                type="range"
                min={1}
                max={MAX_LAYERS}
                value={layerCount}
                onChange={(e) => setLayerCount(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="amplitude">
                Amplitude <span className={styles.fieldValue}>{amplitude}px</span>
              </label>
              <input
                id="amplitude"
                type="range"
                min={0}
                max={100}
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="complexity">
                Complexity{" "}
                <span className={styles.fieldValue}>{complexity} peaks</span>
              </label>
              <input
                id="complexity"
                type="range"
                min={1}
                max={8}
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="color">Base color</label>
              <div className={styles.colorRow}>
                <input
                  id="color"
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
          </div>

          <div className={styles.row}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={flip}
                onChange={(e) => setFlip(e.target.checked)}
              />
              Flip vertical
            </label>

            <button type="button" className={styles.addBtn} onClick={reseed}>
              <Shuffle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Randomize
            </button>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>SVG output</span>
              <div className={styles.outputActions}>
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={download}
                >
                  <Download size={13} />
                  Download SVG
                </button>
                <button
                  type="button"
                  className={clsx(styles.copyBtn, copied && styles.copied)}
                  onClick={copy}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
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

export { Waves };
