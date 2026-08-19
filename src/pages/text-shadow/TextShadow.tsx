import { useMemo, useState } from "react";
import { Check, Copy, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./TextShadow.module.css";

interface ShadowLayer {
  id: string;
  x: number;
  y: number;
  blur: number;
  color: string;
  opacity: number;
}

function makeLayer(): ShadowLayer {
  return {
    id: Math.random().toString(36).slice(2),
    x: 2,
    y: 2,
    blur: 6,
    color: "#000000",
    opacity: 0.4,
  };
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function layerToCss(layer: ShadowLayer): string {
  const color = hexToRgba(layer.color, layer.opacity);
  return `${layer.x}px ${layer.y}px ${layer.blur}px ${color}`;
}

const weightOptions = [400, 600, 700, 800] as const;

interface TextShadowState {
  layers: ShadowLayer[];
  text: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
}

const DEFAULT_STATE: TextShadowState = {
  layers: [makeLayer()],
  text: "Toolbox",
  fontSize: 64,
  fontWeight: 700,
  textColor: "#09090b",
};

export function TextShadow() {
  const ready = useRevealReady();
  const [state, setState] = useUrlState<TextShadowState>(DEFAULT_STATE);
  const { layers, text, fontSize, fontWeight, textColor } = state;
  const [copied, setCopied] = useState(false);

  const composed = useMemo(
    () => layers.map(layerToCss).join(",\n  "),
    [layers]
  );

  const cssText = `text-shadow: ${composed};
color: ${textColor};
font-size: ${fontSize}px;
font-weight: ${fontWeight};`;

  function setText(text: string) {
    setState((prev) => ({ ...prev, text }));
  }

  function setFontSize(fontSize: number) {
    setState((prev) => ({ ...prev, fontSize }));
  }

  function setFontWeight(fontWeight: number) {
    setState((prev) => ({ ...prev, fontWeight }));
  }

  function setTextColor(textColor: string) {
    setState((prev) => ({ ...prev, textColor }));
  }

  function updateLayer(id: string, patch: Partial<ShadowLayer>) {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }

  function addLayer() {
    setState((prev) => ({ ...prev, layers: [...prev.layers, makeLayer()] }));
  }

  function removeLayer(id: string) {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Text Shadow Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <span
            className={styles.previewText}
            style={{
              textShadow: layers.length ? composed : "none",
              fontSize: `${fontSize}px`,
              fontWeight,
              color: textColor,
            }}
          >
            {text || "Toolbox"}
          </span>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="sampleText">Sample text</label>
              <input
                id="sampleText"
                type="text"
                className={styles.textInput}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="textColor">Text color</label>
              <div className={styles.colorRow}>
                <input
                  id="textColor"
                  type="color"
                  className={styles.colorInput}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fontSize">
                Font size <span className={styles.fieldValue}>{fontSize}px</span>
              </label>
              <input
                id="fontSize"
                type="range"
                min={24}
                max={140}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="fontWeight">Font weight</label>
              <select
                id="fontWeight"
                className={styles.selectInput}
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
              >
                {weightOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.layers}>
            {layers.map((layer, idx) => (
              <div className={styles.layer} key={layer.id}>
                <div className={styles.layerHead}>
                  <span className={styles.layerTitle}>Layer {idx + 1}</span>
                  {layers.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label="Remove layer"
                      onClick={() => removeLayer(layer.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>
                      Offset X <span className={styles.fieldValue}>{layer.x}px</span>
                    </label>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={layer.x}
                      onChange={(e) =>
                        updateLayer(layer.id, { x: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Offset Y <span className={styles.fieldValue}>{layer.y}px</span>
                    </label>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={layer.y}
                      onChange={(e) =>
                        updateLayer(layer.id, { y: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Blur <span className={styles.fieldValue}>{layer.blur}px</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={layer.blur}
                      onChange={(e) =>
                        updateLayer(layer.id, { blur: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Color</label>
                    <div className={styles.colorRow}>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={layer.color}
                        onChange={(e) =>
                          updateLayer(layer.id, { color: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className={styles.textInput}
                        value={layer.color}
                        onChange={(e) =>
                          updateLayer(layer.id, { color: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>
                      Opacity <span className={styles.fieldValue}>{layer.opacity}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={layer.opacity}
                      onChange={(e) =>
                        updateLayer(layer.id, { opacity: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addBtn} onClick={addLayer}>
            <Plus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Add layer
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

export default TextShadow;
