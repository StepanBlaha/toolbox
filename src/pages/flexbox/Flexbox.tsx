import { useMemo, useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Flexbox.module.css";

type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems = "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

const DIRECTIONS: FlexDirection[] = [
  "row",
  "row-reverse",
  "column",
  "column-reverse",
];

const JUSTIFY: JustifyContent[] = [
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
];

const ALIGN: AlignItems[] = [
  "stretch",
  "flex-start",
  "center",
  "flex-end",
  "baseline",
];

const WRAP: FlexWrap[] = ["nowrap", "wrap", "wrap-reverse"];

const ITEM_HEIGHTS = [64, 96, 48, 112, 72, 56, 100, 80, 60, 120, 88, 52];

const MIN_ITEMS = 1;
const MAX_ITEMS = 12;

export default function Flexbox() {
  const ready = useRevealReady();
  const [direction, setDirection] = useState<FlexDirection>("row");
  const [justify, setJustify] = useState<JustifyContent>("flex-start");
  const [align, setAlign] = useState<AlignItems>("stretch");
  const [wrap, setWrap] = useState<FlexWrap>("nowrap");
  const [gap, setGap] = useState(12);
  const [itemCount, setItemCount] = useState(6);
  const [copied, setCopied] = useState(false);

  const items = useMemo(
    () => Array.from({ length: itemCount }, (_, i) => i + 1),
    [itemCount]
  );

  const cssText = `display: flex;\nflex-direction: ${direction};\njustify-content: ${justify};\nalign-items: ${align};\nflex-wrap: ${wrap};\ngap: ${gap}px;`;

  function addItem() {
    setItemCount((prev) => Math.min(MAX_ITEMS, prev + 1));
  }

  function removeItem() {
    setItemCount((prev) => Math.max(MIN_ITEMS, prev - 1));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Flexbox Playground" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewFlex}
            style={{
              flexDirection: direction,
              justifyContent: justify,
              alignItems: align,
              flexWrap: wrap,
              gap: `${gap}px`,
            }}
          >
            {items.map((n, idx) => (
              <div
                key={n}
                className={styles.previewBox}
                style={{
                  height:
                    align === "stretch"
                      ? undefined
                      : `${ITEM_HEIGHTS[idx % ITEM_HEIGHTS.length]}px`,
                }}
              >
                {n}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>flex-direction</span>
            <div className={styles.segmented}>
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={clsx(styles.segBtn, direction === d && styles.active)}
                  onClick={() => setDirection(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>justify-content</span>
            <div className={styles.segmented}>
              {JUSTIFY.map((j) => (
                <button
                  key={j}
                  type="button"
                  className={clsx(styles.segBtn, justify === j && styles.active)}
                  onClick={() => setJustify(j)}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>align-items</span>
            <div className={styles.segmented}>
              {ALIGN.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={clsx(styles.segBtn, align === a && styles.active)}
                  onClick={() => setAlign(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>flex-wrap</span>
            <div className={styles.segmented}>
              {WRAP.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={clsx(styles.segBtn, wrap === w && styles.active)}
                  onClick={() => setWrap(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>
              gap <span className={styles.fieldValue}>{gap}px</span>
            </span>
            <input
              type="range"
              min={0}
              max={40}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
            />
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>item count</span>
            <div className={styles.countRow}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Remove item"
                onClick={removeItem}
                disabled={itemCount <= MIN_ITEMS}
              >
                <Trash2 size={14} />
              </button>
              <span className={styles.countValue}>{itemCount}</span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Add item"
                onClick={addItem}
                disabled={itemCount >= MAX_ITEMS}
              >
                <Plus size={14} />
              </button>
            </div>
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

export { Flexbox };
