import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Check, Copy, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Palette.module.css";

interface Swatch {
  hex: string;
  r: number;
  g: number;
  b: number;
  count: number;
}

const SWATCH_COUNT_OPTIONS = [4, 6, 8, 12] as const;
const MAX_DIMENSION = 160;
const BUCKET_SHIFT = 4; // reduce each 8-bit channel to 4 bits (16 levels)
const MERGE_DISTANCE = 24; // euclidean rgb distance under which colors are treated as duplicates

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function colorDistance(a: Swatch, b: Swatch): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Naive quantization: bucket pixels by their high bits per channel, tally
 * frequency + running rgb sums per bucket, then sort buckets by frequency
 * and greedily merge/skip near-duplicate colors until `count` are picked.
 */
function extractPalette(imageData: ImageData, count: number): Swatch[] {
  const buckets = new Map<
    number,
    { r: number; g: number; b: number; n: number }
  >();

  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const key =
      ((r >> BUCKET_SHIFT) << 16) |
      ((g >> BUCKET_SHIFT) << 8) |
      (b >> BUCKET_SHIFT);

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const candidates: Swatch[] = Array.from(buckets.values())
    .map((bucket) => ({
      r: bucket.r / bucket.n,
      g: bucket.g / bucket.n,
      b: bucket.b / bucket.n,
      count: bucket.n,
      hex: "",
    }))
    .sort((a, b) => b.count - a.count);

  const picked: Swatch[] = [];
  for (const candidate of candidates) {
    if (picked.length >= count) break;
    const isDuplicate = picked.some(
      (p) => colorDistance(p, candidate) < MERGE_DISTANCE
    );
    if (isDuplicate) continue;
    picked.push({ ...candidate, hex: rgbToHex(candidate.r, candidate.g, candidate.b) });
  }

  return picked;
}

export function Palette() {
  const ready = useRevealReady();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [swatchCount, setSwatchCount] = useState<number>(6);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  const runExtraction = useCallback((count: number) => {
    const img = imgElRef.current;
    if (!img) return;

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not read image pixels in this browser.");
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, width, height);
    } catch {
      setError("Could not read image pixels (possibly a cross-origin image).");
      return;
    }

    setSwatches(extractPalette(imageData, count));
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("That file doesn't look like an image.");
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onerror = () => setError("Could not read that file.");
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          setError("Could not read that file.");
          return;
        }

        const img = new Image();
        img.onload = () => {
          imgElRef.current = img;
          setImageSrc(dataUrl);
          runExtraction(swatchCount);
        };
        img.onerror = () => setError("Could not load that image.");
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [runExtraction, swatchCount]
  );

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

  function handleCountChange(count: number) {
    setSwatchCount(count);
    if (imgElRef.current) runExtraction(count);
  }

  async function copySwatch(hex: string) {
    await navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(swatches.map((s) => s.hex).join(", "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Palette Extractor" />

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

          {imageSrc && (
            <div className={styles.previewWrap}>
              <img src={imageSrc} alt="Uploaded preview" className={styles.preview} />
            </div>
          )}
        </motion.div>

        <motion.div className={styles.right} variants={revealItem}>
          <div className={styles.countRow}>
            <span className={styles.countLabel}>Colors</span>
            <div className={styles.countButtons}>
              {SWATCH_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={clsx(
                    styles.countBtn,
                    swatchCount === n && styles.countBtnActive
                  )}
                  onClick={() => handleCountChange(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {swatches.length > 0 ? (
            <>
              <div className={styles.grid}>
                {swatches.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    className={styles.swatchCard}
                    onClick={() => copySwatch(s.hex)}
                    title={`rgb(${Math.round(s.r)}, ${Math.round(s.g)}, ${Math.round(s.b)})`}
                  >
                    <span
                      className={styles.swatchColor}
                      style={{ background: s.hex }}
                    />
                    <span className={styles.swatchInfo}>
                      <span className={styles.swatchHex}>{s.hex}</span>
                      <span className={styles.swatchRgb}>
                        rgb({Math.round(s.r)}, {Math.round(s.g)}, {Math.round(s.b)})
                      </span>
                    </span>
                    <span className={styles.swatchCopyIcon}>
                      {copiedHex === s.hex ? (
                        <Check size={13} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={clsx(styles.copyAllBtn, copiedAll && styles.copied)}
                onClick={copyAll}
              >
                {copiedAll ? <Check size={13} /> : <Copy size={13} />}
                {copiedAll ? "Copied" : "Copy all"}
              </button>
            </>
          ) : (
            <div className={styles.empty}>
              <ImagePlus size={22} className={styles.emptyIcon} />
              <span>Upload an image to extract its dominant colors.</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Palette;
