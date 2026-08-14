import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent } from "react";
import { removeBackground } from "@imgly/background-removal";
import {
  AlertCircle,
  Download,
  GripVertical,
  ImageOff,
  Loader2,
  RefreshCw,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./BgRemover.module.css";

type Status = "idle" | "processing" | "done" | "error";
type BgMode = "transparent" | "color";

interface Dims {
  w: number;
  h: number;
}

export default function BgRemover() {
  const ready = useRevealReady();
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [compositedUrl, setCompositedUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dims, setDims] = useState<Dims | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [bgMode, setBgMode] = useState<BgMode>("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const compositedUrlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const isPointerDraggingRef = useRef(false);

  useEffect(() => {
    originalUrlRef.current = originalUrl;
  }, [originalUrl]);

  useEffect(() => {
    resultUrlRef.current = resultUrl;
  }, [resultUrl]);

  useEffect(() => {
    compositedUrlRef.current = compositedUrl;
  }, [compositedUrl]);

  // clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (compositedUrlRef.current) URL.revokeObjectURL(compositedUrlRef.current);
    };
  }, []);

  // composite the cut-out over the chosen background on a canvas
  useEffect(() => {
    if (!resultUrl || status !== "done") return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (bgMode === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob || cancelled) return;
        setCompositedUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }, "image/png");
    };
    img.src = resultUrl;

    return () => {
      cancelled = true;
    };
  }, [resultUrl, bgMode, bgColor, status]);

  const resetAll = useCallback(() => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    if (compositedUrlRef.current) URL.revokeObjectURL(compositedUrlRef.current);
    setOriginalUrl(null);
    setResultUrl(null);
    setCompositedUrl(null);
    setSourceFile(null);
    setFileName("");
    setStatus("idle");
    setProgress(0);
    setProgressLabel("");
    setError(null);
    setDims(null);
    setSliderValue(50);
    setBgMode("transparent");
    setHasCompletedOnce(false);
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    if (compositedUrlRef.current) URL.revokeObjectURL(compositedUrlRef.current);

    const url = URL.createObjectURL(file);
    setSourceFile(file);
    setFileName(file.name);
    setOriginalUrl(url);
    setResultUrl(null);
    setCompositedUrl(null);
    setStatus("idle");
    setProgress(0);
    setProgressLabel("");
    setError(null);
    setDims(null);
    setSliderValue(50);
    setBgMode("transparent");
    setHasCompletedOnce(false);
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

  async function handleRemoveBackground() {
    if (!sourceFile) return;

    setStatus("processing");
    setProgress(0);
    setProgressLabel("Starting…");
    setError(null);

    try {
      const blob = await removeBackground(sourceFile, {
        progress: (key: string, current: number, total: number) => {
          setProgressLabel(key);
          setProgress(total > 0 ? Math.round((current / total) * 100) : 0);
        },
      });

      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("done");
      setHasCompletedOnce(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove background.";
      setError(message);
      setStatus("error");
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !resultUrl) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "background-removed.png";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function updateSliderFromClientX(clientX: number) {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderValue(Math.min(100, Math.max(0, pct)));
  }

  function handleFramePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    isPointerDraggingRef.current = true;
    updateSliderFromClientX(e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handleFramePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isPointerDraggingRef.current) return;
    updateSliderFromClientX(e.clientX);
  }

  function handleFramePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    isPointerDraggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  const isProcessing = status === "processing";
  const isDone = status === "done";
  const afterSrc = compositedUrl ?? resultUrl;
  const aspectRatio = dims ? `${dims.w} / ${dims.h}` : "4 / 3";
  const clipPath = `inset(0 ${100 - sliderValue}% 0 0)`;

  return (
    <Frame wide>
      <SectionHeading title="Background Remover" />

      <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />

      <motion.div {...revealProps(ready)}>
        {!originalUrl && (
          <motion.div variants={revealItem}>
            <div
              className={clsx(styles.dropzone, isDragging && styles.dragging)}
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
              <Upload size={20} className={styles.dropzoneIcon} />
              <span className={styles.dropzoneText}>
                Drop an image or click to upload
              </span>
            </div>

            <div className={styles.emptyNote}>
              <ImageOff size={14} />
              <span>No image selected yet</span>
            </div>
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleFileInput}
        />

        {originalUrl && (
          <motion.div variants={revealItem}>
            <div className={styles.fileRow}>
              <span className={styles.fileName}>{fileName}</span>
              <div className={styles.fileRowActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace image"
                >
                  <RefreshCw size={13} />
                  Replace
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={resetAll}
                  title="Remove image"
                >
                  <X size={13} />
                  Clear
                </button>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleRemoveBackground}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 size={14} className={styles.spin} />
                ) : (
                  <Wand2 size={14} />
                )}
                {isProcessing ? "Removing background…" : "Remove background"}
              </button>

              {isDone && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleDownload}
                >
                  <Download size={14} />
                  Download PNG
                </button>
              )}
            </div>

            {isProcessing && (
              <div className={styles.progressBlock}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className={styles.progressLabel}>
                  <span>
                    {progressLabel ? `${progressLabel} - ` : ""}
                    {progress}%
                  </span>
                  {!hasCompletedOnce && (
                    <span className={styles.progressHint}>
                      First run downloads the model (~a few MB).
                    </span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorNote}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {!isDone ? (
              <div className={styles.panel}>
                <span className={styles.panelLabel}>Original</span>
                <div className={styles.imageFrame}>
                  <img
                    src={originalUrl}
                    alt="Original upload"
                    className={styles.image}
                    onLoad={(e) => {
                      const t = e.currentTarget;
                      setDims({ w: t.naturalWidth, h: t.naturalHeight });
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className={styles.panel}>
                  <span className={styles.panelLabel}>
                    Drag to compare - original vs. background removed
                  </span>
                  <div
                    ref={frameRef}
                    className={styles.compareFrame}
                    style={{ aspectRatio }}
                    onPointerDown={handleFramePointerDown}
                    onPointerMove={handleFramePointerMove}
                    onPointerUp={handleFramePointerUp}
                    onPointerCancel={handleFramePointerUp}
                  >
                    <img
                      src={originalUrl}
                      alt="Original"
                      className={styles.compareImg}
                      draggable={false}
                    />
                    <div className={styles.afterLayer} style={{ clipPath }}>
                      <div className={styles.checkerboard} />
                      {afterSrc && (
                        <img
                          src={afterSrc}
                          alt="Background removed"
                          className={styles.compareImg}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div
                      className={styles.divider}
                      style={{ left: `${sliderValue}%` }}
                    >
                      <div className={styles.dividerLine} />
                      <div className={styles.dividerHandle}>
                        <GripVertical size={13} />
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    className={styles.compareRange}
                    aria-label="Compare position between original and result"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                  />
                </div>

                <div className={styles.bgOptions}>
                  <span className={styles.bgOptionsLabel}>Background</span>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="bgMode"
                      checked={bgMode === "transparent"}
                      onChange={() => setBgMode("transparent")}
                    />
                    Transparent
                  </label>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="bgMode"
                      checked={bgMode === "color"}
                      onChange={() => setBgMode("color")}
                    />
                    Solid color
                  </label>
                  {bgMode === "color" && (
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      aria-label="Background color"
                    />
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </Frame>
  );
}
