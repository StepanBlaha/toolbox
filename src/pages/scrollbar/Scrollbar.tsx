import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Scrollbar.module.css";

const DUMMY_BLOCKS = [
  "Intro",
  "Overview",
  "Details",
  "Specifications",
  "Notes",
  "History",
  "Usage",
  "Caveats",
  "References",
  "Appendix",
];

export function Scrollbar() {
  const ready = useRevealReady();
  const [thickness, setThickness] = useState(12);
  const [trackColor, setTrackColor] = useState("#f4f4f5");
  const [thumbColor, setThumbColor] = useState("#a1a1aa");
  const [thumbHoverColor, setThumbHoverColor] = useState("#71717a");
  const [thumbRadius, setThumbRadius] = useState(8);
  const [trackRadius, setTrackRadius] = useState(8);
  const [copied, setCopied] = useState(false);

  const webkitCss = useMemo(
    () =>
      [
        `.your-element::-webkit-scrollbar {`,
        `  width: ${thickness}px;`,
        `  height: ${thickness}px;`,
        `}`,
        ``,
        `.your-element::-webkit-scrollbar-track {`,
        `  background: ${trackColor};`,
        `  border-radius: ${trackRadius}px;`,
        `}`,
        ``,
        `.your-element::-webkit-scrollbar-thumb {`,
        `  background: ${thumbColor};`,
        `  border-radius: ${thumbRadius}px;`,
        `}`,
        ``,
        `.your-element::-webkit-scrollbar-thumb:hover {`,
        `  background: ${thumbHoverColor};`,
        `}`,
      ].join("\n"),
    [thickness, trackColor, trackRadius, thumbColor, thumbRadius, thumbHoverColor]
  );

  const firefoxCss = useMemo(
    () =>
      [
        `.your-element {`,
        `  scrollbar-width: ${thickness <= 8 ? "thin" : "auto"};`,
        `  scrollbar-color: ${thumbColor} ${trackColor};`,
        `}`,
      ].join("\n"),
    [thickness, thumbColor, trackColor]
  );

  const cssText = `${webkitCss}\n\n/* Firefox (no width/color-per-px, closest supported values) */\n${firefoxCss}`;

  // Scoped injected style: targets the `.sbPreview` element by its literal
  // global class name (CSS Modules hashes `.sbPreview` in JSX, but we also
  // stamp a stable `sb-preview` class alongside it purely so this <style>
  // block has a fixed, predictable selector to bind to). The selector's
  // specificity (class) beats the global `*::-webkit-scrollbar{width:0;
  // height:0}` reset in index.css (universal selector), which is how the
  // live scrollbar becomes visible again for this one element only.
  const previewStyleTag = `
    .sb-preview::-webkit-scrollbar {
      width: ${thickness}px;
      height: ${thickness}px;
    }
    .sb-preview::-webkit-scrollbar-track {
      background: ${trackColor};
      border-radius: ${trackRadius}px;
    }
    .sb-preview::-webkit-scrollbar-thumb {
      background: ${thumbColor};
      border-radius: ${thumbRadius}px;
    }
    .sb-preview::-webkit-scrollbar-thumb:hover {
      background: ${thumbHoverColor};
    }
  `;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Scrollbar Styler" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <style>{previewStyleTag}</style>
          {/* No inline standard `scrollbar-width`/`scrollbar-color` here: when
             those are set, Chromium ignores the `::-webkit-scrollbar` pseudo
             styling entirely, so the live preview would fall back to a default
             bar. The WebKit rules in the injected <style> drive the preview;
             the Firefox equivalents still appear in the copyable output. */}
          <div className={clsx(styles.sbPreview, "sb-preview")}>
            <div className={styles.dummyContent}>
              {DUMMY_BLOCKS.map((label) => (
                <div className={styles.dummyBlock} key={label}>
                  <span className={styles.dummyTitle}>{label}</span>
                  <p className={styles.dummyText}>
                    Scroll this panel to see the styled scrollbar in action.
                    Dummy filler text pads the block out so the container
                    actually overflows and the track and thumb render.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="thickness">
                Thickness{" "}
                <span className={styles.fieldValue}>{thickness}px</span>
              </label>
              <input
                id="thickness"
                type="range"
                min={2}
                max={24}
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="trackRadius">
                Track radius{" "}
                <span className={styles.fieldValue}>{trackRadius}px</span>
              </label>
              <input
                id="trackRadius"
                type="range"
                min={0}
                max={20}
                value={trackRadius}
                onChange={(e) => setTrackRadius(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="thumbRadius">
                Thumb radius{" "}
                <span className={styles.fieldValue}>{thumbRadius}px</span>
              </label>
              <input
                id="thumbRadius"
                type="range"
                min={0}
                max={20}
                value={thumbRadius}
                onChange={(e) => setThumbRadius(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="trackColor">Track color</label>
              <div className={styles.colorRow}>
                <input
                  id="trackColor"
                  type="color"
                  className={styles.colorInput}
                  value={trackColor}
                  onChange={(e) => setTrackColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={trackColor}
                  onChange={(e) => setTrackColor(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="thumbColor">Thumb color</label>
              <div className={styles.colorRow}>
                <input
                  id="thumbColor"
                  type="color"
                  className={styles.colorInput}
                  value={thumbColor}
                  onChange={(e) => setThumbColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={thumbColor}
                  onChange={(e) => setThumbColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="thumbHoverColor">Thumb hover color</label>
              <div className={styles.colorRow}>
                <input
                  id="thumbHoverColor"
                  type="color"
                  className={styles.colorInput}
                  value={thumbHoverColor}
                  onChange={(e) => setThumbHoverColor(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  value={thumbHoverColor}
                  onChange={(e) => setThumbHoverColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className={styles.hint}>
            Scroll the preview on the left (Chromium/WebKit) to see the live
            result. Firefox only supports the thin/auto width and a single
            thumb/track color pair - shown separately below.
          </p>

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

export default Scrollbar;
