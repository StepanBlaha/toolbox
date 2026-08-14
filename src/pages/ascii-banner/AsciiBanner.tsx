import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { FONT_HEIGHT, getGlyph } from "./asciiFont";
import styles from "./AsciiBanner.module.css";

const FILL_PRESETS: { value: string; label: string }[] = [
  { value: "#", label: "#" },
  { value: "█", label: "█" },
  { value: "*", label: "*" },
  { value: "@", label: "@" },
  { value: "o", label: "o" },
  { value: "+", label: "+" },
];

/** Renders `text` as multi-line block ASCII art using the built-in font.
 *  Unknown characters fall back to a blank glyph. `spacing` adds extra
 *  space columns between glyphs; `fillChar` replaces the font's '#' fill. */
function renderBanner(text: string, fillChar: string, spacing: number): string {
  const upper = text.toUpperCase();
  if (!upper.length) return "";

  const fill = fillChar.length > 0 ? fillChar[0] : "#";
  const glyphs = [...upper].map(getGlyph);
  const gap = " ".repeat(1 + Math.max(0, spacing));

  const rows: string[] = [];
  for (let r = 0; r < FONT_HEIGHT; r++) {
    const row = glyphs.map((g) => g[r]).join(gap);
    rows.push(fill === "#" ? row : row.replace(/#/g, fill));
  }
  return rows.join("\n");
}

function AsciiBanner() {
  const ready = useRevealReady();
  const [text, setText] = useState("HELLO");
  const [fillChar, setFillChar] = useState("#");
  const [spacing, setSpacing] = useState(1);
  const [copied, setCopied] = useState(false);

  const banner = useMemo(
    () => renderBanner(text, fillChar, spacing),
    [text, fillChar, spacing]
  );

  async function copy() {
    if (!banner) return;
    await navigator.clipboard.writeText(banner);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!banner) return;
    const blob = new Blob([banner], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-banner.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Frame wide>
      <SectionHeading title="ASCII Banner" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="bannerText">Text</label>
            <input
              id="bannerText"
              type="text"
              className={styles.textInput}
              value={text}
              maxLength={40}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something…"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="fillChar">Fill character</label>
              <div className={styles.fillRow}>
                <input
                  id="fillChar"
                  type="text"
                  className={styles.fillInput}
                  value={fillChar}
                  maxLength={1}
                  onChange={(e) => setFillChar(e.target.value || "#")}
                />
                <div className={styles.presetRow}>
                  {FILL_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={clsx(
                        styles.presetBtn,
                        fillChar === p.value && styles.presetActive
                      )}
                      onClick={() => setFillChar(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="spacing">
                Letter spacing <span className={styles.fieldValue}>{spacing}</span>
              </label>
              <input
                id="spacing"
                type="range"
                min={0}
                max={4}
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
              />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.outputPanel} variants={revealItem}>
          <div className={styles.outputHead}>
            <span className={styles.outputLabel}>Output</span>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={download}
                disabled={!banner}
              >
                <Download size={13} />
                Download .txt
              </button>
              <button
                type="button"
                className={clsx(styles.actionBtn, copied && styles.copied)}
                onClick={copy}
                disabled={!banner}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <pre className={styles.pre}>{banner || " "}</pre>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default AsciiBanner;
export { AsciiBanner };
