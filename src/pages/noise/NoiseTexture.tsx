import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./NoiseTexture.module.css";

type NoiseType = "fractalNoise" | "turbulence";

function buildSvg(
  baseFrequency: number,
  numOctaves: number,
  type: NoiseType,
  opacity: number
): string {
  return `<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='${type}' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='${opacity}'/></svg>`;
}

function toDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.outputBlock}>
      <div className={styles.outputHead}>
        <span className={styles.outputLabel}>{label}</span>
        <button
          type="button"
          className={clsx(styles.copyBtn, copied && styles.copied)}
          onClick={copy}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={styles.pre}>{text}</pre>
    </div>
  );
}

export function NoiseTexture() {
  const ready = useRevealReady();
  const [baseFrequency, setBaseFrequency] = useState(0.65);
  const [numOctaves, setNumOctaves] = useState(3);
  const [type, setType] = useState<NoiseType>("fractalNoise");
  const [opacity, setOpacity] = useState(0.4);
  const [baseColor, setBaseColor] = useState("#f4f4f5");

  const svg = useMemo(
    () => buildSvg(baseFrequency, numOctaves, type, opacity),
    [baseFrequency, numOctaves, type, opacity]
  );

  const dataUri = useMemo(() => toDataUri(svg), [svg]);

  const cssText = `background-color: ${baseColor};\nbackground-image: url("${dataUri}");`;

  return (
    <Frame wide>
      <SectionHeading title="Noise Texture" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewBox}
            style={{
              backgroundColor: baseColor,
              backgroundImage: `url("${dataUri}")`,
            }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="baseFrequency">
                Base frequency{" "}
                <span className={styles.fieldValue}>{baseFrequency.toFixed(2)}</span>
              </label>
              <input
                id="baseFrequency"
                type="range"
                min={0.1}
                max={2}
                step={0.01}
                value={baseFrequency}
                onChange={(e) => setBaseFrequency(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="numOctaves">
                Octaves <span className={styles.fieldValue}>{numOctaves}</span>
              </label>
              <input
                id="numOctaves"
                type="range"
                min={1}
                max={5}
                step={1}
                value={numOctaves}
                onChange={(e) => setNumOctaves(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="type">Type</label>
              <select
                id="type"
                className={styles.select}
                value={type}
                onChange={(e) => setType(e.target.value as NoiseType)}
              >
                <option value="fractalNoise">fractalNoise</option>
                <option value="turbulence">turbulence</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="opacity">
                Opacity <span className={styles.fieldValue}>{opacity.toFixed(2)}</span>
              </label>
              <input
                id="opacity"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="baseColor">Background color</label>
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
          </div>

          <CopyBlock label="CSS" text={cssText} />
          <CopyBlock label="Data URI" text={dataUri} />
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default NoiseTexture;
