import { useMemo, useState } from "react";
import { Check, Copy, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./GradientText.module.css";

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

interface GradientTextState {
  text: string;
  fontSize: number;
  fontWeight: number;
  angle: number;
  stops: ColorStop[];
}

const DEFAULT_STATE: GradientTextState = {
  text: "Gradient",
  fontSize: 72,
  fontWeight: 700,
  angle: 90,
  stops: [makeStop("#3b82f6", 0), makeStop("#8b5cf6", 100)],
};

export function GradientText() {
  const ready = useRevealReady();
  const [state, setState] = useUrlState<GradientTextState>(DEFAULT_STATE);
  const { text, fontSize, fontWeight, angle, stops } = state;
  const [copied, setCopied] = useState(false);

  const composed = useMemo(() => composeGradient(angle, stops), [angle, stops]);

  const cssText = `background: ${composed};
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
color: transparent;
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

  function setAngle(angle: number) {
    setState((prev) => ({ ...prev, angle }));
  }

  function updateStop(id: string, patch: Partial<ColorStop>) {
    setState((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function addStop() {
    if (stops.length >= 4) return;
    setState((prev) => ({ ...prev, stops: [...prev.stops, makeStop("#ffffff", 50)] }));
  }

  function removeStop(id: string) {
    if (stops.length <= 2) return;
    setState((prev) => ({ ...prev, stops: prev.stops.filter((s) => s.id !== id) }));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Gradient Text" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <span
            className={styles.previewText}
            style={{
              backgroundImage: composed,
              fontSize: `${fontSize}px`,
              fontWeight,
            }}
          >
            {text || "Gradient"}
          </span>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="sampleText">Sample text</label>
            <input
              id="sampleText"
              type="text"
              className={styles.textInput}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Gradient"
            />
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
              <label htmlFor="fontWeight">
                Font weight <span className={styles.fieldValue}>{fontWeight}</span>
              </label>
              <input
                id="fontWeight"
                type="range"
                min={400}
                max={900}
                step={100}
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
              />
            </div>
          </div>

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

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={addStop}
              disabled={stops.length >= 4}
            >
              <Plus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Add stop
            </button>
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

export default GradientText;
