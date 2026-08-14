import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Download, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Dither.module.css";

type Algorithm = "none" | "floyd-steinberg" | "atkinson" | "bayer" | "threshold";
type PaletteMode = "bw" | "grayscale" | "gameboy" | "cga" | "custom";

type Rgb = [number, number, number];

const ALGORITHMS: { id: Algorithm; label: string }[] = [
  { id: "none", label: "None" },
  { id: "floyd-steinberg", label: "Floyd–Steinberg" },
  { id: "atkinson", label: "Atkinson" },
  { id: "bayer", label: "Ordered (Bayer)" },
  { id: "threshold", label: "Threshold" },
];

const PALETTES: { id: PaletteMode; label: string }[] = [
  { id: "bw", label: "1-bit B&W" },
  { id: "grayscale", label: "Grayscale" },
  { id: "gameboy", label: "Game Boy" },
  { id: "cga", label: "CGA" },
  { id: "custom", label: "Custom 2-color" },
];

const GAMEBOY_PALETTE: Rgb[] = [
  [15, 56, 15],
  [48, 98, 48],
  [139, 172, 15],
  [155, 188, 15],
];

const CGA_PALETTE: Rgb[] = [
  [0, 0, 0],
  [85, 255, 255],
  [255, 85, 255],
  [255, 255, 255],
];

// 4x4 Bayer threshold matrix, values 0..15.
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const MAX_WORKING_DIMENSION = 600;

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, v));
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function buildPalette(
  mode: PaletteMode,
  levels: number,
  ink: string,
  paper: string
): Rgb[] {
  switch (mode) {
    case "bw":
      return [
        [0, 0, 0],
        [255, 255, 255],
      ];
    case "grayscale": {
      const n = Math.max(2, Math.min(16, levels));
      const palette: Rgb[] = [];
      for (let i = 0; i < n; i++) {
        const v = Math.round((i / (n - 1)) * 255);
        palette.push([v, v, v]);
      }
      return palette;
    }
    case "gameboy":
      return GAMEBOY_PALETTE;
    case "cga":
      return CGA_PALETTE;
    case "custom":
      return [hexToRgb(ink), hexToRgb(paper)];
    default:
      return [
        [0, 0, 0],
        [255, 255, 255],
      ];
  }
}

/** Finds the closest palette color to `rgb` by squared euclidean distance. */
function nearestColor(rgb: Rgb, palette: Rgb[]): Rgb {
  let best = palette[0];
  let bestDist = Infinity;
  for (const candidate of palette) {
    const dr = rgb[0] - candidate[0];
    const dg = rgb[1] - candidate[1];
    const db = rgb[2] - candidate[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}

function applyBrightnessContrast(
  data: Uint8ClampedArray,
  brightness: number,
  contrast: number
) {
  const c = contrast * 2.55; // map -100..100 -> -255..255
  const factor = (259 * (c + 255)) / (255 * (259 - c));
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const v = factor * (data[i + ch] - 128) + 128 + brightness;
      data[i + ch] = clampByte(v);
    }
  }
}

function applyInvert(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
}

function quantizeNone(data: Uint8ClampedArray, palette: Rgb[]) {
  for (let i = 0; i < data.length; i += 4) {
    const rgb: Rgb = [data[i], data[i + 1], data[i + 2]];
    const match = nearestColor(rgb, palette);
    data[i] = match[0];
    data[i + 1] = match[1];
    data[i + 2] = match[2];
  }
}

function quantizeThreshold(data: Uint8ClampedArray, palette: Rgb[]) {
  // Same operation as "none" - a direct per-pixel nearest-palette mapping
  // with no error diffusion or bias.
  quantizeNone(data, palette);
}

function diffuseError(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  errR: number,
  errG: number,
  errB: number,
  factor: number
) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  data[idx] = clampByte(data[idx] + errR * factor);
  data[idx + 1] = clampByte(data[idx + 1] + errG * factor);
  data[idx + 2] = clampByte(data[idx + 2] + errB * factor);
}

function floydSteinbergDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Rgb[]
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const old: Rgb = [data[idx], data[idx + 1], data[idx + 2]];
      const match = nearestColor(old, palette);
      data[idx] = match[0];
      data[idx + 1] = match[1];
      data[idx + 2] = match[2];

      const errR = old[0] - match[0];
      const errG = old[1] - match[1];
      const errB = old[2] - match[2];

      diffuseError(data, width, height, x + 1, y, errR, errG, errB, 7 / 16);
      diffuseError(data, width, height, x - 1, y + 1, errR, errG, errB, 3 / 16);
      diffuseError(data, width, height, x, y + 1, errR, errG, errB, 5 / 16);
      diffuseError(data, width, height, x + 1, y + 1, errR, errG, errB, 1 / 16);
    }
  }
}

function atkinsonDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Rgb[]
) {
  const offsets: [number, number][] = [
    [1, 0],
    [2, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [0, 2],
  ];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const old: Rgb = [data[idx], data[idx + 1], data[idx + 2]];
      const match = nearestColor(old, palette);
      data[idx] = match[0];
      data[idx + 1] = match[1];
      data[idx + 2] = match[2];

      const errR = old[0] - match[0];
      const errG = old[1] - match[1];
      const errB = old[2] - match[2];

      for (const [dx, dy] of offsets) {
        diffuseError(data, width, height, x + dx, y + dy, errR, errG, errB, 1 / 8);
      }
    }
  }
}

function bayerDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Rgb[]
) {
  // Spread controls how strongly the threshold matrix biases each pixel
  // before quantizing - scaled down as the palette grows denser.
  const spread = 255 / Math.max(2, palette.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * spread;
      const biased: Rgb = [
        clampByte(data[idx] + threshold),
        clampByte(data[idx + 1] + threshold),
        clampByte(data[idx + 2] + threshold),
      ];
      const match = nearestColor(biased, palette);
      data[idx] = match[0];
      data[idx + 1] = match[1];
      data[idx + 2] = match[2];
    }
  }
}

function applyDithering(
  algorithm: Algorithm,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: Rgb[]
) {
  switch (algorithm) {
    case "none":
      quantizeNone(data, palette);
      break;
    case "threshold":
      quantizeThreshold(data, palette);
      break;
    case "floyd-steinberg":
      floydSteinbergDither(data, width, height, palette);
      break;
    case "atkinson":
      atkinsonDither(data, width, height, palette);
      break;
    case "bayer":
      bayerDither(data, width, height, palette);
      break;
  }
}

export function Dither() {
  const ready = useRevealReady();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("floyd-steinberg");
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("bw");
  const [levels, setLevels] = useState(4);
  const [inkColor, setInkColor] = useState("#0f380f");
  const [paperColor, setPaperColor] = useState("#9bbc0f");
  const [pixelScale, setPixelScale] = useState(3);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [invert, setInvert] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const smallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const process = useCallback(() => {
    const img = imgElRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    if (!workCanvasRef.current) workCanvasRef.current = document.createElement("canvas");
    if (!smallCanvasRef.current) smallCanvasRef.current = document.createElement("canvas");
    const workCanvas = workCanvasRef.current;
    const smallCanvas = smallCanvasRef.current;

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > MAX_WORKING_DIMENSION ? MAX_WORKING_DIMENSION / longest : 1;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    workCanvas.width = width;
    workCanvas.height = height;
    const workCtx = workCanvas.getContext("2d");
    if (!workCtx) {
      setError("Could not read image pixels in this browser.");
      return;
    }
    workCtx.drawImage(img, 0, 0, width, height);

    let workData: ImageData;
    try {
      workData = workCtx.getImageData(0, 0, width, height);
    } catch {
      setError("Could not read image pixels (possibly a cross-origin image).");
      return;
    }

    applyBrightnessContrast(workData.data, brightness, contrast);
    if (invert) applyInvert(workData.data);
    workCtx.putImageData(workData, 0, 0);

    const scaleFactor = Math.max(1, Math.min(12, pixelScale));
    const smallWidth = Math.max(1, Math.round(width / scaleFactor));
    const smallHeight = Math.max(1, Math.round(height / scaleFactor));

    smallCanvas.width = smallWidth;
    smallCanvas.height = smallHeight;
    const smallCtx = smallCanvas.getContext("2d");
    if (!smallCtx) {
      setError("Could not read image pixels in this browser.");
      return;
    }
    smallCtx.drawImage(workCanvas, 0, 0, smallWidth, smallHeight);

    let smallData: ImageData;
    try {
      smallData = smallCtx.getImageData(0, 0, smallWidth, smallHeight);
    } catch {
      setError("Could not read image pixels (possibly a cross-origin image).");
      return;
    }

    const palette = buildPalette(paletteMode, levels, inkColor, paperColor);
    applyDithering(algorithm, smallData.data, smallWidth, smallHeight, palette);
    smallCtx.putImageData(smallData, 0, 0);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not read image pixels in this browser.");
      return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(smallCanvas, 0, 0, smallWidth, smallHeight, 0, 0, width, height);
  }, [algorithm, paletteMode, levels, inkColor, paperColor, pixelScale, brightness, contrast, invert]);

  useEffect(() => {
    if (imageSrc) process();
  }, [imageSrc, process]);

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

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export the image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dither.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <Frame wide>
      <SectionHeading title="Dither & Retro" />

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
            <span className={styles.dropText}>Drop an image or click to upload</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFileInput}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.previewWrap}>
            {imageSrc ? (
              <>
                <canvas
                  ref={canvasRef}
                  className={clsx(styles.canvas, showOriginal && styles.hidden)}
                />
                {showOriginal && (
                  <img src={imageSrc} alt="Original" className={styles.originalImg} />
                )}
              </>
            ) : (
              <div className={styles.empty}>
                <ImagePlus size={22} className={styles.emptyIcon} />
                <span>Upload an image to apply a dithering effect.</span>
              </div>
            )}
          </div>

          {imageSrc && (
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={showOriginal}
                onChange={(e) => setShowOriginal(e.target.checked)}
              />
              Show original
            </label>
          )}
        </motion.div>

        <motion.div className={styles.right} variants={revealItem}>
          <div className={styles.field}>
            <label>Dithering algorithm</label>
            <div className={styles.chipRow}>
              {ALGORITHMS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={clsx(styles.chip, algorithm === a.id && styles.chipActive)}
                  onClick={() => setAlgorithm(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Palette / color mode</label>
            <div className={styles.chipRow}>
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={clsx(styles.chip, paletteMode === p.id && styles.chipActive)}
                  onClick={() => setPaletteMode(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {paletteMode === "grayscale" && (
            <div className={styles.field}>
              <label htmlFor="levels">
                Levels <span className={styles.fieldValue}>{levels}</span>
              </label>
              <input
                id="levels"
                type="range"
                min={2}
                max={16}
                value={levels}
                onChange={(e) => setLevels(Number(e.target.value))}
              />
            </div>
          )}

          {paletteMode === "custom" && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="inkColor">Ink</label>
                <div className={styles.colorRow}>
                  <input
                    id="inkColor"
                    type="color"
                    className={styles.colorInput}
                    value={inkColor}
                    onChange={(e) => setInkColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.textInput}
                    value={inkColor}
                    onChange={(e) => setInkColor(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="paperColor">Paper</label>
                <div className={styles.colorRow}>
                  <input
                    id="paperColor"
                    type="color"
                    className={styles.colorInput}
                    value={paperColor}
                    onChange={(e) => setPaperColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.textInput}
                    value={paperColor}
                    onChange={(e) => setPaperColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="pixelScale">
              Pixel scale <span className={styles.fieldValue}>{pixelScale}x</span>
            </label>
            <input
              id="pixelScale"
              type="range"
              min={1}
              max={12}
              value={pixelScale}
              onChange={(e) => setPixelScale(Number(e.target.value))}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="brightness">
                Brightness <span className={styles.fieldValue}>{brightness}</span>
              </label>
              <input
                id="brightness"
                type="range"
                min={-100}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="contrast">
                Contrast <span className={styles.fieldValue}>{contrast}</span>
              </label>
              <input
                id="contrast"
                type="range"
                min={-100}
                max={100}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
              />
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => setInvert(e.target.checked)}
            />
            Invert
          </label>

          <button
            type="button"
            className={styles.downloadBtn}
            onClick={download}
            disabled={!imageSrc}
          >
            <Download size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Download PNG
          </button>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Dither;
