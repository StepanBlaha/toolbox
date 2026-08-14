import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Maximize2, Plus, Shuffle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Bento.module.css";

interface BentoItem {
  id: string;
  colSpan: number;
  rowSpan: number;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  moved: boolean;
}

interface ResizeState {
  id: string;
  startX: number;
  startY: number;
  startCol: number;
  startRow: number;
  cellW: number;
}

const MIN_COLS = 2;
const MAX_COLS = 6;
const MIN_GAP = 0;
const MAX_GAP = 48;
const MIN_RADIUS = 0;
const MAX_RADIUS = 40;
const BASE_ROW = 90;
const MAX_ROW_SPAN = 4;
const DRAG_THRESHOLD = 6;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function makeItem(colSpan = 1, rowSpan = 1): BentoItem {
  return { id: Math.random().toString(36).slice(2), colSpan, rowSpan };
}

function defaultItems(): BentoItem[] {
  return [
    makeItem(2, 2),
    makeItem(1, 1),
    makeItem(1, 1),
    makeItem(2, 1),
    makeItem(1, 2),
    makeItem(1, 1),
  ];
}

export function Bento() {
  const ready = useRevealReady();
  const [columns, setColumns] = useState(4);
  const [gap, setGap] = useState(12);
  const [radius, setRadius] = useState(12);
  const [items, setItems] = useState<BentoItem[]>(defaultItems());
  const [copied, setCopied] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const itemRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedId) return;
    itemRowRefs.current[selectedId]?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [selectedId]);

  function reorderItems(sourceId: string, targetId: string) {
    setItems((prev) => {
      const sourceIdx = prev.findIndex((it) => it.id === sourceId);
      if (sourceIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIdx, 1);
      const insertAt = next.findIndex((it) => it.id === targetId);
      next.splice(insertAt === -1 ? next.length : insertAt, 0, moved);
      return next;
    });
  }

  function handleTilePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    id: string
  ) {
    if (resizeStateRef.current) return;
    dragStateRef.current = { id, startX: e.clientX, startY: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleTilePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      state.moved = true;
      setDraggingId(state.id);
    }
    if (state.moved) {
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-tile-id]");
      const targetId = target?.dataset.tileId;
      setDropTargetId(targetId && targetId !== state.id ? targetId : null);
    }
  }

  function handleTilePointerUp(
    e: React.PointerEvent<HTMLDivElement>,
    id: string
  ) {
    const state = dragStateRef.current;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (state?.moved && dropTargetId && dropTargetId !== state.id) {
      reorderItems(state.id, dropTargetId);
      setSelectedId(state.id);
    } else if (state && !state.moved) {
      setSelectedId((prev) => (prev === id ? null : id));
    }
    dragStateRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleResizePointerDown(
    e: React.PointerEvent<HTMLButtonElement>,
    id: string
  ) {
    e.stopPropagation();
    e.preventDefault();
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const rect = previewRef.current?.getBoundingClientRect();
    const cellW = rect ? (rect.width - gap * (columns - 1)) / columns : 80;
    resizeStateRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      startCol: item.colSpan,
      startRow: item.rowSpan,
      cellW,
    };
    setSelectedId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleResizePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const state = resizeStateRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const colStep = state.cellW + gap;
    const rowStep = BASE_ROW + gap;
    const deltaCols = Math.round(dx / colStep);
    const deltaRows = Math.round(dy / rowStep);
    const nextCol = clamp(state.startCol + deltaCols, 1, columns);
    const nextRow = clamp(state.startRow + deltaRows, 1, MAX_ROW_SPAN);
    updateItem(state.id, { colSpan: nextCol, rowSpan: nextRow });
  }

  function handleResizePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resizeStateRef.current = null;
  }

  function updateColumns(next: number) {
    const count = clamp(next, MIN_COLS, MAX_COLS);
    setColumns(count);
    setItems((prev) =>
      prev.map((it) => ({ ...it, colSpan: clamp(it.colSpan, 1, count) }))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, makeItem(1, 1)]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function clearItems() {
    setItems([]);
  }

  function updateItem(id: string, patch: Partial<BentoItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  function randomize() {
    setItems((prev) =>
      prev.length
        ? prev.map(() =>
            makeItem(
              1 + Math.floor(Math.random() * columns),
              1 + Math.floor(Math.random() * MAX_ROW_SPAN)
            )
          )
        : Array.from({ length: 6 + Math.floor(Math.random() * 4) }, () =>
            makeItem(
              1 + Math.floor(Math.random() * columns),
              1 + Math.floor(Math.random() * MAX_ROW_SPAN)
            )
          )
    );
  }

  const containerCss = `.bento {\n  display: grid;\n  grid-template-columns: repeat(${columns}, 1fr);\n  grid-auto-rows: ${BASE_ROW}px;\n  grid-auto-flow: dense;\n  gap: ${gap}px;\n}`;

  const itemsCss = useMemo(
    () =>
      items
        .map(
          (it, idx) =>
            `.item-${idx + 1} { grid-column: span ${it.colSpan}; grid-row: span ${it.rowSpan}; }`
        )
        .join("\n"),
    [items]
  );

  const cssText = `${containerCss}\n\n${itemsCss}`;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Bento Grid" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            ref={previewRef}
            className={styles.previewGrid}
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridAutoRows: `${BASE_ROW}px`,
              gap: `${gap}px`,
            }}
          >
            {items.map((it, idx) => (
              <div
                key={it.id}
                data-tile-id={it.id}
                className={clsx(
                  styles.tile,
                  draggingId === it.id && styles.dragging,
                  dropTargetId === it.id && styles.dropTarget,
                  selectedId === it.id && styles.selected
                )}
                style={{
                  gridColumn: `span ${it.colSpan}`,
                  gridRow: `span ${it.rowSpan}`,
                  borderRadius: `${radius}px`,
                }}
                onPointerDown={(e) => handleTilePointerDown(e, it.id)}
                onPointerMove={handleTilePointerMove}
                onPointerUp={(e) => handleTilePointerUp(e, it.id)}
                onPointerCancel={(e) => handleTilePointerUp(e, it.id)}
              >
                <span className={styles.tileIndex}>{idx + 1}</span>
                <span className={styles.tileSpan}>
                  {it.colSpan}×{it.rowSpan}
                </span>
                <button
                  type="button"
                  className={styles.resizeHandle}
                  aria-label="Resize item"
                  onPointerDown={(e) => handleResizePointerDown(e, it.id)}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerUp}
                >
                  <Maximize2 size={11} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div className={styles.empty}>No items - add one to start</div>
            )}
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="columns">
                Columns <span className={styles.fieldValue}>{columns}</span>
              </label>
              <input
                id="columns"
                type="range"
                min={MIN_COLS}
                max={MAX_COLS}
                value={columns}
                onChange={(e) => updateColumns(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="gap">
                Gap <span className={styles.fieldValue}>{gap}px</span>
              </label>
              <input
                id="gap"
                type="range"
                min={MIN_GAP}
                max={MAX_GAP}
                value={gap}
                onChange={(e) =>
                  setGap(clamp(Number(e.target.value), MIN_GAP, MAX_GAP))
                }
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="radius">
                Radius <span className={styles.fieldValue}>{radius}px</span>
              </label>
              <input
                id="radius"
                type="range"
                min={MIN_RADIUS}
                max={MAX_RADIUS}
                value={radius}
                onChange={(e) =>
                  setRadius(clamp(Number(e.target.value), MIN_RADIUS, MAX_RADIUS))
                }
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.addBtn} onClick={addItem}>
              <Plus size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Add item
            </button>
            <button
              type="button"
              className={styles.addBtn}
              onClick={randomize}
            >
              <Shuffle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Randomize
            </button>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearItems}
            >
              <Trash2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Clear
            </button>
          </div>

          <div className={styles.items}>
            {items.map((it, idx) => (
              <div
                className={clsx(
                  styles.item,
                  selectedId === it.id && styles.itemSelected
                )}
                key={it.id}
                ref={(el) => {
                  itemRowRefs.current[it.id] = el;
                }}
                onClick={() => setSelectedId(it.id)}
              >
                <span className={styles.itemTitle}>Item {idx + 1}</span>

                <div className={styles.itemFields}>
                  <div className={styles.field}>
                    <label>
                      Col span{" "}
                      <span className={styles.fieldValue}>{it.colSpan}</span>
                    </label>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min={1}
                      max={columns}
                      value={it.colSpan}
                      onChange={(e) =>
                        updateItem(it.id, {
                          colSpan: clamp(Number(e.target.value), 1, columns),
                        })
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Row span{" "}
                      <span className={styles.fieldValue}>{it.rowSpan}</span>
                    </label>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min={1}
                      max={MAX_ROW_SPAN}
                      value={it.rowSpan}
                      onChange={(e) =>
                        updateItem(it.id, {
                          rowSpan: clamp(Number(e.target.value), 1, MAX_ROW_SPAN),
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.removeBtn}
                  aria-label="Remove item"
                  onClick={() => removeItem(it.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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

export default Bento;
