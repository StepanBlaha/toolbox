import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./ShapeGen.module.css";

type ShapeType =
  | "triangle"
  | "circle"
  | "square"
  | "pentagon"
  | "hexagon"
  | "star"
  | "heart"
  | "diamond"
  | "parallelogram"
  | "arrow";

type TriangleDirection = "up" | "down" | "left" | "right";

interface ShapeDef {
  id: ShapeType;
  label: string;
}

const SHAPES: ShapeDef[] = [
  { id: "triangle", label: "Triangle" },
  { id: "circle", label: "Circle" },
  { id: "square", label: "Square" },
  { id: "pentagon", label: "Pentagon" },
  { id: "hexagon", label: "Hexagon" },
  { id: "star", label: "Star" },
  { id: "heart", label: "Heart" },
  { id: "diamond", label: "Diamond" },
  { id: "parallelogram", label: "Parallelogram" },
  { id: "arrow", label: "Arrow" },
];

const DIRECTIONS: { id: TriangleDirection; label: string }[] = [
  { id: "up", label: "Up" },
  { id: "down", label: "Down" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

const CLIP_PATHS: Record<
  Exclude<ShapeType, "triangle" | "circle" | "square" | "parallelogram">,
  string
> = {
  pentagon: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
  hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  star:
    "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  heart:
    "polygon(50% 15%, 61% 3%, 75% 0%, 87% 4%, 95% 14%, 98% 27%, 95% 42%, 87% 55%, 50% 90%, 13% 55%, 5% 42%, 2% 27%, 5% 14%, 13% 4%, 25% 0%, 39% 3%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  arrow:
    "polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)",
};

function triangleBorders(size: number, color: string, direction: TriangleDirection) {
  const half = size / 2;
  switch (direction) {
    case "up":
      return {
        style: {
          width: 0,
          height: 0,
          borderLeft: `${half}px solid transparent`,
          borderRight: `${half}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        } as React.CSSProperties,
        css: `width: 0;\n  height: 0;\n  border-left: ${half}px solid transparent;\n  border-right: ${half}px solid transparent;\n  border-bottom: ${size}px solid ${color};`,
      };
    case "down":
      return {
        style: {
          width: 0,
          height: 0,
          borderLeft: `${half}px solid transparent`,
          borderRight: `${half}px solid transparent`,
          borderTop: `${size}px solid ${color}`,
        } as React.CSSProperties,
        css: `width: 0;\n  height: 0;\n  border-left: ${half}px solid transparent;\n  border-right: ${half}px solid transparent;\n  border-top: ${size}px solid ${color};`,
      };
    case "left":
      return {
        style: {
          width: 0,
          height: 0,
          borderTop: `${half}px solid transparent`,
          borderBottom: `${half}px solid transparent`,
          borderRight: `${size}px solid ${color}`,
        } as React.CSSProperties,
        css: `width: 0;\n  height: 0;\n  border-top: ${half}px solid transparent;\n  border-bottom: ${half}px solid transparent;\n  border-right: ${size}px solid ${color};`,
      };
    case "right":
      return {
        style: {
          width: 0,
          height: 0,
          borderTop: `${half}px solid transparent`,
          borderBottom: `${half}px solid transparent`,
          borderLeft: `${size}px solid ${color}`,
        } as React.CSSProperties,
        css: `width: 0;\n  height: 0;\n  border-top: ${half}px solid transparent;\n  border-bottom: ${half}px solid transparent;\n  border-left: ${size}px solid ${color};`,
      };
  }
}

function buildShape(
  type: ShapeType,
  size: number,
  color: string,
  direction: TriangleDirection
): { style: React.CSSProperties; css: string } {
  if (type === "triangle") {
    return triangleBorders(size, color, direction);
  }

  if (type === "circle") {
    return {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        borderRadius: "50%",
      },
      css: `width: ${size}px;\n  height: ${size}px;\n  background: ${color};\n  border-radius: 50%;`,
    };
  }

  if (type === "square") {
    return {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        background: color,
      },
      css: `width: ${size}px;\n  height: ${size}px;\n  background: ${color};`,
    };
  }

  if (type === "parallelogram") {
    const width = Math.round(size * 1.5);
    return {
      style: {
        width: `${width}px`,
        height: `${size}px`,
        background: color,
        transform: "skew(-20deg)",
      },
      css: `width: ${width}px;\n  height: ${size}px;\n  background: ${color};\n  transform: skew(-20deg);`,
    };
  }

  const clipPath = CLIP_PATHS[type];
  return {
    style: {
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      clipPath,
    },
    css: `width: ${size}px;\n  height: ${size}px;\n  background: ${color};\n  clip-path: ${clipPath};`,
  };
}

export function ShapeGen() {
  const ready = useRevealReady();
  const [shape, setShape] = useState<ShapeType>("triangle");
  const [direction, setDirection] = useState<TriangleDirection>("up");
  const [size, setSize] = useState(120);
  const [color, setColor] = useState("#3b82f6");
  const [copied, setCopied] = useState(false);

  const { style, css } = useMemo(
    () => buildShape(shape, size, color, direction),
    [shape, size, color, direction]
  );

  const cssText = `.shape {\n  ${css}\n}`;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Shape Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div className={styles.shape} style={style} />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label>Shape</label>
            <div className={styles.chipRow}>
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={clsx(styles.chip, shape === s.id && styles.chipActive)}
                  onClick={() => setShape(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {shape === "triangle" && (
            <div className={styles.field}>
              <label>Direction</label>
              <div className={styles.chipRow}>
                {DIRECTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={clsx(
                      styles.chip,
                      direction === d.id && styles.chipActive
                    )}
                    onClick={() => setDirection(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="size">
                Size <span className={styles.fieldValue}>{size}px</span>
              </label>
              <input
                id="size"
                type="range"
                min={20}
                max={280}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="color">Color</label>
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

export default ShapeGen;
