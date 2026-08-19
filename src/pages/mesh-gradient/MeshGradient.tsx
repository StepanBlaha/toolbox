import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Copy, Plus, Shuffle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./MeshGradient.module.css";

interface MeshPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

const MIN_POINTS = 3;
const MAX_POINTS = 8;

const DEFAULT_COLORS = [
  "#3b82f6",
  "#f472b6",
  "#facc15",
  "#34d399",
  "#a78bfa",
  "#fb923c",
];

function makePoint(index: number): MeshPoint {
  return {
    id: Math.random().toString(36).slice(2),
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  };
}

function pointToGradient(point: MeshPoint): string {
  return `radial-gradient(circle at ${point.x.toFixed(1)}% ${point.y.toFixed(
    1
  )}%, ${point.color}, transparent 55%)`;
}

interface MeshGradientState {
  points: MeshPoint[];
  baseColor: string;
}

function makeDefaultState(): MeshGradientState {
  return {
    points: [makePoint(0), makePoint(1), makePoint(2), makePoint(3)],
    baseColor: "#0f172a",
  };
}

export default function MeshGradient() {
  const ready = useRevealReady();
  const [state, setState] = useUrlState<MeshGradientState>(
    makeDefaultState()
  );
  const { points, baseColor } = state;
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);

  const backgroundImage = useMemo(
    () => points.map(pointToGradient).join(",\n  "),
    [points]
  );

  const cssText = `background-color: ${baseColor};\nbackground-image: ${backgroundImage};`;

  function setBaseColor(baseColor: string) {
    setState((prev) => ({ ...prev, baseColor }));
  }

  function updatePoint(id: string, patch: Partial<MeshPoint>) {
    setState((prev) => ({
      ...prev,
      points: prev.points.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function addPoint() {
    setState((prev) =>
      prev.points.length >= MAX_POINTS
        ? prev
        : { ...prev, points: [...prev.points, makePoint(prev.points.length)] }
    );
  }

  function removePoint(id: string) {
    setState((prev) =>
      prev.points.length <= MIN_POINTS
        ? prev
        : { ...prev, points: prev.points.filter((p) => p.id !== id) }
    );
  }

  function randomize() {
    setState((prev) => ({
      ...prev,
      points: prev.points.map((p) => ({
        ...p,
        x: Math.round(Math.random() * 100),
        y: Math.round(Math.random() * 100),
        color:
          DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)] ??
          p.color,
      })),
      baseColor: `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`,
    }));
  }

  const setPointFromPointer = useCallback((id: string, clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    updatePoint(id, { x, y });
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.preventDefault();
    draggingId.current = id;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setPointFromPointer(id, e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingId.current) return;
    setPointFromPointer(draggingId.current, e.clientX, e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    draggingId.current = null;
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Mesh Gradient" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            ref={previewRef}
            className={styles.preview}
            style={{
              backgroundColor: baseColor,
              backgroundImage,
            }}
          >
            {points.map((point) => (
              <button
                key={point.id}
                type="button"
                aria-label="Drag gradient point"
                className={styles.handle}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  borderColor: point.color,
                }}
                onPointerDown={(e) => handlePointerDown(e, point.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="baseColor">Base color</label>
              <div className={styles.colorRow}>
                <input
                  id="baseColor"
                  type="color"
                  className={styles.colorInput}
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>&nbsp;</label>
              <button type="button" className={styles.randomizeBtn} onClick={randomize}>
                <Shuffle size={13} />
                Randomize
              </button>
            </div>
          </div>

          <div className={styles.points}>
            {points.map((point, idx) => (
              <div className={styles.point} key={point.id}>
                <div className={styles.pointHead}>
                  <span className={styles.pointTitle}>Point {idx + 1}</span>
                  {points.length > MIN_POINTS && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label="Remove point"
                      onClick={() => removePoint(point.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className={styles.colorRow}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={point.color}
                    onChange={(e) => updatePoint(point.id, { color: e.target.value })}
                  />
                  <input
                    type="text"
                    className={styles.textInput}
                    value={point.color}
                    onChange={(e) => updatePoint(point.id, { color: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.addBtn}
            onClick={addPoint}
            disabled={points.length >= MAX_POINTS}
          >
            <Plus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Add point
          </button>

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

export { MeshGradient };
