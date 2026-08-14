import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Check, Copy, Download, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./MaskedText.module.css";

type SourceType = "image" | "gradient";
type FontFamilyKey = "sans" | "serif" | "mono";

const FONT_STACKS: Record<FontFamilyKey, string> = {
  sans: "var(--sans)",
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: "var(--mono)",
};

const CANVAS_FONT_STACKS: Record<FontFamilyKey, string> = {
  sans: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

const CANVAS_PADDING = 48;

interface GradientLineCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Matches the CSS `linear-gradient(<angle>deg, ...)` line-endpoint algorithm. */
function gradientLineCoords(
  angleDeg: number,
  width: number,
  height: number
): GradientLineCoords {
  let angle = angleDeg % 360;
  if (angle < 0) angle += 360;
  const rad = (angle * Math.PI) / 180;

  const length =
    Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
  const half = length / 2;
  const cx = width / 2;
  const cy = height / 2;

  // 0deg = "to top" in CSS.
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);

  return {
    x1: cx - dx * half,
    y1: cy - dy * half,
    x2: cx + dx * half,
    y2: cy + dy * half,
  };
}

export function MaskedText() {
  const ready = useRevealReady();

  const [text, setText] = useState("HELLO");
  const [fontSize, setFontSize] = useState(120);
  const [fontWeight, setFontWeight] = useState(800);
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>("sans");
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.1);

  const [sourceType, setSourceType] = useState<SourceType>("gradient");
  const [angle, setAngle] = useState(135);
  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#f97316");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const gradientCss = useMemo(
    () => `linear-gradient(${angle}deg, ${color1}, ${color2})`,
    [angle, color1, color2]
  );

  const backgroundImage = sourceType === "image" && imageSrc ? `url(${imageSrc})` : gradientCss;

  const previewStyle = {
    backgroundImage,
    fontFamily: FONT_STACKS[fontFamily],
    fontSize: `${fontSize}px`,
    fontWeight,
    letterSpacing: `${letterSpacing}px`,
    lineHeight,
  };

  const cssText = `.masked-text {
  background-image: ${
    sourceType === "gradient"
      ? gradientCss
      : "url('your-image.jpg') /* host your own image and point this at it */"
  };
  background-size: cover;
  background-position: center;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  font-family: ${FONT_STACKS[fontFamily]};
  font-size: ${fontSize}px;
  font-weight: ${fontWeight};
  letter-spacing: ${letterSpacing}px;
  line-height: ${lineHeight};
}`;

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That file doesn't look like an image.");
      return;
    }

    setError(null);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      setImageSrc(url);
    };
    img.onerror = () => setError("Could not load that image.");
    img.src = url;
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function copyCss() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function drawCoverImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number
  ) {
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const dx = (width - drawWidth) / 2;
    const dy = (height - drawHeight) / 2;
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  }

  function drawSpacedText(
    ctx: CanvasRenderingContext2D,
    label: string,
    cx: number,
    cy: number,
    spacing: number
  ) {
    if (spacing === 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx, cy);
      return;
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const chars = Array.from(label);
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const totalWidth =
      widths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1);
    let x = cx - totalWidth / 2;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x, cy);
      x += widths[i] + spacing;
    }
  }

  function download() {
    if (sourceType === "image" && !imgElRef.current) {
      setError("Upload an image first.");
      return;
    }

    const canvas = document.createElement("canvas");
    const measureCtx = canvas.getContext("2d");
    if (!measureCtx) {
      setError("Could not create a canvas context in this browser.");
      return;
    }

    const fontSpec = `${fontWeight} ${fontSize}px ${CANVAS_FONT_STACKS[fontFamily]}`;
    measureCtx.font = fontSpec;
    const chars = Array.from(text || " ");
    const charWidths = chars.map((ch) => measureCtx.measureText(ch).width);
    const textWidth =
      charWidths.reduce((sum, w) => sum + w, 0) +
      letterSpacing * Math.max(0, chars.length - 1);

    const width = Math.max(1, Math.round(textWidth + CANVAS_PADDING * 2));
    const height = Math.max(1, Math.round(fontSize * lineHeight + CANVAS_PADDING));

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not create a canvas context in this browser.");
      return;
    }

    if (sourceType === "image" && imgElRef.current) {
      drawCoverImage(ctx, imgElRef.current, width, height);
    } else {
      const { x1, y1, x2, y2 } = gradientLineCoords(angle, width, height);
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalCompositeOperation = "destination-in";
    ctx.font = fontSpec;
    ctx.fillStyle = "#000";
    drawSpacedText(ctx, text || " ", width / 2, height / 2, letterSpacing);
    ctx.globalCompositeOperation = "source-over";

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export the image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "masked-text.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <Frame wide>
      <SectionHeading title="Masked Text" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <span className={styles.maskedText} style={previewStyle}>
            {text || " "}
          </span>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="sampleText">Text</label>
            <input
              id="sampleText"
              type="text"
              className={styles.textInput}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="HELLO"
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
                min={40}
                max={240}
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
                min={700}
                max={900}
                step={100}
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fontFamily">Font family</label>
              <select
                id="fontFamily"
                className={styles.select}
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamilyKey)}
              >
                <option value="sans">Sans</option>
                <option value="serif">Serif</option>
                <option value="mono">Mono</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="letterSpacing">
                Letter spacing{" "}
                <span className={styles.fieldValue}>{letterSpacing}px</span>
              </label>
              <input
                id="letterSpacing"
                type="range"
                min={-10}
                max={40}
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="lineHeight">
              Line height <span className={styles.fieldValue}>{lineHeight.toFixed(2)}</span>
            </label>
            <input
              id="lineHeight"
              type="range"
              min={0.8}
              max={2}
              step={0.05}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
            />
          </div>

          <div className={styles.field}>
            <label>Background source</label>
            <div className={styles.sourceRow}>
              <button
                type="button"
                className={clsx(
                  styles.sourceBtn,
                  sourceType === "image" && styles.sourceBtnActive
                )}
                onClick={() => setSourceType("image")}
              >
                Uploaded image
              </button>
              <button
                type="button"
                className={clsx(
                  styles.sourceBtn,
                  sourceType === "gradient" && styles.sourceBtnActive
                )}
                onClick={() => setSourceType("gradient")}
              >
                Gradient
              </button>
            </div>
          </div>

          {sourceType === "image" ? (
            <div className={styles.field}>
              <div
                className={clsx(
                  styles.dropzone,
                  isDragging && styles.dropzoneActive
                )}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload size={20} className={styles.dropIcon} />
                <span className={styles.dropText}>
                  {imageSrc ? "Replace image" : "Drop an image or click to upload"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={handleFileInput}
                />
              </div>
              {!imageSrc && (
                <p className={styles.hint}>
                  <ImagePlus size={13} /> No image yet - text will render transparent.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label htmlFor="angle">
                  Angle <span className={styles.fieldValue}>{angle}°</span>
                </label>
                <input
                  id="angle"
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="color1">Color 1</label>
                  <div className={styles.colorRow}>
                    <input
                      id="color1"
                      type="color"
                      className={styles.colorInput}
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.textInput}
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="color2">Color 2</label>
                  <div className={styles.colorRow}>
                    <input
                      id="color2"
                      type="color"
                      className={styles.colorInput}
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.textInput}
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="button" className={styles.downloadBtn} onClick={download}>
            <Download size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Download PNG
          </button>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>CSS output</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copyCss}
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

export default MaskedText;
