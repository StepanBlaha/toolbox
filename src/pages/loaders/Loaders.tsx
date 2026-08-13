import { useMemo, useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { LOADERS, type CssValues } from "./loaderDefs";
import styles from "./Loaders.module.css";

const PREVIEW_SCOPE = ".loader-preview";

export function Loaders() {
  const ready = useRevealReady();
  const [selectedId, setSelectedId] = useState(LOADERS[0].id);
  const [size, setSize] = useState(48);
  const [color, setColor] = useState("#3b82f6");
  const [speed, setSpeed] = useState(1.2);
  const [thickness, setThickness] = useState(4);
  const [copied, setCopied] = useState(false);

  const loader = useMemo(
    () => LOADERS.find((l) => l.id === selectedId) ?? LOADERS[0],
    [selectedId]
  );

  const previewValues: CssValues = {
    size: "var(--size)",
    color: "var(--color)",
    speed: "var(--speed)",
    thickness: "var(--thickness)",
  };

  const outputValues: CssValues = {
    size: `${size}px`,
    color,
    speed: `${speed}s`,
    thickness: `${thickness}px`,
  };

  const previewCss = useMemo(
    () => loader.buildCss(previewValues, PREVIEW_SCOPE),
    [loader]
  );

  const outputCss = useMemo(
    () => loader.buildCss(outputValues, ""),
    [loader, size, color, speed, thickness]
  );

  const fullOutput = `/* HTML
${loader.html}
*/

${outputCss}`;

  const previewVars = {
    "--size": `${size}px`,
    "--color": color,
    "--speed": `${speed}s`,
    "--thickness": `${thickness}px`,
  } as CSSProperties;

  async function copy() {
    await navigator.clipboard.writeText(fullOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="CSS Loaders" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <style>{previewCss}</style>
          <div
            className={clsx("loader-preview", styles.loaderPreview)}
            style={previewVars}
            dangerouslySetInnerHTML={{ __html: loader.html }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label>Loader type</label>
            <div className={styles.chipRow}>
              {LOADERS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={clsx(
                    styles.chip,
                    selectedId === l.id && styles.chipActive
                  )}
                  onClick={() => setSelectedId(l.id)}
                >
                  {l.label}
                </button>
              ))}
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
                min={16}
                max={120}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="speed">
                Speed <span className={styles.fieldValue}>{speed}s</span>
              </label>
              <input
                id="speed"
                type="range"
                min={0.4}
                max={2}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
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
            {loader.usesThickness && (
              <div className={styles.field}>
                <label htmlFor="thickness">
                  Thickness{" "}
                  <span className={styles.fieldValue}>{thickness}px</span>
                </label>
                <input
                  id="thickness"
                  type="range"
                  min={2}
                  max={12}
                  value={thickness}
                  onChange={(e) => setThickness(Number(e.target.value))}
                />
              </div>
            )}
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
            <pre className={styles.pre}>{fullOutput}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Loaders;
