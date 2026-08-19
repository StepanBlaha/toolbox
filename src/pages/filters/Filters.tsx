import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Check, Copy, RefreshCw, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { usePasteImage } from "../../hooks/usePasteImage";
import styles from "./Filters.module.css";

interface FilterState {
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;
  opacity: number;
}

const DEFAULTS: FilterState = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
};

interface SliderDef {
  key: keyof FilterState;
  label: string;
  min: number;
  max: number;
  unit: string;
}

const SLIDERS: SliderDef[] = [
  { key: "blur", label: "Blur", min: 0, max: 20, unit: "px" },
  { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%" },
  { key: "contrast", label: "Contrast", min: 0, max: 200, unit: "%" },
  { key: "saturate", label: "Saturate", min: 0, max: 200, unit: "%" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, unit: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, unit: "%" },
  { key: "hueRotate", label: "Hue rotate", min: 0, max: 360, unit: "deg" },
  { key: "invert", label: "Invert", min: 0, max: 100, unit: "%" },
  { key: "opacity", label: "Opacity", min: 0, max: 100, unit: "%" },
];

function buildFilterCss(f: FilterState): string {
  const parts: string[] = [];
  if (f.blur !== DEFAULTS.blur) parts.push(`blur(${f.blur}px)`);
  if (f.brightness !== DEFAULTS.brightness) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== DEFAULTS.contrast) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== DEFAULTS.saturate) parts.push(`saturate(${f.saturate}%)`);
  if (f.grayscale !== DEFAULTS.grayscale) parts.push(`grayscale(${f.grayscale}%)`);
  if (f.sepia !== DEFAULTS.sepia) parts.push(`sepia(${f.sepia}%)`);
  if (f.hueRotate !== DEFAULTS.hueRotate) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.invert !== DEFAULTS.invert) parts.push(`invert(${f.invert}%)`);
  if (f.opacity !== DEFAULTS.opacity) parts.push(`opacity(${f.opacity}%)`);
  return parts.length ? parts.join(" ") : "none";
}

export function Filters() {
  const ready = useRevealReady();
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULTS });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const filterValue = useMemo(() => buildFilterCss(filters), [filters]);
  const cssText = `filter: ${filterValue};`;

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

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageSrc(url);
  }, []);

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

  function updateFilter(key: keyof FilterState, value: number) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setFilters({ ...DEFAULTS });
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="CSS Filters" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewCol} variants={revealItem}>
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
            <Upload size={20} className={styles.dropIcon} />
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

          <div className={styles.previewPanel}>
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Uploaded preview"
                className={styles.previewImage}
                style={{ filter: filterValue }}
              />
            ) : (
              <div className={styles.samplePreview} style={{ filter: filterValue }} />
            )}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.slidersHead}>
            <span className={styles.slidersLabel}>Controls</span>
            <button type="button" className={styles.resetBtn} onClick={reset}>
              <RefreshCw size={13} />
              Reset
            </button>
          </div>

          <div className={styles.sliders}>
            {SLIDERS.map((s) => (
              <div className={styles.field} key={s.key}>
                <label htmlFor={s.key}>
                  {s.label}{" "}
                  <span className={styles.fieldValue}>
                    {filters[s.key]}
                    {s.unit}
                  </span>
                </label>
                <input
                  id={s.key}
                  type="range"
                  min={s.min}
                  max={s.max}
                  value={filters[s.key]}
                  onChange={(e) => updateFilter(s.key, Number(e.target.value))}
                />
              </div>
            ))}
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

export default Filters;
