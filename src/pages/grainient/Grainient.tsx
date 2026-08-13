import { useMemo, useState } from "react";
import { Check, Copy, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Grainient.module.css";

type BlendMode = "overlay" | "soft-light" | "multiply" | "screen";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

function makeStop(color: string, position: number): ColorStop {
  return { id: Math.random().toString(36).slice(2), color, position };
}

function composeGradient(angle: number, stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopsCss = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  return `linear-gradient(${angle}deg, ${stopsCss})`;
}

function buildGrainSvg(scale: number, amount: number): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${scale}' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='${amount}'/></svg>`;
}

function buildGrainUrl(scale: number, amount: number): string {
  const svg = buildGrainSvg(scale, amount);
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function Grainient() {
  const ready = useRevealReady();
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<ColorStop[]>([
    makeStop("#3b82f6", 0),
    makeStop("#8b5cf6", 100),
  ]);
  const [grainAmount, setGrainAmount] = useState(0.4);
  const [grainScale, setGrainScale] = useState(0.8);
  const [blendMode, setBlendMode] = useState<BlendMode>("overlay");
  const [copied, setCopied] = useState(false);

  const gradientCss = useMemo(() => composeGradient(angle, stops), [angle, stops]);
  const grainUrl = useMemo(
    () => buildGrainUrl(grainScale, grainAmount),
    [grainScale, grainAmount]
  );

  const previewStyle = {
    backgroundImage: `${grainUrl}, ${gradientCss}`,
    backgroundBlendMode: `${blendMode}, normal`,
  };

  const cssText = `background-image: ${grainUrl}, ${gradientCss};\nbackground-blend-mode: ${blendMode}, normal;`;

  function updateStop(id: string, patch: Partial<ColorStop>) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addStop() {
    if (stops.length >= 4) return;
    setStops((prev) => [...prev, makeStop("#ffffff", 50)]);
  }

  function removeStop(id: string) {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((s) => s.id !== id));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Grainy Gradient" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div className={styles.previewBox} style={previewStyle} />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="angle">
              Angle <span className={styles.fieldValue}>{angle}°</span>
            </label>
            <div className={styles.angleRow}>
              <input
                id="angle"
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
              />
              <input
                type="number"
                className={styles.numberInput}
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.stops}>
            {stops.map((stop, idx) => (
              <div className={styles.stop} key={stop.id}>
                <div className={styles.stopHead}>
                  <span className={styles.stopTitle}>Stop {idx + 1}</span>
                  {stops.length > 2 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label="Remove stop"
                      onClick={() => removeStop(stop.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Color</label>
                    <div className={styles.colorRow}>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.textInput}
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>
                      Position <span className={styles.fieldValue}>{stop.position}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(e) =>
                        updateStop(stop.id, { position: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stops.length < 4 && (
            <button type="button" className={styles.addBtn} onClick={addStop}>
              <Plus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Add stop
            </button>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="grainAmount">
                Grain amount <span className={styles.fieldValue}>{grainAmount.toFixed(2)}</span>
              </label>
              <input
                id="grainAmount"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={grainAmount}
                onChange={(e) => setGrainAmount(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="grainScale">
                Grain scale <span className={styles.fieldValue}>{grainScale.toFixed(2)}</span>
              </label>
              <input
                id="grainScale"
                type="range"
                min={0.2}
                max={1.5}
                step={0.01}
                value={grainScale}
                onChange={(e) => setGrainScale(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="blendMode">Blend mode</label>
            <select
              id="blendMode"
              className={styles.select}
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value as BlendMode)}
            >
              <option value="overlay">Overlay</option>
              <option value="soft-light">Soft light</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
            </select>
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

export default Grainient;
