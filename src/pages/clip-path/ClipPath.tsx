import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./ClipPath.module.css";

interface Point {
  x: number;
  y: number;
}

type ShapeType = "polygon" | "circle" | "ellipse" | "inset";

interface ShapeDef {
  name: string;
  type: ShapeType;
  points?: Point[];
}

const SHAPES: ShapeDef[] = [
  {
    name: "Triangle",
    type: "polygon",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  },
  {
    name: "Rhombus",
    type: "polygon",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ],
  },
  {
    name: "Pentagon",
    type: "polygon",
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 38 },
      { x: 82, y: 100 },
      { x: 18, y: 100 },
      { x: 0, y: 38 },
    ],
  },
  {
    name: "Hexagon",
    type: "polygon",
    points: [
      { x: 25, y: 0 },
      { x: 75, y: 0 },
      { x: 100, y: 50 },
      { x: 75, y: 100 },
      { x: 25, y: 100 },
      { x: 0, y: 50 },
    ],
  },
  {
    name: "Octagon",
    type: "polygon",
    points: [
      { x: 30, y: 0 },
      { x: 70, y: 0 },
      { x: 100, y: 30 },
      { x: 100, y: 70 },
      { x: 70, y: 100 },
      { x: 30, y: 100 },
      { x: 0, y: 70 },
      { x: 0, y: 30 },
    ],
  },
  {
    name: "Star",
    type: "polygon",
    points: [
      { x: 50, y: 0 },
      { x: 61, y: 35 },
      { x: 98, y: 35 },
      { x: 68, y: 57 },
      { x: 79, y: 91 },
      { x: 50, y: 70 },
      { x: 21, y: 91 },
      { x: 32, y: 57 },
      { x: 2, y: 35 },
      { x: 39, y: 35 },
    ],
  },
  {
    name: "Arrow",
    type: "polygon",
    points: [
      { x: 0, y: 20 },
      { x: 60, y: 20 },
      { x: 60, y: 0 },
      { x: 100, y: 50 },
      { x: 60, y: 100 },
      { x: 60, y: 80 },
      { x: 0, y: 80 },
    ],
  },
  {
    name: "Message",
    type: "polygon",
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 75 },
      { x: 75, y: 75 },
      { x: 75, y: 100 },
      { x: 50, y: 75 },
      { x: 0, y: 75 },
    ],
  },
  { name: "Circle", type: "circle" },
  { name: "Ellipse", type: "ellipse" },
  { name: "Inset", type: "inset" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function clonePoints(points: Point[]): Point[] {
  return points.map((p) => ({ ...p }));
}

function ClipPath() {
  const ready = useRevealReady();
  const [activeShape, setActiveShape] = useState<string>("Triangle");
  const [points, setPoints] = useState<Point[]>(
    clonePoints(SHAPES[0].points ?? [])
  );
  const [circle, setCircle] = useState({ r: 50, cx: 50, cy: 50 });
  const [ellipse, setEllipse] = useState({ rx: 40, ry: 30, cx: 50, cy: 50 });
  const [inset, setInset] = useState({ top: 10, right: 10, bottom: 10, left: 10 });
  const [copied, setCopied] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<number | null>(null);

  const shape = useMemo(
    () => SHAPES.find((s) => s.name === activeShape) ?? SHAPES[0],
    [activeShape]
  );

  const clipPathValue = useMemo(() => {
    switch (shape.type) {
      case "polygon":
        return `polygon(${points
          .map((p) => `${round(p.x)}% ${round(p.y)}%`)
          .join(", ")})`;
      case "circle":
        return `circle(${round(circle.r)}% at ${round(circle.cx)}% ${round(
          circle.cy
        )}%)`;
      case "ellipse":
        return `ellipse(${round(ellipse.rx)}% ${round(ellipse.ry)}% at ${round(
          ellipse.cx
        )}% ${round(ellipse.cy)}%)`;
      case "inset":
        return `inset(${round(inset.top)}% ${round(inset.right)}% ${round(
          inset.bottom
        )}% ${round(inset.left)}%)`;
      default:
        return "none";
    }
  }, [shape.type, points, circle, ellipse, inset]);

  const cssText = `clip-path: ${clipPathValue};`;

  function selectShape(next: ShapeDef) {
    setActiveShape(next.name);
    if (next.type === "polygon" && next.points) {
      setPoints(clonePoints(next.points));
    }
  }

  const updateFromPointer = useCallback((clientX: number, clientY: number, index: number) => {
    const box = previewRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    setPoints((prev) =>
      prev.map((p, i) => (i === index ? { x: round(px), y: round(py) } : p))
    );
  }, []);

  function handlePointerDown(index: number) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = index;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (draggingRef.current === null) return;
    updateFromPointer(e.clientX, e.clientY, draggingRef.current);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (draggingRef.current !== null) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
    draggingRef.current = null;
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Clip-path Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            ref={previewRef}
            className={styles.previewBox}
            style={{ clipPath: clipPathValue }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          {shape.type === "polygon" && (
            <div className={styles.handleLayer}>
              {points.map((p, i) => (
                <div
                  key={i}
                  className={styles.handle}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onPointerDown={handlePointerDown(i)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.presets}>
            {SHAPES.map((s) => (
              <button
                key={s.name}
                type="button"
                className={clsx(
                  styles.presetChip,
                  s.name === activeShape && styles.active
                )}
                onClick={() => selectShape(s)}
              >
                {s.name}
              </button>
            ))}
          </div>

          {shape.type === "polygon" && (
            <p className={styles.hint}>
              Drag the dots on the preview to reshape the polygon.
            </p>
          )}

          {shape.type === "circle" && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label>
                  Radius <span className={styles.fieldValue}>{circle.r}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={circle.r}
                  onChange={(e) =>
                    setCircle((c) => ({ ...c, r: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Center X <span className={styles.fieldValue}>{circle.cx}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={circle.cx}
                  onChange={(e) =>
                    setCircle((c) => ({ ...c, cx: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Center Y <span className={styles.fieldValue}>{circle.cy}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={circle.cy}
                  onChange={(e) =>
                    setCircle((c) => ({ ...c, cy: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          )}

          {shape.type === "ellipse" && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label>
                  Radius X <span className={styles.fieldValue}>{ellipse.rx}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ellipse.rx}
                  onChange={(e) =>
                    setEllipse((el) => ({ ...el, rx: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Radius Y <span className={styles.fieldValue}>{ellipse.ry}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ellipse.ry}
                  onChange={(e) =>
                    setEllipse((el) => ({ ...el, ry: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Center X <span className={styles.fieldValue}>{ellipse.cx}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ellipse.cx}
                  onChange={(e) =>
                    setEllipse((el) => ({ ...el, cx: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Center Y <span className={styles.fieldValue}>{ellipse.cy}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ellipse.cy}
                  onChange={(e) =>
                    setEllipse((el) => ({ ...el, cy: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          )}

          {shape.type === "inset" && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label>
                  Top <span className={styles.fieldValue}>{inset.top}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={inset.top}
                  onChange={(e) =>
                    setInset((n) => ({ ...n, top: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Right <span className={styles.fieldValue}>{inset.right}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={inset.right}
                  onChange={(e) =>
                    setInset((n) => ({ ...n, right: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Bottom <span className={styles.fieldValue}>{inset.bottom}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={inset.bottom}
                  onChange={(e) =>
                    setInset((n) => ({ ...n, bottom: Number(e.target.value) }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>
                  Left <span className={styles.fieldValue}>{inset.left}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={inset.left}
                  onChange={(e) =>
                    setInset((n) => ({ ...n, left: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          )}

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

export default ClipPath;
export { ClipPath };
