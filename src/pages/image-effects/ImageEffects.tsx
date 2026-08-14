import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Download, ImagePlus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import {
  applyEffect,
  DEFAULT_PARAMS,
  EFFECTS,
  isPixelated,
  type EffectId,
  type EffectParams,
} from "./effects";
import styles from "./ImageEffects.module.css";

const MAX_WORKING_DIMENSION = 700;

export function ImageEffects() {
  const ready = useRevealReady();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [effect, setEffect] = useState<EffectId>("halftone");
  const [params, setParams] = useState<EffectParams>(DEFAULT_PARAMS);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  function setParam<K extends keyof EffectParams>(key: K, value: EffectParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  const process = useCallback(() => {
    const img = imgElRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!img || !outputCanvas) return;

    if (!workCanvasRef.current) workCanvasRef.current = document.createElement("canvas");
    const workCanvas = workCanvasRef.current;

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
    workCtx.clearRect(0, 0, width, height);
    workCtx.drawImage(img, 0, 0, width, height);

    try {
      applyEffect(effect, workCanvas, outputCanvas, params);
    } catch {
      setError("Could not process this image (possibly a cross-origin image).");
    }
  }, [effect, params]);

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
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export the image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-effect-${effect}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <Frame wide>
      <SectionHeading title="Image Effects" />

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
                  ref={outputCanvasRef}
                  className={clsx(
                    styles.canvas,
                    isPixelated(effect) && styles.pixelated,
                    showOriginal && styles.hidden
                  )}
                />
                {showOriginal && (
                  <img src={imageSrc} alt="Original" className={styles.originalImg} />
                )}
              </>
            ) : (
              <div className={styles.empty}>
                <ImagePlus size={22} className={styles.emptyIcon} />
                <span>Upload an image to apply an effect.</span>
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
            <label>Effect</label>
            <div className={styles.chipRow}>
              {EFFECTS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={clsx(styles.chip, effect === e.id && styles.chipActive)}
                  onClick={() => setEffect(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlsPanel}>
            <span className={styles.controlsTitle}>Controls</span>

            {effect === "halftone" && (
              <>
                <div className={styles.field}>
                  <label htmlFor="haloCellSize">
                    Dot grid size <span className={styles.fieldValue}>{params.haloCellSize}px</span>
                  </label>
                  <input
                    id="haloCellSize"
                    type="range"
                    min={4}
                    max={30}
                    value={params.haloCellSize}
                    onChange={(e) => setParam("haloCellSize", Number(e.target.value))}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="haloColor">Dot color</label>
                  <div className={styles.colorRow}>
                    <input
                      id="haloColor"
                      type="color"
                      className={styles.colorInput}
                      value={params.haloColor}
                      onChange={(e) => setParam("haloColor", e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.textInput}
                      value={params.haloColor}
                      onChange={(e) => setParam("haloColor", e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {effect === "pixelate" && (
              <div className={styles.field}>
                <label htmlFor="blockSize">
                  Block size <span className={styles.fieldValue}>{params.blockSize}px</span>
                </label>
                <input
                  id="blockSize"
                  type="range"
                  min={2}
                  max={40}
                  value={params.blockSize}
                  onChange={(e) => setParam("blockSize", Number(e.target.value))}
                />
              </div>
            )}

            {effect === "posterize" && (
              <div className={styles.field}>
                <label htmlFor="posterLevels">
                  Levels <span className={styles.fieldValue}>{params.posterLevels}</span>
                </label>
                <input
                  id="posterLevels"
                  type="range"
                  min={2}
                  max={8}
                  value={params.posterLevels}
                  onChange={(e) => setParam("posterLevels", Number(e.target.value))}
                />
              </div>
            )}

            {effect === "edge" && (
              <>
                <div className={styles.field}>
                  <label htmlFor="edgeThreshold">
                    Threshold <span className={styles.fieldValue}>{params.edgeThreshold}</span>
                  </label>
                  <input
                    id="edgeThreshold"
                    type="range"
                    min={10}
                    max={300}
                    value={params.edgeThreshold}
                    onChange={(e) => setParam("edgeThreshold", Number(e.target.value))}
                  />
                </div>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={params.edgeInvert}
                    onChange={(e) => setParam("edgeInvert", e.target.checked)}
                  />
                  Invert
                </label>
              </>
            )}

            {effect === "vhs" && (
              <>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="vhsShift">
                      Channel shift <span className={styles.fieldValue}>{params.vhsShift}px</span>
                    </label>
                    <input
                      id="vhsShift"
                      type="range"
                      min={0}
                      max={20}
                      value={params.vhsShift}
                      onChange={(e) => setParam("vhsShift", Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="vhsScanline">
                      Scanlines <span className={styles.fieldValue}>{params.vhsScanline}</span>
                    </label>
                    <input
                      id="vhsScanline"
                      type="range"
                      min={0}
                      max={100}
                      value={params.vhsScanline}
                      onChange={(e) => setParam("vhsScanline", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="vhsNoise">
                    Noise <span className={styles.fieldValue}>{params.vhsNoise}</span>
                  </label>
                  <input
                    id="vhsNoise"
                    type="range"
                    min={0}
                    max={100}
                    value={params.vhsNoise}
                    onChange={(e) => setParam("vhsNoise", Number(e.target.value))}
                  />
                </div>
              </>
            )}

            {effect === "lowpoly" && (
              <div className={styles.field}>
                <label htmlFor="lowPolyGrid">
                  Grid density <span className={styles.fieldValue}>{params.lowPolyGrid}</span>
                </label>
                <input
                  id="lowPolyGrid"
                  type="range"
                  min={6}
                  max={60}
                  value={params.lowPolyGrid}
                  onChange={(e) => setParam("lowPolyGrid", Number(e.target.value))}
                />
              </div>
            )}

            {effect === "charmosaic" && (
              <>
                <div className={styles.field}>
                  <label htmlFor="charCellSize">
                    Cell size <span className={styles.fieldValue}>{params.charCellSize}px</span>
                  </label>
                  <input
                    id="charCellSize"
                    type="range"
                    min={6}
                    max={24}
                    value={params.charCellSize}
                    onChange={(e) => setParam("charCellSize", Number(e.target.value))}
                  />
                </div>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={params.charColored}
                    onChange={(e) => setParam("charColored", e.target.checked)}
                  />
                  Colored characters
                </label>
              </>
            )}

            {effect === "blueprint" && (
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={params.blueprintGrid}
                  onChange={(e) => setParam("blueprintGrid", e.target.checked)}
                />
                Grid overlay
              </label>
            )}

            {effect === "anaglyph" && (
              <div className={styles.field}>
                <label htmlFor="anaglyphOffset">
                  Offset <span className={styles.fieldValue}>{params.anaglyphOffset}px</span>
                </label>
                <input
                  id="anaglyphOffset"
                  type="range"
                  min={0}
                  max={20}
                  value={params.anaglyphOffset}
                  onChange={(e) => setParam("anaglyphOffset", Number(e.target.value))}
                />
              </div>
            )}

            {effect === "crossstitch" && (
              <div className={styles.field}>
                <label htmlFor="stitchCellSize">
                  Cell size <span className={styles.fieldValue}>{params.stitchCellSize}px</span>
                </label>
                <input
                  id="stitchCellSize"
                  type="range"
                  min={6}
                  max={30}
                  value={params.stitchCellSize}
                  onChange={(e) => setParam("stitchCellSize", Number(e.target.value))}
                />
              </div>
            )}

            {effect === "vignette" && (
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="vignetteStrength">
                    Vignette <span className={styles.fieldValue}>{params.vignetteStrength}</span>
                  </label>
                  <input
                    id="vignetteStrength"
                    type="range"
                    min={0}
                    max={100}
                    value={params.vignetteStrength}
                    onChange={(e) => setParam("vignetteStrength", Number(e.target.value))}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="grainAmount">
                    Grain <span className={styles.fieldValue}>{params.grainAmount}</span>
                  </label>
                  <input
                    id="grainAmount"
                    type="range"
                    min={0}
                    max={100}
                    value={params.grainAmount}
                    onChange={(e) => setParam("grainAmount", Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {effect === "kaleidoscope" && (
              <div className={styles.field}>
                <label>Segments</label>
                <div className={styles.chipRow}>
                  {([2, 4] as const).map((seg) => (
                    <button
                      key={seg}
                      type="button"
                      className={clsx(
                        styles.chip,
                        params.kaleidoSegments === seg && styles.chipActive
                      )}
                      onClick={() => setParam("kaleidoSegments", seg)}
                    >
                      {seg}-way
                    </button>
                  ))}
                </div>
              </div>
            )}

            {effect === "palette" && (
              <div className={styles.field}>
                <label htmlFor="paletteColors">
                  Colors <span className={styles.fieldValue}>{params.paletteColors}</span>
                </label>
                <input
                  id="paletteColors"
                  type="range"
                  min={2}
                  max={8}
                  value={params.paletteColors}
                  onChange={(e) => setParam("paletteColors", Number(e.target.value))}
                />
              </div>
            )}
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

export default ImageEffects;
