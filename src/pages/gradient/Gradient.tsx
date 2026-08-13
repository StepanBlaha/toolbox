import { useMemo, useState } from "react";
import { Check, Copy, Plus, Shuffle, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Gradient.module.css";

type GradientType = "linear" | "radial" | "conic";
type RadialShape = "circle" | "ellipse";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

interface Preset {
  name: string;
  type: GradientType;
  angle: number;
  shape: RadialShape;
  posX: number;
  posY: number;
  stops: Array<{ color: string; position: number }>;
}

const PRESETS: Preset[] = [
  {
    name: "Sunset",
    type: "linear",
    angle: 135,
    shape: "circle",
    posX: 50,
    posY: 50,
    stops: [
      { color: "#ff7e5f", position: 0 },
      { color: "#feb47b", position: 100 },
    ],
  },
  {
    name: "Ocean",
    type: "linear",
    angle: 90,
    shape: "circle",
    posX: 50,
    posY: 50,
    stops: [
      { color: "#2193b0", position: 0 },
      { color: "#6dd5ed", position: 100 },
    ],
  },
  {
    name: "Dusk",
    type: "linear",
    angle: 45,
    shape: "circle",
    posX: 50,
    posY: 50,
    stops: [
      { color: "#0f2027", position: 0 },
      { color: "#203a43", position: 50 },
      { color: "#2c5364", position: 100 },
    ],
  },
  {
    name: "Peach",
    type: "radial",
    angle: 0,
    shape: "circle",
    posX: 50,
    posY: 50,
    stops: [
      { color: "#ffecd2", position: 0 },
      { color: "#fcb69f", position: 100 },
    ],
  },
  {
    name: "Aurora",
    type: "conic",
    angle: 0,
    shape: "circle",
    posX: 50,
    posY: 50,
    stops: [
      { color: "#12c2e9", position: 0 },
      { color: "#c471ed", position: 50 },
      { color: "#f64f59", position: 100 },
    ],
  },
];

function makeStop(color: string, position: number): ColorStop {
  return { id: Math.random().toString(36).slice(2), color, position };
}

function randomHex(): string {
  const n = Math.floor(Math.random() * 0xffffff);
  return `#${n.toString(16).padStart(6, "0")}`;
}

function composeGradient(
  type: GradientType,
  angle: number,
  shape: RadialShape,
  posX: number,
  posY: number,
  stops: ColorStop[]
): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopsCss = sorted
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");

  if (type === "linear") {
    return `linear-gradient(${angle}deg, ${stopsCss})`;
  }
  if (type === "radial") {
    return `radial-gradient(${shape} at ${posX}% ${posY}%, ${stopsCss})`;
  }
  return `conic-gradient(from ${angle}deg at ${posX}% ${posY}%, ${stopsCss})`;
}

export function Gradient() {
  const ready = useRevealReady();
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [shape, setShape] = useState<RadialShape>("circle");
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [stops, setStops] = useState<ColorStop[]>([
    makeStop("#3b82f6", 0),
    makeStop("#8b5cf6", 100),
  ]);
  const [copied, setCopied] = useState(false);

  const composed = useMemo(
    () => composeGradient(type, angle, shape, posX, posY, stops),
    [type, angle, shape, posX, posY, stops]
  );

  const cssText = `background: ${composed};`;

  function updateStop(id: string, patch: Partial<ColorStop>) {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function addStop() {
    setStops((prev) => [...prev, makeStop(randomHex(), 50)]);
  }

  function removeStop(id: string) {
    setStops((prev) => prev.filter((s) => s.id !== id));
  }

  function applyPreset(preset: Preset) {
    setType(preset.type);
    setAngle(preset.angle);
    setShape(preset.shape);
    setPosX(preset.posX);
    setPosY(preset.posY);
    setStops(preset.stops.map((s) => makeStop(s.color, s.position)));
  }

  function randomize() {
    const count = 2 + Math.floor(Math.random() * 2);
    const next: ColorStop[] = [];
    for (let i = 0; i < count; i += 1) {
      next.push(
        makeStop(randomHex(), Math.round((i / (count - 1 || 1)) * 100))
      );
    }
    setStops(next);
    setAngle(Math.floor(Math.random() * 360));
    setPosX(Math.floor(Math.random() * 100));
    setPosY(Math.floor(Math.random() * 100));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Gradient Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewBox}
            style={{ background: composed }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label>Type</label>
            <div className={styles.typeRow}>
              {(["linear", "radial", "conic"] as GradientType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={clsx(styles.typeBtn, type === t && styles.typeBtnActive)}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type === "linear" && (
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
          )}

          {(type === "radial" || type === "conic") && (
            <div className={styles.row}>
              {type === "radial" && (
                <div className={styles.field}>
                  <label htmlFor="shape">Shape</label>
                  <select
                    id="shape"
                    className={styles.select}
                    value={shape}
                    onChange={(e) => setShape(e.target.value as RadialShape)}
                  >
                    <option value="circle">Circle</option>
                    <option value="ellipse">Ellipse</option>
                  </select>
                </div>
              )}
              {type === "conic" && (
                <div className={styles.field}>
                  <label htmlFor="conicAngle">
                    Start angle <span className={styles.fieldValue}>{angle}°</span>
                  </label>
                  <input
                    id="conicAngle"
                    type="range"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                  />
                </div>
              )}
              <div className={styles.field}>
                <label htmlFor="posX">
                  Position X <span className={styles.fieldValue}>{posX}%</span>
                </label>
                <input
                  id="posX"
                  type="range"
                  min={0}
                  max={100}
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="posY">
                  Position Y <span className={styles.fieldValue}>{posY}%</span>
                </label>
                <input
                  id="posY"
                  type="range"
                  min={0}
                  max={100}
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                />
              </div>
            </div>
          )}

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
                        onChange={(e) =>
                          updateStop(stop.id, { color: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className={styles.textInput}
                        value={stop.color}
                        onChange={(e) =>
                          updateStop(stop.id, { color: e.target.value })
                        }
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

          <div className={styles.actionsRow}>
            <button type="button" className={styles.addBtn} onClick={addStop}>
              <Plus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Add stop
            </button>
            <button type="button" className={styles.addBtn} onClick={randomize}>
              <Shuffle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Randomize
            </button>
          </div>

          <div className={styles.field}>
            <label>Presets</label>
            <div className={styles.presetsRow}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className={styles.presetChip}
                  style={{
                    background: composeGradient(
                      preset.type,
                      preset.angle,
                      preset.shape,
                      preset.posX,
                      preset.posY,
                      preset.stops.map((s) => makeStop(s.color, s.position))
                    ),
                  }}
                  onClick={() => applyPreset(preset)}
                  title={preset.name}
                >
                  <span className={styles.presetChipLabel}>{preset.name}</span>
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

export default Gradient;
