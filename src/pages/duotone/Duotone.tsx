import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Download, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Duotone.module.css";

interface Preset {
  name: string;
  shadow: string;
  highlight: string;
}

const PRESETS: Preset[] = [
  { name: "Indigo / Peach", shadow: "#312e81", highlight: "#fed7aa" },
  { name: "Teal / Yellow", shadow: "#134e4a", highlight: "#fde047" },
  { name: "Purple / Pink", shadow: "#581c87", highlight: "#fbcfe8" },
  { name: "Black / White", shadow: "#000000", highlight: "#ffffff" },
];

const MAX_DIMENSION = 1400;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function Duotone() {
  const ready = useRevealReady();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [shadow, setShadow] = useState("#312e81");
  const [highlight, setHighlight] = useState("#fed7aa");
  const [intensity, setIntensity] = useState(0); // -100..100, curve on luminance
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const process = useCallback(() => {
    const img = imgElRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

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

    const [sr, sg, sb] = hexToRgb(shadow);
    const [hr, hg, hb] = hexToRgb(highlight);

    // intensity in [-100, 100] bends the luminance curve: positive pushes
    // midtones toward highlight, negative pushes them toward shadow.
    const curve = intensity / 100;

    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let lum = clamp01((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);
      if (curve !== 0) {
        // gamma-style remap centered at 0.5
        const gamma = curve >= 0 ? 1 - curve * 0.9 : 1 + Math.abs(curve) * 3;
        lum = Math.pow(lum, gamma);
      }

      data[i] = sr + (hr - sr) * lum;
      data[i + 1] = sg + (hg - sg) * lum;
      data[i + 2] = sb + (hb - sb) * lum;
      // alpha channel (data[i + 3]) unchanged
    }

    ctx.putImageData(imageData, 0, 0);
  }, [shadow, highlight, intensity]);

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

  function applyPreset(preset: Preset) {
    setShadow(preset.shadow);
    setHighlight(preset.highlight);
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
      a.download = "duotone.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <Frame wide>
      <SectionHeading title="Duotone" />

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
                <span>Upload an image to apply a duotone effect.</span>
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
          <div className={styles.presetRow}>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset(preset)}
                title={preset.name}
              >
                <span className={styles.presetSwatches}>
                  <span
                    className={styles.presetSwatch}
                    style={{ background: preset.shadow }}
                  />
                  <span
                    className={styles.presetSwatch}
                    style={{ background: preset.highlight }}
                  />
                </span>
                {preset.name}
              </button>
            ))}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="shadowColor">Shadow color</label>
              <div className={styles.colorRow}>
                <input
                  id="shadowColor"
                  type="color"
                  className={styles.colorInput}
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="highlightColor">Highlight color</label>
              <div className={styles.colorRow}>
                <input
                  id="highlightColor"
                  type="color"
                  className={styles.colorInput}
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="intensity">
              Intensity <span className={styles.fieldValue}>{intensity}</span>
            </label>
            <input
              id="intensity"
              type="range"
              min={-100}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
          </div>

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

export default Duotone;
