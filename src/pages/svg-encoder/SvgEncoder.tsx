import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./SvgEncoder.module.css";

type EncodingMode = "url" | "base64";

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="9" stroke="#3b82f6" stroke-width="2" fill="#ffffff"/>
</svg>`;

function encodeUrlSafe(svg: string): string {
  const cleaned = svg.trim().replace(/"/g, "'").replace(/\r?\n/g, "");
  return encodeURIComponent(cleaned)
    .replace(/%20/g, " ")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%2F/g, "/")
    .replace(/%2C/g, ",")
    .replace(/%3B/g, ";");
}

function encodeBase64(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function SvgEncoder() {
  const ready = useRevealReady();
  const [svg, setSvg] = useState(DEFAULT_SVG);
  const [mode, setMode] = useState<EncodingMode>("url");
  const [copiedLine, setCopiedLine] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  const dataUri = useMemo(() => {
    try {
      if (mode === "base64") {
        return `data:image/svg+xml;base64,${encodeBase64(svg)}`;
      }
      return `data:image/svg+xml,${encodeUrlSafe(svg)}`;
    } catch {
      return "";
    }
  }, [svg, mode]);

  const bgLine = `background-image: url("${dataUri}");`;

  async function copyLine() {
    await navigator.clipboard.writeText(bgLine);
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 1500);
  }

  async function copyUri() {
    await navigator.clipboard.writeText(dataUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="SVG to CSS" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.editorPanel} variants={revealItem}>
          <label className={styles.label} htmlFor="svg-input">
            SVG markup
          </label>
          <textarea
            id="svg-input"
            className={styles.textarea}
            value={svg}
            onChange={(e) => setSvg(e.target.value)}
            spellCheck={false}
            placeholder="Paste raw SVG markup here..."
          />

          <div className={styles.modeRow}>
            <span className={styles.modeLabel}>Encoding</span>
            <div className={styles.segmented}>
              <button
                type="button"
                className={clsx(styles.segment, mode === "url" && styles.segmentActive)}
                onClick={() => setMode("url")}
              >
                URL-encoded
              </button>
              <button
                type="button"
                className={clsx(styles.segment, mode === "base64" && styles.segmentActive)}
                onClick={() => setMode("base64")}
              >
                Base64
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.previewCol} variants={revealItem}>
          <div className={styles.previewPanel}>
            <div
              className={styles.previewSwatch}
              style={
                dataUri
                  ? {
                      backgroundImage: `url("${dataUri}")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "contain",
                    }
                  : undefined
              }
            />
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>background-image</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copiedLine && styles.copied)}
                onClick={copyLine}
              >
                {copiedLine ? <Check size={13} /> : <Copy size={13} />}
                {copiedLine ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{bgLine}</pre>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>Data URI</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copiedUri && styles.copied)}
                onClick={copyUri}
              >
                {copiedUri ? <Check size={13} /> : <Copy size={13} />}
                {copiedUri ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className={styles.pre}>{dataUri}</pre>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default SvgEncoder;
