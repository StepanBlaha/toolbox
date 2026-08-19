import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./Neumorphism.module.css";

type Shape = "flat" | "concave" | "convex" | "pressed";

const SHAPES: { id: Shape; label: string }[] = [
  { id: "flat", label: "Flat" },
  { id: "concave", label: "Concave" },
  { id: "convex", label: "Convex" },
  { id: "pressed", label: "Pressed" },
];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const bigint = parseInt(full, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shade(hex: string, amount: number): string {
  // amount in [-1, 1]: negative darkens toward black, positive lightens toward white
  const [r, g, b] = hexToRgb(hex);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const mix = (c: number) => c + (target - c) * t;
  return rgbToHex(mix(r), mix(g), mix(b));
}

interface NeumorphismState {
  baseColor: string;
  size: number;
  radius: number;
  distance: number;
  blur: number;
  blurLinked: boolean;
  shape: Shape;
}

const DEFAULT_STATE: NeumorphismState = {
  baseColor: "#e0e0e0",
  size: 160,
  radius: 24,
  distance: 20,
  blur: 40,
  blurLinked: true,
  shape: "flat",
};

export default function Neumorphism() {
  const ready = useRevealReady();
  const [state, setState] = useUrlState<NeumorphismState>(DEFAULT_STATE);
  const { baseColor, size, radius, distance, blur, blurLinked, shape } = state;
  const [copied, setCopied] = useState(false);

  function setBaseColor(baseColor: string) {
    setState((prev) => ({ ...prev, baseColor }));
  }

  function setSize(size: number) {
    setState((prev) => ({ ...prev, size }));
  }

  function setRadius(radius: number) {
    setState((prev) => ({ ...prev, radius }));
  }

  function setDistance(distance: number) {
    setState((prev) => ({ ...prev, distance }));
  }

  function setBlur(blur: number) {
    setState((prev) => ({ ...prev, blur }));
  }

  function setBlurLinked(blurLinked: boolean) {
    setState((prev) => ({ ...prev, blurLinked }));
  }

  function setShape(shape: Shape) {
    setState((prev) => ({ ...prev, shape }));
  }

  const darkColor = useMemo(() => shade(baseColor, -0.15), [baseColor]);
  const lightColor = useMemo(() => shade(baseColor, 0.15), [baseColor]);

  const effectiveBlur = blurLinked ? distance * 2 : blur;
  const maxRadius = Math.floor(size / 2);
  const effectiveRadius = Math.min(radius, maxRadius);

  const boxShadow = useMemo(() => {
    const inset = shape === "pressed" ? "inset " : "";
    return `${inset}${distance}px ${distance}px ${effectiveBlur}px ${darkColor}, ${inset}-${distance}px -${distance}px ${effectiveBlur}px ${lightColor}`;
  }, [shape, distance, effectiveBlur, darkColor, lightColor]);

  const background = useMemo(() => {
    if (shape === "convex") return `linear-gradient(145deg, ${lightColor}, ${darkColor})`;
    if (shape === "concave") return `linear-gradient(145deg, ${darkColor}, ${lightColor})`;
    return baseColor;
  }, [shape, baseColor, darkColor, lightColor]);

  const cssText = `border-radius: ${effectiveRadius}px;\nbackground: ${background};\nbox-shadow: ${boxShadow};`;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Neumorphism" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div
          className={styles.previewPanel}
          variants={revealItem}
          style={{ background: baseColor }}
        >
          <div
            className={styles.previewBox}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: `${effectiveRadius}px`,
              background,
              boxShadow,
            }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
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

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="size">
                Size <span className={styles.fieldValue}>{size}px</span>
              </label>
              <input
                id="size"
                type="range"
                min={100}
                max={320}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="radius">
                Border radius <span className={styles.fieldValue}>{effectiveRadius}px</span>
              </label>
              <input
                id="radius"
                type="range"
                min={0}
                max={maxRadius}
                value={effectiveRadius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="distance">
                Distance <span className={styles.fieldValue}>{distance}px</span>
              </label>
              <input
                id="distance"
                type="range"
                min={5}
                max={50}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="blur">
                Blur intensity{" "}
                <span className={styles.fieldValue}>{effectiveBlur}px</span>
              </label>
              <input
                id="blur"
                type="range"
                min={0}
                max={140}
                value={effectiveBlur}
                disabled={blurLinked}
                onChange={(e) => setBlur(Number(e.target.value))}
              />
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={blurLinked}
              onChange={(e) => setBlurLinked(e.target.checked)}
            />
            Link blur to distance &times; 2
          </label>

          <div className={styles.field}>
            <label>Shape</label>
            <div className={styles.shapeRow}>
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={clsx(styles.shapeBtn, shape === s.id && styles.shapeBtnActive)}
                  onClick={() => setShape(s.id)}
                >
                  {s.label}
                </button>
              ))}
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

export { Neumorphism };
