import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./FaviconGen.module.css";

type FontChoice = "sans" | "mono" | "serif";

const FONT_STACKS: Record<FontChoice, string> = {
  sans: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', serif",
};

interface IconOptions {
  text: string;
  textColor: string;
  bgColor: string;
  radiusPct: number;
  weight: number;
  font: FontChoice;
}

interface SizeSpec {
  size: number;
  filename: string;
  label: string;
}

const DOWNLOAD_SIZES: SizeSpec[] = [
  { size: 16, filename: "favicon-16.png", label: "16×16" },
  { size: 32, filename: "favicon-32.png", label: "32×32" },
  { size: 96, filename: "favicon-96.png", label: "96×96" },
  { size: 180, filename: "apple-touch-icon.png", label: "180×180 (apple)" },
  { size: 192, filename: "icon-192.png", label: "192×192" },
  { size: 512, filename: "icon-512.png", label: "512×512" },
];

const PREVIEW_SIZES = [16, 32, 180];

const SUPERSAMPLE = 4;

function drawRoundedRect(
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

function renderIcon(size: number, opts: IconOptions): HTMLCanvasElement {
  const hi = size * SUPERSAMPLE;
  const big = document.createElement("canvas");
  big.width = hi;
  big.height = hi;
  const ctx = big.getContext("2d");
  if (!ctx) return big;

  ctx.clearRect(0, 0, hi, hi);

  const radiusPx = (opts.radiusPct / 100) * (hi / 2);
  drawRoundedRect(ctx, 0, 0, hi, hi, radiusPx);
  ctx.fillStyle = opts.bgColor;
  ctx.fill();

  const text = opts.text.trim() || "SB";
  const fontSize = hi * 0.56;
  ctx.font = `${opts.weight} ${fontSize}px ${FONT_STACKS[opts.font]}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = opts.textColor;
  ctx.fillText(text, hi / 2, hi / 2 + fontSize * 0.04, hi * 0.92);

  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const octx = out.getContext("2d");
  if (octx) {
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(big, 0, 0, size, size);
  }
  return out;
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 200);
    }, "image/png");
  });
}

function buildSnippet(opts: IconOptions): string {
  void opts;
  const links = [
    `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`,
    `<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`,
    `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />`,
    `<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />`,
  ].join("\n");

  const manifest = {
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  return `${links}\n\n<!-- manifest.json -->\n${JSON.stringify(manifest, null, 2)}`;
}

export function FaviconGen() {
  const ready = useRevealReady();
  const [text, setText] = useState("SB");
  const [textColor, setTextColor] = useState("#fafafa");
  const [bgColor, setBgColor] = useState("#09090b");
  const [radiusPct, setRadiusPct] = useState(20);
  const [weight, setWeight] = useState(600);
  const [font, setFont] = useState<FontChoice>("sans");
  const [fontsReady, setFontsReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (!cancelled) setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const opts: IconOptions = useMemo(
    () => ({
      text: text.slice(0, 3),
      textColor,
      bgColor,
      radiusPct,
      weight,
      font,
    }),
    [text, textColor, bgColor, radiusPct, weight, font]
  );

  const previews = useMemo(() => {
    void fontsReady;
    return PREVIEW_SIZES.map((size) => ({
      size,
      dataUrl: renderIcon(size, opts).toDataURL("image/png"),
    }));
  }, [opts, fontsReady]);

  const snippet = useMemo(() => buildSnippet(opts), [opts]);

  async function handleDownload(spec: SizeSpec) {
    const canvas = renderIcon(spec.size, opts);
    await downloadCanvas(canvas, spec.filename);
  }

  async function handleDownloadAll() {
    for (const spec of DOWNLOAD_SIZES) {
      await handleDownload(spec);
    }
  }

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Favicon Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div className={styles.previews}>
            {previews.map((p) => (
              <div className={styles.previewItem} key={p.size}>
                <div
                  className={styles.previewSwatch}
                  style={{ width: p.size, height: p.size }}
                >
                  <img
                    src={p.dataUrl}
                    width={p.size}
                    height={p.size}
                    alt={`${p.size}x${p.size} favicon preview`}
                  />
                </div>
                <span className={styles.previewLabel}>
                  {p.size}×{p.size}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="text">Text / emoji</label>
              <input
                id="text"
                type="text"
                className={styles.textInput}
                value={text}
                maxLength={3}
                onChange={(e) => setText(e.target.value.slice(0, 3))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="radius">
                Corner radius <span className={styles.fieldValue}>{radiusPct}%</span>
              </label>
              <input
                id="radius"
                type="range"
                min={0}
                max={50}
                value={radiusPct}
                onChange={(e) => setRadiusPct(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="textColor">Text color</label>
              <div className={styles.colorRow}>
                <input
                  id="textColor"
                  type="color"
                  className={styles.colorInput}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="bgColor">Background color</label>
              <div className={styles.colorRow}>
                <input
                  id="bgColor"
                  type="color"
                  className={styles.colorInput}
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="weight">Font weight</label>
              <select
                id="weight"
                className={styles.select}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              >
                <option value={400}>Regular (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>Semibold (600)</option>
                <option value={700}>Bold (700)</option>
                <option value={800}>Extrabold (800)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="font">Font family</label>
              <select
                id="font"
                className={styles.select}
                value={font}
                onChange={(e) => setFont(e.target.value as FontChoice)}
              >
                <option value="sans">Sans</option>
                <option value="mono">Mono</option>
                <option value="serif">Serif</option>
              </select>
            </div>
          </div>

          <div className={styles.downloads}>
            <div className={styles.downloadsHead}>
              <span className={styles.outputLabel}>Download PNGs</span>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleDownloadAll}
              >
                <Download size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                Download all
              </button>
            </div>
            <div className={styles.downloadGrid}>
              {DOWNLOAD_SIZES.map((spec) => (
                <button
                  key={spec.filename}
                  type="button"
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(spec)}
                >
                  {spec.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>HTML &lt;head&gt; snippet</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copySnippet}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{snippet}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default FaviconGen;
