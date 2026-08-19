import { useMemo, useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./TextStroke.module.css";

type Technique = "native" | "layered";

const weightOptions = [400, 500, 600, 700, 800, 900] as const;

// 8 directional offsets around the glyph, used to fake a uniform outline
// with layered text-shadow when -webkit-text-stroke isn't good enough
// (thick strokes, or browsers that render the native stroke inconsistently).
const DIRECTIONS = [0, 45, 90, 135, 180, 225, 270, 315];

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function layeredStrokeShadows(width: number, color: string): string[] {
  if (width <= 0) return [];
  return DIRECTIONS.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x = round(width * Math.cos(rad));
    const y = round(width * Math.sin(rad));
    return `${x}px ${y}px 0 ${color}`;
  });
}

interface TextStrokeState {
  text: string;
  fontSize: number;
  fontWeight: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  technique: Technique;
  dropEnabled: boolean;
  dropColor: string;
  dropX: number;
  dropY: number;
  dropBlur: number;
}

const DEFAULT_STATE: TextStrokeState = {
  text: "OUTLINE",
  fontSize: 96,
  fontWeight: 800,
  fillColor: "#ffffff",
  strokeColor: "#09090b",
  strokeWidth: 3,
  technique: "native",
  dropEnabled: false,
  dropColor: "#09090b",
  dropX: 4,
  dropY: 4,
  dropBlur: 6,
};

export function TextStroke() {
  const ready = useRevealReady();

  const [state, setState] = useUrlState<TextStrokeState>(DEFAULT_STATE);
  const {
    text,
    fontSize,
    fontWeight,
    fillColor,
    strokeColor,
    strokeWidth,
    technique,
    dropEnabled,
    dropColor,
    dropX,
    dropY,
    dropBlur,
  } = state;

  const [copied, setCopied] = useState(false);

  function setText(text: string) {
    setState((prev) => ({ ...prev, text }));
  }

  function setFontSize(fontSize: number) {
    setState((prev) => ({ ...prev, fontSize }));
  }

  function setFontWeight(fontWeight: number) {
    setState((prev) => ({ ...prev, fontWeight }));
  }

  function setFillColor(fillColor: string) {
    setState((prev) => ({ ...prev, fillColor }));
  }

  function setStrokeColor(strokeColor: string) {
    setState((prev) => ({ ...prev, strokeColor }));
  }

  function setStrokeWidth(strokeWidth: number) {
    setState((prev) => ({ ...prev, strokeWidth }));
  }

  function setTechnique(technique: Technique) {
    setState((prev) => ({ ...prev, technique }));
  }

  function setDropEnabled(dropEnabled: boolean) {
    setState((prev) => ({ ...prev, dropEnabled }));
  }

  function setDropColor(dropColor: string) {
    setState((prev) => ({ ...prev, dropColor }));
  }

  function setDropX(dropX: number) {
    setState((prev) => ({ ...prev, dropX }));
  }

  function setDropY(dropY: number) {
    setState((prev) => ({ ...prev, dropY }));
  }

  function setDropBlur(dropBlur: number) {
    setState((prev) => ({ ...prev, dropBlur }));
  }

  const dropShadow = useMemo(
    () => (dropEnabled ? `${dropX}px ${dropY}px ${dropBlur}px ${dropColor}` : null),
    [dropEnabled, dropX, dropY, dropBlur, dropColor]
  );

  const layeredShadowList = useMemo(
    () => layeredStrokeShadows(strokeWidth, strokeColor),
    [strokeWidth, strokeColor]
  );

  const previewStyle = useMemo(() => {
    const base: CSSProperties = {
      fontSize: `${fontSize}px`,
      fontWeight,
      fontFamily: "var(--sans)",
    };

    if (technique === "native") {
      const shadows = dropShadow ? dropShadow : "none";
      return {
        ...base,
        color: fillColor,
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        textShadow: shadows,
      };
    }

    const shadows = [...layeredShadowList];
    if (dropShadow) shadows.push(dropShadow);
    return {
      ...base,
      color: fillColor,
      textShadow: shadows.length ? shadows.join(", ") : "none",
    };
  }, [
    technique,
    fontSize,
    fontWeight,
    fillColor,
    strokeColor,
    strokeWidth,
    dropShadow,
    layeredShadowList,
  ]);

  const cssText = useMemo(() => {
    if (technique === "native") {
      const lines = [
        `-webkit-text-stroke: ${strokeWidth}px ${strokeColor};`,
        `color: ${fillColor};`,
      ];
      if (dropShadow) lines.push(`text-shadow: ${dropShadow};`);
      lines.push(`font-size: ${fontSize}px;`);
      lines.push(`font-weight: ${fontWeight};`);
      return lines.join("\n");
    }

    const shadows = [...layeredShadowList];
    if (dropShadow) shadows.push(dropShadow);
    const shadowBlock = shadows.length
      ? `text-shadow:\n  ${shadows.join(",\n  ")};`
      : "";
    return [
      `color: ${fillColor};`,
      shadowBlock,
      `font-size: ${fontSize}px;`,
      `font-weight: ${fontWeight};`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    technique,
    fillColor,
    strokeColor,
    strokeWidth,
    dropShadow,
    layeredShadowList,
    fontSize,
    fontWeight,
  ]);

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Text Stroke" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <span className={styles.previewText} style={previewStyle}>
            {text || "OUTLINE"}
          </span>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="techniqueToggle">Technique</label>
            <div className={styles.techToggle} id="techniqueToggle">
              <button
                type="button"
                className={clsx(
                  styles.techBtn,
                  technique === "native" && styles.techBtnActive
                )}
                onClick={() => setTechnique("native")}
              >
                Native
              </button>
              <button
                type="button"
                className={clsx(
                  styles.techBtn,
                  technique === "layered" && styles.techBtnActive
                )}
                onClick={() => setTechnique("layered")}
              >
                Layered shadow
              </button>
            </div>
          </div>

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

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fontSize">
                Font size <span className={styles.fieldValue}>{fontSize}px</span>
              </label>
              <input
                id="fontSize"
                type="range"
                min={24}
                max={160}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="strokeWidth">
                Stroke width{" "}
                <span className={styles.fieldValue}>{strokeWidth}px</span>
              </label>
              <input
                id="strokeWidth"
                type="range"
                min={0}
                max={20}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fillColor">Fill color</label>
              <div className={styles.colorRow}>
                <input
                  id="fillColor"
                  type="color"
                  className={styles.colorInput}
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="strokeColor">Stroke color</label>
              <div className={styles.colorRow}>
                <input
                  id="strokeColor"
                  type="color"
                  className={styles.colorInput}
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.dropSection}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={dropEnabled}
                onChange={(e) => setDropEnabled(e.target.checked)}
              />
              Drop shadow
            </label>

            {dropEnabled && (
              <>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="dropColor">Shadow color</label>
                    <div className={styles.colorRow}>
                      <input
                        id="dropColor"
                        type="color"
                        className={styles.colorInput}
                        value={dropColor}
                        onChange={(e) => setDropColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className={styles.textInput}
                        value={dropColor}
                        onChange={(e) => setDropColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="dropBlur">
                      Blur <span className={styles.fieldValue}>{dropBlur}px</span>
                    </label>
                    <input
                      id="dropBlur"
                      type="range"
                      min={0}
                      max={40}
                      value={dropBlur}
                      onChange={(e) => setDropBlur(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="dropX">
                      Offset X <span className={styles.fieldValue}>{dropX}px</span>
                    </label>
                    <input
                      id="dropX"
                      type="range"
                      min={-40}
                      max={40}
                      value={dropX}
                      onChange={(e) => setDropX(Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="dropY">
                      Offset Y <span className={styles.fieldValue}>{dropY}px</span>
                    </label>
                    <input
                      id="dropY"
                      type="range"
                      min={-40}
                      max={40}
                      value={dropY}
                      onChange={(e) => setDropY(Number(e.target.value))}
                    />
                  </div>
                </div>
              </>
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
            <pre className={styles.pre}>{cssText}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default TextStroke;
