import { useMemo, useState } from "react";
import { Check, Copy, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./BoxShadow.module.css";

interface ShadowLayer {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

function makeLayer(): ShadowLayer {
  return {
    id: Math.random().toString(36).slice(2),
    x: 0,
    y: 4,
    blur: 12,
    spread: 0,
    color: "#000000",
    opacity: 0.25,
    inset: false,
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
  const inset = layer.inset ? "inset " : "";
  const color = hexToRgba(layer.color, layer.opacity);
  return `${inset}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${color}`;
}

export function BoxShadow() {
  const ready = useRevealReady();
  const [layers, setLayers] = useState<ShadowLayer[]>([makeLayer()]);
  const [radius, setRadius] = useState(12);
  const [boxColor, setBoxColor] = useState("#f4f4f5");
  const [copied, setCopied] = useState(false);

  const composed = useMemo(
    () => layers.map(layerToCss).join(",\n  "),
    [layers]
  );

  const cssText = `box-shadow: ${composed};`;

  function updateLayer(id: string, patch: Partial<ShadowLayer>) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  function addLayer() {
    setLayers((prev) => [...prev, makeLayer()]);
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Box Shadow Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewBox}
            style={{
              borderRadius: `${radius}px`,
              background: boxColor,
              boxShadow: layers.length ? composed : "none",
            }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="radius">
                Border radius <span className={styles.fieldValue}>{radius}px</span>
              </label>
              <input
                id="radius"
                type="range"
                min={0}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="boxColor">Box color</label>
              <div className={styles.colorRow}>
                <input
                  id="boxColor"
                  type="color"
                  className={styles.colorInput}
                  value={boxColor}
                  onChange={(e) => setBoxColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={boxColor}
                  onChange={(e) => setBoxColor(e.target.value)}
                />
              </div>
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
                      min={-100}
                      max={100}
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
                      min={-100}
                      max={100}
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
                      max={100}
                      value={layer.blur}
                      onChange={(e) =>
                        updateLayer(layer.id, { blur: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Spread <span className={styles.fieldValue}>{layer.spread}px</span>
                    </label>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={layer.spread}
                      onChange={(e) =>
                        updateLayer(layer.id, { spread: Number(e.target.value) })
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

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={layer.inset}
                    onChange={(e) =>
                      updateLayer(layer.id, { inset: e.target.checked })
                    }
                  />
                  Inset
                </label>
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
