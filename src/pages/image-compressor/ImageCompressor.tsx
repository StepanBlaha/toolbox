import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Download, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./ImageCompressor.module.css";

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPEG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/png", label: "PNG", ext: "png" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extFor(format: OutputFormat): string {
  return FORMAT_OPTIONS.find((f) => f.value === format)?.ext ?? "jpg";
}

function baseName(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

interface SourceImage {
  img: HTMLImageElement;
  url: string;
  size: number;
  fileName: string;
}

export function ImageCompressor() {
  const ready = useRevealReady();

  const [source, setSource] = useState<SourceImage | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [outWidth, setOutWidth] = useState<number | null>(null);
  const [outHeight, setOutHeight] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compressedUrlRef = useRef<string | null>(null);
  const sourceUrlRef = useRef<string | null>(null);

  const revokeCompressed = useCallback(() => {
    if (compressedUrlRef.current) {
      URL.revokeObjectURL(compressedUrlRef.current);
      compressedUrlRef.current = null;
    }
  }, []);

  const revokeSource = useCallback(() => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeCompressed();
      revokeSource();
    };
  }, [revokeCompressed, revokeSource]);

  const runCompression = useCallback(
    (img: HTMLImageElement, fmt: OutputFormat, q: number, targetWidth: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      if (!naturalW || !naturalH) {
        setError("Could not read image dimensions.");
        return;
      }

      const width = targetWidth > 0 ? Math.min(targetWidth, naturalW) : naturalW;
      const scale = width / naturalW;
      const height = Math.max(1, Math.round(naturalH * scale));

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not access canvas context in this browser.");
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      setIsWorking(true);
      const encodeQuality = fmt === "image/png" ? undefined : q;

      canvas.toBlob(
        (blob) => {
          setIsWorking(false);
          if (!blob) {
            setError("Could not encode the compressed image.");
            return;
          }
          revokeCompressed();
          const url = URL.createObjectURL(blob);
          compressedUrlRef.current = url;
          setCompressedUrl(url);
          setCompressedSize(blob.size);
          setOutWidth(width);
          setOutHeight(height);
        },
        fmt,
        encodeQuality
      );
    },
    [revokeCompressed]
  );

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("That file doesn't look like an image.");
        return;
      }

      setError(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        revokeSource();
        revokeCompressed();
        sourceUrlRef.current = url;
        setCompressedUrl(null);
        setCompressedSize(null);
        setOutWidth(null);
        setOutHeight(null);
        setSource({ img, url, size: file.size, fileName: file.name });
        setMaxWidth(img.naturalWidth);
        runCompression(img, format, quality, img.naturalWidth);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError("Could not load that image.");
      };
      img.src = url;
    },
    [format, quality, runCompression, revokeCompressed, revokeSource]
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

  function handleFormatChange(next: OutputFormat) {
    setFormat(next);
    if (source) runCompression(source.img, next, quality, maxWidth);
  }

  function handleQualityChange(next: number) {
    setQuality(next);
    if (source) runCompression(source.img, format, next, maxWidth);
  }

  function handleMaxWidthChange(next: number) {
    setMaxWidth(next);
    if (source) runCompression(source.img, format, quality, next);
  }

  function download() {
    if (!compressedUrl || !source) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `${baseName(source.fileName)}-compressed.${extFor(format)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const savedPct =
    source && compressedSize !== null
      ? Math.round((1 - compressedSize / source.size) * 100)
      : null;

  return (
    <Frame wide>
      <SectionHeading title="Image Compressor" />

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

          {source ? (
            <div className={styles.previews}>
              <div className={styles.previewCol}>
                <span className={styles.previewLabel}>Original</span>
                <div className={styles.previewWrap}>
                  <img src={source.url} alt="Original" className={styles.preview} />
                </div>
                <span className={styles.previewSize}>{formatBytes(source.size)}</span>
              </div>
              <div className={styles.previewCol}>
                <span className={styles.previewLabel}>Compressed</span>
                <div className={styles.previewWrap}>
                  {compressedUrl && (
                    <img src={compressedUrl} alt="Compressed" className={styles.preview} />
                  )}
                </div>
                <span className={styles.previewSize}>
                  {compressedSize !== null ? formatBytes(compressedSize) : "-"}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.empty}>
              <ImagePlus size={22} className={styles.emptyIcon} />
              <span>Upload an image to compress it.</span>
            </div>
          )}

          <canvas ref={canvasRef} className={styles.hiddenCanvas} />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label>Output format</label>
            <div className={styles.formatButtons}>
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(
                    styles.formatBtn,
                    format === opt.value && styles.formatBtnActive
                  )}
                  onClick={() => handleFormatChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="quality">
              Quality{" "}
              <span className={styles.fieldValue}>
                {format === "image/png" ? "n/a" : quality.toFixed(2)}
              </span>
            </label>
            <input
              id="quality"
              type="range"
              min={0.1}
              max={1}
              step={0.01}
              value={quality}
              disabled={format === "image/png"}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="maxWidth">
              Max width <span className={styles.fieldValue}>{maxWidth || "-"}px</span>
            </label>
            <input
              id="maxWidth"
              type="range"
              min={source ? Math.min(32, source.img.naturalWidth) : 32}
              max={source ? source.img.naturalWidth : 2000}
              step={1}
              value={maxWidth || (source ? source.img.naturalWidth : 0)}
              disabled={!source}
              onChange={(e) => handleMaxWidthChange(Number(e.target.value))}
            />
          </div>

          <div className={styles.statsBlock}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Original</span>
              <span className={styles.statValue}>
                {source ? formatBytes(source.size) : "-"}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Compressed</span>
              <span className={styles.statValue}>
                {compressedSize !== null ? formatBytes(compressedSize) : "-"}
                {outWidth && outHeight ? ` · ${outWidth}×${outHeight}` : ""}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Saved</span>
              <span
                className={clsx(
                  styles.statValue,
                  savedPct !== null && savedPct > 0 && styles.saved,
                  savedPct !== null && savedPct <= 0 && styles.grew
                )}
              >
                {savedPct !== null ? `${savedPct}%` : "-"}
                {isWorking ? " · encoding…" : ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.downloadBtn}
            onClick={download}
            disabled={!compressedUrl}
          >
            <Download size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Download
          </button>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default ImageCompressor;
