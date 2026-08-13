import { useMemo, useState, type CSSProperties } from "react";
import { Check, Copy, Layers } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Glass.module.css";

interface Scene {
  id: string;
  label: string;
  gradient: string;
}

const SCENES: Scene[] = [
  {
    id: "sunset",
    label: "Sunset",
    gradient: "linear-gradient(135deg, #ff5f6d 0%, #ffc371 50%, #845ec2 100%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #6a3093 100%)",
  },
  {
    id: "candy",
    label: "Candy",
    gradient: "linear-gradient(135deg, #f72585 0%, #7209b7 50%, #3a0ca3 100%)",
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const bigint = parseInt(full, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function Glass() {
  const ready = useRevealReady();
  const [blur, setBlur] = useState(12);
  const [transparency, setTransparency] = useState(0.25);
  const [saturation, setSaturation] = useState(140);
  const [radius, setRadius] = useState(20);
  const [borderAlpha, setBorderAlpha] = useState(0.3);
  const [tint, setTint] = useState("#ffffff");
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [copied, setCopied] = useState(false);

  const scene = useMemo(
    () => SCENES.find((s) => s.id === sceneId) ?? SCENES[0],
    [sceneId]
  );

  const tintRgb = useMemo(() => hexToRgb(tint), [tint]);
  const bgRgba = `rgba(${tintRgb.r}, ${tintRgb.g}, ${tintRgb.b}, ${transparency})`;
  const borderRgba = `rgba(255, 255, 255, ${borderAlpha})`;

  const glassStyle: CSSProperties = {
    background: bgRgba,
    backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    border: `1px solid ${borderRgba}`,
    borderRadius: `${radius}px`,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  };

  const cssText = `background: ${bgRgba};
backdrop-filter: blur(${blur}px) saturate(${saturation}%);
-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
border: 1px solid ${borderRgba};
border-radius: ${radius}px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);`;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Glassmorphism" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.scene}
            style={{ background: scene.gradient }}
          >
            <div className={styles.card} style={glassStyle}>
              <Layers size={20} className={styles.cardIcon} />
              <span className={styles.cardText}>Glass card</span>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label>Background scene</label>
            <div className={styles.chips}>
              {SCENES.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={clsx(
                    styles.chip,
                    s.id === sceneId && styles.chipActive
                  )}
                  style={{ background: s.gradient }}
                  onClick={() => setSceneId(s.id)}
                  aria-label={s.label}
                >
                  <span className={styles.chipLabel}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="blur">
                Blur <span className={styles.fieldValue}>{blur}px</span>
              </label>
              <input
                id="blur"
                type="range"
                min={0}
                max={30}
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="transparency">
                Transparency{" "}
                <span className={styles.fieldValue}>{transparency}</span>
              </label>
              <input
                id="transparency"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={transparency}
                onChange={(e) => setTransparency(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="saturation">
                Saturation{" "}
                <span className={styles.fieldValue}>{saturation}%</span>
              </label>
              <input
                id="saturation"
                type="range"
                min={100}
                max={200}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="radius">
                Border radius{" "}
                <span className={styles.fieldValue}>{radius}px</span>
              </label>
              <input
                id="radius"
                type="range"
                min={0}
                max={40}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="borderAlpha">
                Border alpha{" "}
                <span className={styles.fieldValue}>{borderAlpha}</span>
              </label>
              <input
                id="borderAlpha"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={borderAlpha}
                onChange={(e) => setBorderAlpha(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="tint">Tint color</label>
              <div className={styles.colorRow}>
                <input
                  id="tint"
                  type="color"
                  className={styles.colorInput}
                  value={tint}
                  onChange={(e) => setTint(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={tint}
                  onChange={(e) => setTint(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className={styles.note}>
            backdrop-filter needs a busy/colored background behind the
            element.
          </p>

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

export default Glass;
export { Glass };
