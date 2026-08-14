import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  Download,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Upload,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./NowPlaying.module.css";

type BgMode = "solid" | "gradient" | "auto";
type Theme = "dark" | "light";

const MAX_SAMPLE_DIMENSION = 32;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

function toHex(value: number): string {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = clamp(1 - amount, 0, 1);
  return rgbToHex(r * f, g * f, b * f);
}

/** Downscale the artwork onto a tiny canvas and average its pixels. */
function sampleAverageColor(img: HTMLImageElement): string | null {
  const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
  const scale = Math.min(1, MAX_SAMPLE_DIMENSION / longest);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, width, height);
  } catch {
    return null;
  }

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.data.length; i += 4) {
    const alpha = data.data[i + 3];
    if (alpha < 128) continue;
    r += data.data[i];
    g += data.data[i + 1];
    b += data.data[i + 2];
    n += 1;
  }
  if (n === 0) return null;
  return rgbToHex(r / n, g / n, b / n);
}

/** Cover-fit rect of `img` inside a `size`x`size` square, drawn with rounded corners. */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
) {
  const ratio = img.naturalWidth / img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ratio > 1) {
    sw = img.naturalHeight;
    sx = (img.naturalWidth - sw) / 2;
  } else if (ratio < 1) {
    sh = img.naturalWidth;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, size, size);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  flatX: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(flatX, tipY - height / 2);
  ctx.lineTo(flatX, tipY + height / 2);
  ctx.closePath();
  ctx.fill();
}

export function NowPlaying() {
  const ready = useRevealReady();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoColor, setAutoColor] = useState<string>("#3f3f46");

  const [title, setTitle] = useState("Midnight Static");
  const [artist, setArtist] = useState("The Analog Loop");
  const [album, setAlbum] = useState("Afterglow EP");

  const [currentMin, setCurrentMin] = useState(1);
  const [currentSec, setCurrentSec] = useState(24);
  const [totalMin, setTotalMin] = useState(3);
  const [totalSec, setTotalSec] = useState(47);

  const [bgMode, setBgMode] = useState<BgMode>("gradient");
  const [solidColor, setSolidColor] = useState("#18181b");
  const [gradientA, setGradientA] = useState("#312e81");
  const [gradientB, setGradientB] = useState("#7c3aed");
  const [textColor, setTextColor] = useState("#ffffff");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isPlaying, setIsPlaying] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That file doesn't look like an image.");
      return;
    }
    setError(null);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      setImageSrc(url);
      const avg = sampleAverageColor(img);
      if (avg) setAutoColor(darken(avg, 0.25));
    };
    img.onerror = () => setError("Could not load that image.");
    img.src = url;
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

  function clearImage() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    imgElRef.current = null;
    setImageSrc(null);
  }

  const totalSeconds = totalMin * 60 + totalSec;
  const currentSecondsRaw = currentMin * 60 + currentSec;
  const currentSeconds = clamp(currentSecondsRaw, 0, Math.max(totalSeconds, 0));
  const progress = totalSeconds > 0 ? clamp(currentSeconds / totalSeconds, 0, 1) : 0;

  let cardBackground: string;
  if (bgMode === "solid") {
    cardBackground = solidColor;
  } else if (bgMode === "gradient") {
    cardBackground = `linear-gradient(135deg, ${gradientA}, ${gradientB})`;
  } else {
    cardBackground = imageSrc ? autoColor : solidColor;
  }

  function downloadPng() {
    const SCALE = 2;
    const CARD_W = 380;
    const PAD = 26;
    const ART = CARD_W - PAD * 2;
    const GAP = 18;

    const titleH = 24;
    const artistH = 18;
    const albumH = album.trim() ? 18 : 0;
    const metaH = titleH + artistH + albumH;
    const progressH = 4 + 6 + 14;
    const controlsH = 46;

    const CARD_H = PAD + ART + GAP + metaH + GAP + progressH + GAP + controlsH + PAD;

    const canvas = document.createElement("canvas");
    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not create a canvas in this browser.");
      return;
    }
    ctx.scale(SCALE, SCALE);

    // background
    roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 22);
    if (bgMode === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      grad.addColorStop(0, gradientA);
      grad.addColorStop(1, gradientB);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = cardBackground;
    }
    ctx.fill();

    let y = PAD;

    // artwork
    roundRectPath(ctx, PAD, y, ART, ART, 16);
    ctx.save();
    ctx.clip();
    if (imgElRef.current) {
      drawCoverImage(ctx, imgElRef.current, PAD, y, ART);
    } else {
      ctx.fillStyle = "rgba(127,127,127,0.35)";
      ctx.fillRect(PAD, y, ART, ART);
    }
    ctx.restore();
    y += ART + GAP;

    // meta text
    ctx.fillStyle = textColor;
    ctx.textBaseline = "top";
    ctx.font = "700 20px IBM Plex Sans, sans-serif";
    ctx.fillText(truncateToWidth(ctx, title || "Untitled", ART), PAD, y);
    y += titleH;

    ctx.globalAlpha = 0.75;
    ctx.font = "500 14px IBM Plex Sans, sans-serif";
    ctx.fillText(truncateToWidth(ctx, artist || "Unknown artist", ART), PAD, y);
    ctx.globalAlpha = 1;
    y += artistH;

    if (album.trim()) {
      ctx.globalAlpha = 0.5;
      ctx.font = "400 12px IBM Plex Sans, sans-serif";
      ctx.fillText(truncateToWidth(ctx, album, ART), PAD, y);
      ctx.globalAlpha = 1;
      y += albumH;
    }
    y += GAP;

    // progress track
    const trackY = y;
    ctx.fillStyle = theme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)";
    roundRectPath(ctx, PAD, trackY, ART, 4, 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    roundRectPath(ctx, PAD, trackY, Math.max(4, ART * progress), 4, 2);
    ctx.fill();
    y += 4 + 6;

    ctx.globalAlpha = 0.65;
    ctx.font = "500 11px Geist Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText(formatTime(currentSeconds), PAD, y);
    ctx.textAlign = "right";
    ctx.fillText(formatTime(totalSeconds), PAD + ART, y);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
    y += 14 + GAP;

    // controls
    const cx = CARD_W / 2;
    const cy = y + controlsH / 2 - 4;
    ctx.fillStyle = textColor;

    // prev
    drawTriangle(ctx, cx - 40, cy, cx - 26, 16);
    ctx.fillRect(cx - 45, cy - 8, 2.5, 16);

    // play / pause circle
    ctx.fillStyle = theme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = textColor;
    if (isPlaying) {
      ctx.fillRect(cx - 6, cy - 9, 4, 18);
      ctx.fillRect(cx + 2, cy - 9, 4, 18);
    } else {
      drawTriangle(ctx, cx + 8, cy, cx - 6, 18);
    }

    // next
    drawTriangle(ctx, cx + 40, cy, cx + 26, 16);
    ctx.fillRect(cx + 42.5, cy - 8, 2.5, 16);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export the card as PNG.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (title || "now-playing").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${safeName || "now-playing"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <Frame wide>
      <SectionHeading title="Now Playing Card" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.card}
            style={{ background: cardBackground, color: textColor }}
          >
            <div className={styles.artWrap}>
              {imageSrc ? (
                <img src={imageSrc} alt="Album art" className={styles.art} />
              ) : (
                <Upload size={28} className={styles.artPlaceholder} />
              )}
            </div>

            <div className={styles.meta}>
              <span className={styles.titleText}>{title || "Untitled"}</span>
              <span className={styles.artistText}>{artist || "Unknown artist"}</span>
              {album.trim() && <span className={styles.albumText}>{album}</span>}
            </div>

            <div className={styles.progressBlock}>
              <div className={clsx(styles.progressTrack, styles[theme])}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className={styles.timeRow}>
                <span>{formatTime(currentSeconds)}</span>
                <span>{formatTime(totalSeconds)}</span>
              </div>
            </div>

            <div className={styles.controlsRow}>
              <button
                type="button"
                className={clsx(styles.controlBtn, styles[theme])}
                aria-label="Previous"
                onClick={() => undefined}
              >
                <SkipBack size={18} fill="currentColor" />
              </button>
              <button
                type="button"
                className={clsx(styles.controlBtn, styles.playBtn, styles[theme])}
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={() => setIsPlaying((v) => !v)}
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                className={clsx(styles.controlBtn, styles[theme])}
                aria-label="Next"
                onClick={() => undefined}
              >
                <SkipForward size={18} fill="currentColor" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Artwork</span>
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
              <Upload size={18} />
              <span>Drop an image or click to upload</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleFileInput}
              />
            </div>
            {imageSrc && (
              <button type="button" className={styles.clearBtn} onClick={clearImage}>
                <X size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Remove artwork
              </button>
            )}
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>Track info</span>
            <div className={styles.field}>
              <label htmlFor="np-title">Title</label>
              <input
                id="np-title"
                type="text"
                className={styles.textInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="np-artist">Artist</label>
              <input
                id="np-artist"
                type="text"
                className={styles.textInput}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="np-album">Album (optional)</label>
              <input
                id="np-album"
                type="text"
                className={styles.textInput}
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>Playback</span>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Current time</label>
                <div className={styles.timeInputs}>
                  <input
                    type="number"
                    min={0}
                    className={styles.numberInput}
                    value={currentMin}
                    onChange={(e) => setCurrentMin(Math.max(0, Number(e.target.value)))}
                  />
                  <span className={styles.timeSep}>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className={styles.numberInput}
                    value={currentSec}
                    onChange={(e) =>
                      setCurrentSec(clamp(Number(e.target.value), 0, 59))
                    }
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Total time</label>
                <div className={styles.timeInputs}>
                  <input
                    type="number"
                    min={0}
                    className={styles.numberInput}
                    value={totalMin}
                    onChange={(e) => setTotalMin(Math.max(0, Number(e.target.value)))}
                  />
                  <span className={styles.timeSep}>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className={styles.numberInput}
                    value={totalSec}
                    onChange={(e) => setTotalSec(clamp(Number(e.target.value), 0, 59))}
                  />
                </div>
              </div>
            </div>
            <div className={styles.field}>
              <label>
                Progress <span className={styles.fieldValue}>{Math.round(progress * 100)}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={(e) => {
                  const pct = Number(e.target.value) / 100;
                  const secs = Math.round(totalSeconds * pct);
                  setCurrentMin(Math.floor(secs / 60));
                  setCurrentSec(secs % 60);
                }}
              />
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>Background</span>
            <div className={styles.segmented}>
              {(["solid", "gradient", "auto"] as BgMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={clsx(
                    styles.segmentedBtn,
                    bgMode === mode && styles.segmentedBtnActive
                  )}
                  onClick={() => setBgMode(mode)}
                >
                  {mode === "solid" ? "Solid" : mode === "gradient" ? "Gradient" : "Auto"}
                </button>
              ))}
            </div>

            {bgMode === "solid" && (
              <div className={styles.field}>
                <label>Color</label>
                <div className={styles.colorRow}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={solidColor}
                    onChange={(e) => setSolidColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.textInput}
                    value={solidColor}
                    onChange={(e) => setSolidColor(e.target.value)}
                  />
                </div>
              </div>
            )}

            {bgMode === "gradient" && (
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>From</label>
                  <div className={styles.colorRow}>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={gradientA}
                      onChange={(e) => setGradientA(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>To</label>
                  <div className={styles.colorRow}>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={gradientB}
                      onChange={(e) => setGradientB(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {bgMode === "auto" && (
              <p className={styles.fieldValue}>
                {imageSrc
                  ? "Sampled from the artwork's average color, darkened for contrast."
                  : "Upload artwork to sample a background color automatically."}
              </p>
            )}

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Text color</label>
                <div className={styles.colorRow}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Card theme</label>
                <div className={styles.segmented}>
                  {(["dark", "light"] as Theme[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={clsx(
                        styles.segmentedBtn,
                        theme === t && styles.segmentedBtnActive
                      )}
                      onClick={() => setTheme(t)}
                    >
                      {t === "dark" ? "Dark" : "Light"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button type="button" className={styles.downloadBtn} onClick={downloadPng}>
            <Download size={15} />
            Download PNG
          </button>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

export default NowPlaying;
