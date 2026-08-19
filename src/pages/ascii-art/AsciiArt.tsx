import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Check, Copy, Download, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { usePasteImage } from "../../hooks/usePasteImage";
import styles from "./AsciiArt.module.css";

interface AsciiCell {
  char: string;
  color: string;
}

const RAMPS = {
  standard: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  simple: "#. ",
} as const;

type RampKey = keyof typeof RAMPS;

const RAMP_OPTIONS: { key: RampKey; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "blocks", label: "Blocks" },
  { key: "simple", label: "Simple" },
];

// Monospace glyphs are roughly twice as tall as they are wide, so sample
// fewer rows than columns to keep the rendered ASCII from looking stretched.
const CHAR_ASPECT = 0.55;

const MIN_COLUMNS = 30;
const MAX_COLUMNS = 200;
const DEFAULT_COLUMNS = 100;

function brightnessToChar(brightness: number, ramp: string, invert: boolean): string {
  const value = invert ? 255 - brightness : brightness;
  const index = Math.min(
    ramp.length - 1,
    Math.floor((value / 255) * ramp.length)
  );
  return ramp[index];
}

function buildAscii(
  img: HTMLImageElement,
  columns: number,
  ramp: string,
  invert: boolean,
  colored: boolean
): { rows: AsciiCell[][]; plain: string } | null {
  const canvas = document.createElement("canvas");
  const width = columns;
  const height = Math.max(
    1,
    Math.round(
      (img.naturalHeight / img.naturalWidth) * columns * CHAR_ASPECT
    )
  );

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return null;
  }

  const data = imageData.data;
  const rows: AsciiCell[][] = [];
  const plainLines: string[] = [];

  for (let y = 0; y < height; y++) {
    const row: AsciiCell[] = [];
    let plainRow = "";
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const brightness = a === 0 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
      const char = brightnessToChar(brightness, ramp, invert);
      const color = a === 0 || !colored ? "" : `rgb(${r}, ${g}, ${b})`;

      row.push({ char, color });
      plainRow += char;
    }
    rows.push(row);
    plainLines.push(plainRow);
  }

  return { rows, plain: plainLines.join("\n") };
}

export function AsciiArt() {
  const ready = useRevealReady();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rows, setRows] = useState<AsciiCell[][]>([]);
  const [plainText, setPlainText] = useState("");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rampKey, setRampKey] = useState<RampKey>("standard");
  const [invert, setInvert] = useState(false);
  const [colored, setColored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const runConversion = useCallback(
    (cols: number, ramp: RampKey, inv: boolean, col: boolean) => {
      const img = imgElRef.current;
      if (!img) return;

      const result = buildAscii(img, cols, RAMPS[ramp], inv, col);
      if (!result) {
        setError("Could not read image pixels in this browser.");
        return;
      }

      setRows(result.rows);
      setPlainText(result.plain);
    },
    []
  );

  const loadFile = useCallback(
    (file: File) => {
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
      const img = new Image();
      img.onload = () => {
        imgElRef.current = img;
        objectUrlRef.current = url;
        setImageSrc(url);
        runConversion(columns, rampKey, invert, colored);
      };
      img.onerror = () => {
        setError("Could not load that image.");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [columns, rampKey, invert, colored, runConversion]
  );

  usePasteImage(loadFile);

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

  function handleColumnsChange(value: number) {
    setColumns(value);
    if (imgElRef.current) runConversion(value, rampKey, invert, colored);
  }

  function handleRampChange(value: RampKey) {
    setRampKey(value);
    if (imgElRef.current) runConversion(columns, value, invert, colored);
  }

  function handleInvertChange(value: boolean) {
    setInvert(value);
    if (imgElRef.current) runConversion(columns, rampKey, value, colored);
  }

  function handleColoredChange(value: boolean) {
    setColored(value);
    if (imgElRef.current) runConversion(columns, rampKey, invert, value);
  }

  async function copy() {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const blob = new globalThis.Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (rows.length === 0) return;
    const cols = rows[0]?.length ?? 0;
    if (cols === 0) return;

    const fontSize = 8;
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(cols * charWidth);
    canvas.height = Math.ceil(rows.length * lineHeight);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px "Geist Mono", monospace`;
    ctx.textBaseline = "top";

    rows.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = colored && cell.color ? cell.color : "#e4e4e7";
        ctx.fillText(cell.char, x * charWidth, y * lineHeight);
      });
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ascii-art.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  const hasImage = rows.length > 0;

  return (
    <Frame wide>
      <SectionHeading title="Image to ASCII" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.left} variants={revealItem}>
          <div
            className={clsx(styles.dropzone, isDragging && styles.dropzoneActive)}
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
            <Upload size={22} className={styles.dropIcon} />
            <span className={styles.dropText}>Drop, click, or paste an image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFileInput}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {imageSrc && (
            <div className={styles.previewWrap}>
              <img src={imageSrc} alt="Uploaded preview" className={styles.preview} />
            </div>
          )}

          <div className={styles.asciiPreviewWrap}>
            {hasImage ? (
              <pre className={styles.asciiPreview}>
                {colored
                  ? rows.map((row, y) => (
                      <div key={y}>
                        {row.map((cell, x) => (
                          <span
                            key={x}
                            style={cell.color ? { color: cell.color } : undefined}
                          >
                            {cell.char}
                          </span>
                        ))}
                      </div>
                    ))
                  : plainText}
              </pre>
            ) : (
              <div className={styles.empty}>
                <ImagePlus size={22} className={styles.emptyIcon} />
                <span>Upload an image to see its ASCII rendering.</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className={styles.right} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="columns">
              Width <span className={styles.fieldValue}>{columns} cols</span>
            </label>
            <input
              id="columns"
              type="range"
              min={MIN_COLUMNS}
              max={MAX_COLUMNS}
              value={columns}
              onChange={(e) => handleColumnsChange(Number(e.target.value))}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ramp">Character set</label>
            <select
              id="ramp"
              className={styles.select}
              value={rampKey}
              onChange={(e) => handleRampChange(e.target.value as RampKey)}
            >
              {RAMP_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => handleInvertChange(e.target.checked)}
            />
            Invert brightness
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={colored}
              onChange={(e) => handleColoredChange(e.target.checked)}
            />
            Colored
          </label>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>ASCII output</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copy}
                disabled={!hasImage}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{hasImage ? plainText : ""}</pre>
          </div>

          <div className={styles.downloadRow}>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={downloadTxt}
              disabled={!hasImage}
            >
              <Download size={13} />
              Download .txt
            </button>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={downloadPng}
              disabled={!hasImage}
            >
              <Download size={13} />
              Download .png
            </button>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default AsciiArt;
