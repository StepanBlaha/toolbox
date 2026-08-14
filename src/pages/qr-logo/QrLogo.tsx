import { useEffect, useRef, useState, type DragEvent } from "react";
import QRCodeStyling, { type DotType } from "qr-code-styling";
import { Download, Image as ImageIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./QrLogo.module.css";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

function QrLogo() {
  const ready = useRevealReady();
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("https://stepanblaha.com");
  const [logo, setLogo] = useState<string | null>(null);
  const [size, setSize] = useState(256);
  const [fg, setFg] = useState("#09090b");
  const [bg, setBg] = useState("#ffffff");
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("H");
  const [dotStyle, setDotStyle] = useState<DotType>("square");
  const [logoSize, setLogoSize] = useState(0.4);
  const [logoMargin, setLogoMargin] = useState(4);
  const [hideDots, setHideDots] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  function readImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogo(reader.result);
        setError("");
      }
    };
    reader.onerror = () => setError("Could not read the image file.");
    reader.readAsDataURL(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readImageFile(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readImageFile(file);
  }

  // Create the instance once and mount it into the container.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    qrRef.current = new QRCodeStyling({
      width: size,
      height: size,
      margin: 8,
      data: text.trim() ? text : " ",
      image: logo ?? undefined,
      qrOptions: { errorCorrectionLevel: ecLevel },
      dotsOptions: { color: fg, type: dotStyle },
      backgroundOptions: { color: bg },
      cornersSquareOptions: { color: fg },
      cornersDotOptions: { color: fg },
      imageOptions: {
        imageSize: logoSize,
        margin: logoMargin,
        hideBackgroundDots: hideDots,
        crossOrigin: "anonymous",
      },
    });

    container.innerHTML = "";
    qrRef.current.append(container);

    return () => {
      container.innerHTML = "";
      qrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push option changes to the existing instance.
  useEffect(() => {
    if (!qrRef.current) return;
    if (!text.trim()) return;

    try {
      qrRef.current.update({
        width: size,
        height: size,
        margin: 8,
        data: text,
        image: logo ?? undefined,
        qrOptions: { errorCorrectionLevel: ecLevel },
        dotsOptions: { color: fg, type: dotStyle },
        backgroundOptions: { color: bg },
        cornersSquareOptions: { color: fg },
        cornersDotOptions: { color: fg },
        imageOptions: {
          imageSize: logoSize,
          margin: logoMargin,
          hideBackgroundDots: hideDots,
          crossOrigin: "anonymous",
        },
      });
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate QR code for this input."
      );
    }
  }, [text, logo, size, fg, bg, ecLevel, dotStyle, logoSize, logoMargin, hideDots]);

  function downloadPng() {
    if (!text.trim() || !qrRef.current) return;
    qrRef.current
      .download({ name: "qr-logo", extension: "png" })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not download PNG.");
      });
  }

  function downloadSvg() {
    if (!text.trim() || !qrRef.current) return;
    qrRef.current
      .download({ name: "qr-logo", extension: "svg" })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not download SVG.");
      });
  }

  return (
    <Frame wide>
      <SectionHeading title="QR with Logo" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div className={styles.previewSurface} style={{ background: bg }}>
            {text.trim() ? (
              <div className={styles.qrContainer} ref={containerRef} />
            ) : (
              <div className={styles.emptyState}>Enter text to preview</div>
            )}
          </div>

          {error && <p className={styles.errorNote}>{error}</p>}

          <p className={styles.hintNote}>
            High error correction (H) keeps the code scannable even with a
            logo covering part of it.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={downloadPng}
              disabled={!text.trim()}
            >
              <Download size={14} />
              Download PNG
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={downloadSvg}
              disabled={!text.trim()}
            >
              <Download size={14} />
              Download SVG
            </button>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="qr-text">Text / URL</label>
            <textarea
              id="qr-text"
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="https://example.com"
            />
          </div>

          <div className={styles.field}>
            <label>Logo</label>
            <div
              className={clsx(styles.dropzone, dragActive && styles.dropzoneActive)}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {logo ? (
                <div className={styles.logoPreview}>
                  <img src={logo} alt="Logo preview" className={styles.logoThumb} />
                  <span>Click or drop to replace</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogo(null);
                    }}
                  >
                    <X size={12} />
                    Remove
                  </button>
                </div>
              ) : (
                <div className={styles.dropzoneEmpty}>
                  <ImageIcon size={18} />
                  <span>Click or drag an image here</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={handleFileInput}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="size">
                Size <span className={styles.fieldValue}>{size}px</span>
              </label>
              <input
                id="size"
                type="range"
                min={128}
                max={512}
                step={8}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="ec">Error correction</label>
              <select
                id="ec"
                className={styles.select}
                value={ecLevel}
                onChange={(e) => setEcLevel(e.target.value as ErrorCorrectionLevel)}
              >
                <option value="L">L - Low (~7%)</option>
                <option value="M">M - Medium (~15%)</option>
                <option value="Q">Q - Quartile (~25%)</option>
                <option value="H">H - High (~30%)</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fg">Foreground</label>
              <div className={styles.colorRow}>
                <input
                  id="fg"
                  type="color"
                  className={styles.colorInput}
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="bg">Background</label>
              <div className={styles.colorRow}>
                <input
                  id="bg"
                  type="color"
                  className={styles.colorInput}
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label>Dot style</label>
            <div className={styles.chipRow}>
              {DOT_STYLES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(
                    styles.chip,
                    dotStyle === opt.value && styles.chipActive
                  )}
                  onClick={() => setDotStyle(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="logo-size">
                Logo size{" "}
                <span className={styles.fieldValue}>
                  {Math.round(logoSize * 100)}%
                </span>
              </label>
              <input
                id="logo-size"
                type="range"
                min={0.2}
                max={0.5}
                step={0.01}
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="logo-margin">
                Logo margin <span className={styles.fieldValue}>{logoMargin}</span>
              </label>
              <input
                id="logo-margin"
                type="range"
                min={0}
                max={20}
                value={logoMargin}
                onChange={(e) => setLogoMargin(Number(e.target.value))}
              />
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={hideDots}
              onChange={(e) => setHideDots(e.target.checked)}
            />
            Hide dots behind logo
          </label>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default QrLogo;
export { QrLogo };
