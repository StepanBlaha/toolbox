import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Grid.module.css";

const MIN_TRACKS = 1;
const MAX_TRACKS = 12;
const MIN_GAP = 0;
const MAX_GAP = 60;
const DEFAULT_TRACK = "1fr";

function resizeTracks(tracks: string[], count: number): string[] {
  if (count === tracks.length) return tracks;
  if (count < tracks.length) return tracks.slice(0, count);
  return [...tracks, ...Array(count - tracks.length).fill(DEFAULT_TRACK)];
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function Grid() {
  const ready = useRevealReady();
  const [columnCount, setColumnCount] = useState(3);
  const [rowCount, setRowCount] = useState(3);
  const [columns, setColumns] = useState<string[]>(
    Array(3).fill(DEFAULT_TRACK)
  );
  const [rows, setRows] = useState<string[]>(Array(3).fill(DEFAULT_TRACK));
  const [columnGap, setColumnGap] = useState(12);
  const [rowGap, setRowGap] = useState(12);
  const [copied, setCopied] = useState(false);

  function updateColumnCount(next: number) {
    const count = clamp(next, MIN_TRACKS, MAX_TRACKS);
    setColumnCount(count);
    setColumns((prev) => resizeTracks(prev, count));
  }

  function updateRowCount(next: number) {
    const count = clamp(next, MIN_TRACKS, MAX_TRACKS);
    setRowCount(count);
    setRows((prev) => resizeTracks(prev, count));
  }

  function updateColumnTrack(idx: number, value: string) {
    setColumns((prev) => prev.map((t, i) => (i === idx ? value : t)));
  }

  function updateRowTrack(idx: number, value: string) {
    setRows((prev) => prev.map((t, i) => (i === idx ? value : t)));
  }

  const templateColumns = useMemo(
    () => (columns.length ? columns.join(" ") : DEFAULT_TRACK),
    [columns]
  );
  const templateRows = useMemo(
    () => (rows.length ? rows.join(" ") : DEFAULT_TRACK),
    [rows]
  );

  const cssText = `display: grid;\ngrid-template-columns: ${templateColumns};\ngrid-template-rows: ${templateRows};\ngap: ${rowGap}px ${columnGap}px;`;

  const cellCount = columnCount * rowCount;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="CSS Grid Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewGrid}
            style={{
              gridTemplateColumns: templateColumns,
              gridTemplateRows: templateRows,
              columnGap: `${columnGap}px`,
              rowGap: `${rowGap}px`,
            }}
          >
            {Array.from({ length: cellCount }, (_, i) => (
              <div className={styles.cell} key={i}>
                {i + 1}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="columnCount">
                Columns <span className={styles.fieldValue}>{columnCount}</span>
              </label>
              <input
                id="columnCount"
                type="range"
                min={MIN_TRACKS}
                max={MAX_TRACKS}
                value={columnCount}
                onChange={(e) => updateColumnCount(Number(e.target.value))}
              />
              <input
                type="number"
                className={styles.numberInput}
                min={MIN_TRACKS}
                max={MAX_TRACKS}
                value={columnCount}
                onChange={(e) => updateColumnCount(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="rowCount">
                Rows <span className={styles.fieldValue}>{rowCount}</span>
              </label>
              <input
                id="rowCount"
                type="range"
                min={MIN_TRACKS}
                max={MAX_TRACKS}
                value={rowCount}
                onChange={(e) => updateRowCount(Number(e.target.value))}
              />
              <input
                type="number"
                className={styles.numberInput}
                min={MIN_TRACKS}
                max={MAX_TRACKS}
                value={rowCount}
                onChange={(e) => updateRowCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="columnGap">
                Column gap <span className={styles.fieldValue}>{columnGap}px</span>
              </label>
              <input
                id="columnGap"
                type="range"
                min={MIN_GAP}
                max={MAX_GAP}
                value={columnGap}
                onChange={(e) =>
                  setColumnGap(clamp(Number(e.target.value), MIN_GAP, MAX_GAP))
                }
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="rowGap">
                Row gap <span className={styles.fieldValue}>{rowGap}px</span>
              </label>
              <input
                id="rowGap"
                type="range"
                min={MIN_GAP}
                max={MAX_GAP}
                value={rowGap}
                onChange={(e) =>
                  setRowGap(clamp(Number(e.target.value), MIN_GAP, MAX_GAP))
                }
              />
            </div>
          </div>

          <div className={styles.tracksBlock}>
            <span className={styles.outputLabel}>Column tracks</span>
            <div className={styles.trackList}>
              {columns.map((track, idx) => (
                <input
                  key={idx}
                  type="text"
                  className={styles.trackInput}
                  value={track}
                  aria-label={`Column ${idx + 1} track size`}
                  onChange={(e) => updateColumnTrack(idx, e.target.value)}
                />
              ))}
            </div>
          </div>

          <div className={styles.tracksBlock}>
            <span className={styles.outputLabel}>Row tracks</span>
            <div className={styles.trackList}>
              {rows.map((track, idx) => (
                <input
                  key={idx}
                  type="text"
                  className={styles.trackInput}
                  value={track}
                  aria-label={`Row ${idx + 1} track size`}
                  onChange={(e) => updateRowTrack(idx, e.target.value)}
                />
              ))}
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

export default Grid;
