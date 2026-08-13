import { useEffect, useRef, useState } from "react";
import QRCodeStyling, {
  type CornerDotType,
  type CornerSquareType,
  type DotType,
} from "qr-code-styling";
import { Check, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./QrCode.module.css";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

function QrCode() {
  const ready = useRevealReady();
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  const [text, setText] = useState("https://stepanblaha.com");
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#09090b");
  const [bg, setBg] = useState("#ffffff");
  const [transparentBg, setTransparentBg] = useState(false);
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>("M");
  const [dotStyle, setDotStyle] = useState<DotType>("square");
  const [cornerSquareStyle, setCornerSquareStyle] =
    useState<CornerSquareType>("square");
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotType>("square");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Create the instance once and mount it into the container.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    qrRef.current = new QRCodeStyling({
      width: size,
      height: size,
      margin,
      data: text.trim() ? text : " ",
      qrOptions: { errorCorrectionLevel: ecLevel },
      dotsOptions: { color: fg, type: dotStyle },
      backgroundOptions: { color: transparentBg ? "transparent" : bg },
      cornersSquareOptions: { type: cornerSquareStyle, color: fg },
      cornersDotOptions: { type: cornerDotStyle, color: fg },
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

    try {
      qrRef.current.update({
        width: size,
        height: size,
        margin,
        data: text.trim() ? text : " ",
        qrOptions: { errorCorrectionLevel: ecLevel },
        dotsOptions: { color: fg, type: dotStyle },
        backgroundOptions: { color: transparentBg ? "transparent" : bg },
        cornersSquareOptions: { type: cornerSquareStyle, color: fg },
        cornersDotOptions: { type: cornerDotStyle, color: fg },
      });
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate QR code for this input."
      );
    }
  }, [
    text,
    size,
    margin,
    fg,
    bg,
    transparentBg,
    ecLevel,
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
  ]);

  function downloadPng() {
    if (!text.trim() || !qrRef.current) return;
    qrRef.current.download({ name: "qr", extension: "png" }).catch((err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Could not download PNG."
      );
    });
  }

  function downloadSvg() {
    if (!text.trim() || !qrRef.current) return;
    qrRef.current.download({ name: "qr", extension: "svg" }).catch((err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Could not download SVG."
      );
    });
  }

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="QR Code Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewSurface}
            style={{
              background: transparentBg ? "transparent" : bg,
              backgroundImage: transparentBg
                ? "conic-gradient(var(--panel) 90deg, transparent 90deg 180deg, var(--panel) 180deg 270deg, transparent 270deg)"
                : undefined,
              backgroundSize: transparentBg ? "16px 16px" : undefined,
            }}
          >
            {text.trim() ? (
              <div className={styles.qrContainer} ref={containerRef} />
            ) : (
              <div className={styles.emptyState}>Enter text to preview</div>
            )}
          </div>

          {error && <p className={styles.errorNote}>{error}</p>}

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
            <div className={styles.labelRow}>
              <label htmlFor="qr-text">Text / URL</label>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copyText}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              id="qr-text"
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="https://example.com"
            />
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
              <label htmlFor="margin">
                Margin <span className={styles.fieldValue}>{margin}</span>
              </label>
              <input
                id="margin"
                type="range"
                min={0}
                max={8}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
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
                  disabled={transparentBg}
                  onChange={(e) => setBg(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={transparentBg ? "transparent" : bg}
                  disabled={transparentBg}
                  onChange={(e) => setBg(e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
            />
            Transparent background
          </label>

          <div className={styles.field}>
            <label htmlFor="ec">Error correction level</label>
            <select
              id="ec"
              className={styles.select}
              value={ecLevel}
              onChange={(e) =>
                setEcLevel(e.target.value as ErrorCorrectionLevel)
              }
            >
              <option value="L">L — Low (~7%)</option>
              <option value="M">M — Medium (~15%)</option>
              <option value="Q">Q — Quartile (~25%)</option>
              <option value="H">H — High (~30%)</option>
            </select>
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

          <div className={styles.field}>
            <label>Corner style</label>
            <div className={styles.chipRow}>
              {CORNER_SQUARE_STYLES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(
                    styles.chip,
                    cornerSquareStyle === opt.value && styles.chipActive
                  )}
                  onClick={() => setCornerSquareStyle(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Corner dot style</label>
            <div className={styles.chipRow}>
              {CORNER_DOT_STYLES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(
                    styles.chip,
                    cornerDotStyle === opt.value && styles.chipActive
                  )}
                  onClick={() => setCornerDotStyle(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default QrCode;
export { QrCode };
