import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./OgImage.module.css";

type Align = "left" | "center";
type BgMode = "solid" | "gradient";

interface Theme {
  name: string;
  bgMode: BgMode;
  bgColor: string;
  bgColor2: string;
  angle: number;
  textColor: string;
  accentColor: string;
}

const THEMES: Theme[] = [
  {
    name: "Dark",
    bgMode: "solid",
    bgColor: "#09090b",
    bgColor2: "#18181b",
    angle: 135,
    textColor: "#fafafa",
    accentColor: "#3b82f6",
  },
  {
    name: "Light",
    bgMode: "solid",
    bgColor: "#fafafa",
    bgColor2: "#e4e4e7",
    angle: 135,
    textColor: "#09090b",
    accentColor: "#3b82f6",
  },
  {
    name: "Gradient",
    bgMode: "gradient",
    bgColor: "#1e1b4b",
    bgColor2: "#312e81",
    angle: 135,
    textColor: "#fafafa",
    accentColor: "#93c5fd",
  },
];

const WIDTH = 1200;
const HEIGHT = 630;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function OgImage() {
  const ready = useRevealReady();

  const [title, setTitle] = useState("Ship faster with better tools");
  const [subtitle, setSubtitle] = useState(
    "A toolbox of small, focused utilities for everyday dev work."
  );
  const [eyebrow, setEyebrow] = useState("toolbox.dev");
  const [bgMode, setBgMode] = useState<BgMode>("gradient");
  const [bgColor, setBgColor] = useState("#1e1b4b");
  const [bgColor2, setBgColor2] = useState("#312e81");
  const [angle, setAngle] = useState(135);
  const [textColor, setTextColor] = useState("#fafafa");
  const [accentColor, setAccentColor] = useState("#93c5fd");
  const [align, setAlign] = useState<Align>("left");
  const [dotTexture, setDotTexture] = useState(true);
  const [activeTheme, setActiveTheme] = useState<string | null>("Gradient");
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // background
    if (bgMode === "gradient") {
      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const half = Math.max(WIDTH, HEIGHT);
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const grad = ctx.createLinearGradient(
        cx - dx * half,
        cy - dy * half,
        cx + dx * half,
        cy + dy * half
      );
      grad.addColorStop(0, bgColor);
      grad.addColorStop(1, bgColor2);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // subtle dot texture
    if (dotTexture) {
      const [r, g, b] = hexToRgb(textColor);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.06)`;
      const spacing = 28;
      const radius = 1.4;
      for (let y = spacing; y < HEIGHT; y += spacing) {
        for (let x = spacing; x < WIDTH; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const padX = 96;
    const maxTextWidth = WIDTH - padX * 2;
    const textX = align === "center" ? WIDTH / 2 : padX;
    ctx.textAlign = align === "center" ? "center" : "left";

    // eyebrow
    let cursorY = 200;
    if (eyebrow.trim()) {
      ctx.font = "600 22px 'Geist Mono', ui-monospace, monospace";
      ctx.fillStyle = accentColor;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(eyebrow.toUpperCase(), textX, cursorY);
      cursorY += 46;
    }

    // title (wrapped, bold)
    const titleSize = 64;
    const titleLineHeight = titleSize * 1.16;
    ctx.font = `700 ${titleSize}px 'IBM Plex Sans', ui-sans-serif, sans-serif`;
    ctx.fillStyle = textColor;
    const titleLines = wrapText(ctx, title, maxTextWidth).slice(0, 4);
    for (const line of titleLines) {
      cursorY += titleLineHeight * 0.86;
      ctx.fillText(line, textX, cursorY);
    }
    cursorY += 20;

    // subtitle (muted)
    if (subtitle.trim()) {
      const subSize = 26;
      const subLineHeight = subSize * 1.5;
      ctx.font = `400 ${subSize}px 'IBM Plex Sans', ui-sans-serif, sans-serif`;
      const [r, g, b] = hexToRgb(textColor);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.72)`;
      const subLines = wrapText(ctx, subtitle, maxTextWidth * 0.85).slice(0, 3);
      for (const line of subLines) {
        cursorY += subLineHeight * 0.7;
        ctx.fillText(line, textX, cursorY);
      }
    }
  }, [
    title,
    subtitle,
    eyebrow,
    bgMode,
    bgColor,
    bgColor2,
    angle,
    textColor,
    accentColor,
    align,
    dotTexture,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  function applyTheme(theme: Theme) {
    setBgMode(theme.bgMode);
    setBgColor(theme.bgColor);
    setBgColor2(theme.bgColor2);
    setAngle(theme.angle);
    setTextColor(theme.textColor);
    setAccentColor(theme.accentColor);
    setActiveTheme(theme.name);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(new globalThis.Blob([blob], { type: "image/png" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "og-image.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  const metaSnippet = `<meta property="og:image" content="https://yourdomain.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />`;

  async function copySnippet() {
    await navigator.clipboard.writeText(metaSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="OG Image Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.presetRow}>
            {THEMES.map((theme) => (
              <button
                key={theme.name}
                type="button"
                className={clsx(
                  styles.presetChip,
                  activeTheme === theme.name && styles.presetChipActive
                )}
                onClick={() => applyTheme(theme)}
              >
                <span
                  className={styles.presetSwatch}
                  style={{
                    background:
                      theme.bgMode === "gradient"
                        ? `linear-gradient(135deg, ${theme.bgColor}, ${theme.bgColor2})`
                        : theme.bgColor,
                  }}
                />
                {theme.name}
              </button>
            ))}
          </div>

          <div className={styles.field}>
            <label htmlFor="eyebrow">Eyebrow / badge</label>
            <input
              id="eyebrow"
              type="text"
              className={styles.textInput}
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="title">Title</label>
            <textarea
              id="title"
              className={styles.textArea}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              maxLength={140}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="subtitle">Subtitle</label>
            <textarea
              id="subtitle"
              className={styles.textArea}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Background</label>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={clsx(bgMode === "solid" && styles.segmentedActive)}
                  onClick={() => setBgMode("solid")}
                >
                  Solid
                </button>
                <button
                  type="button"
                  className={clsx(bgMode === "gradient" && styles.segmentedActive)}
                  onClick={() => setBgMode("gradient")}
                >
                  Gradient
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Text align</label>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={clsx(align === "left" && styles.segmentedActive)}
                  onClick={() => setAlign("left")}
                >
                  Left
                </button>
                <button
                  type="button"
                  className={clsx(align === "center" && styles.segmentedActive)}
                  onClick={() => setAlign("center")}
                >
                  Center
                </button>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="bgColor">
                {bgMode === "gradient" ? "Background (start)" : "Background"}
              </label>
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
            {bgMode === "gradient" && (
              <div className={styles.field}>
                <label htmlFor="bgColor2">Background (end)</label>
                <div className={styles.colorRow}>
                  <input
                    id="bgColor2"
                    type="color"
                    className={styles.colorInput}
                    value={bgColor2}
                    onChange={(e) => setBgColor2(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.textInput}
                    value={bgColor2}
                    onChange={(e) => setBgColor2(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {bgMode === "gradient" && (
            <div className={styles.field}>
              <label htmlFor="angle">
                Gradient angle <span className={styles.fieldValue}>{angle}°</span>
              </label>
              <input
                id="angle"
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
              />
            </div>
          )}

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
              <label htmlFor="accentColor">Accent color</label>
              <div className={styles.colorRow}>
                <input
                  id="accentColor"
                  type="color"
                  className={styles.colorInput}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={dotTexture}
              onChange={(e) => setDotTexture(e.target.checked)}
            />
            Subtle dot texture
          </label>

          <button type="button" className={styles.downloadBtn} onClick={download}>
            <Download size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Download PNG
          </button>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>Meta tags</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copySnippet}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{metaSnippet}</pre>
            <p className={styles.hint}>
              Host the downloaded PNG at that URL, then swap in your real domain.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default OgImage;
