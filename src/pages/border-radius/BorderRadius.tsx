import { useMemo, useState } from "react";
import { Check, Copy, Link2, Link2Off } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { useUrlState } from "../../hooks/useUrlState";
import styles from "./BorderRadius.module.css";

type CornerKey = "tl" | "tr" | "br" | "bl";
type Unit = "px" | "%";

interface Corner {
  h: number;
  v: number;
}

type Corners = Record<CornerKey, Corner>;

const CORNER_ORDER: CornerKey[] = ["tl", "tr", "br", "bl"];

const CORNER_LABEL: Record<CornerKey, string> = {
  tl: "Top left",
  tr: "Top right",
  br: "Bottom right",
  bl: "Bottom left",
};

function makeCorners(h: number, v: number): Corners {
  return {
    tl: { h, v },
    tr: { h, v },
    br: { h, v },
    bl: { h, v },
  };
}

interface BorderRadiusState {
  unit: Unit;
  elliptical: boolean;
  linked: boolean;
  corners: Corners;
  boxWidth: number;
  boxHeight: number;
}

const DEFAULT_STATE: BorderRadiusState = {
  unit: "px",
  elliptical: false,
  linked: true,
  corners: makeCorners(24, 24),
  boxWidth: 240,
  boxHeight: 240,
};

export function BorderRadius() {
  const ready = useRevealReady();
  const [state, setState] = useUrlState<BorderRadiusState>(DEFAULT_STATE);
  const { unit, elliptical, linked, corners, boxWidth, boxHeight } = state;
  const [copied, setCopied] = useState(false);

  const maxVal = unit === "px" ? 200 : 50;

  function setUnit(unit: Unit) {
    setState((prev) => ({ ...prev, unit }));
  }

  function setElliptical(elliptical: boolean | ((prev: boolean) => boolean)) {
    setState((prev) => ({
      ...prev,
      elliptical:
        typeof elliptical === "function" ? elliptical(prev.elliptical) : elliptical,
    }));
  }

  function setLinked(linked: boolean | ((prev: boolean) => boolean)) {
    setState((prev) => ({
      ...prev,
      linked: typeof linked === "function" ? linked(prev.linked) : linked,
    }));
  }

  function setBoxWidth(boxWidth: number) {
    setState((prev) => ({ ...prev, boxWidth }));
  }

  function setBoxHeight(boxHeight: number) {
    setState((prev) => ({ ...prev, boxHeight }));
  }

  function updateCorner(key: CornerKey, patch: Partial<Corner>) {
    setState((prev) => {
      if (prev.linked) {
        const next = { ...prev.corners[key], ...patch };
        return { ...prev, corners: makeCorners(next.h, next.v) };
      }
      return {
        ...prev,
        corners: {
          ...prev.corners,
          [key]: { ...prev.corners[key], ...patch },
        },
      };
    });
  }

  const composed = useMemo(() => {
    const hParts = CORNER_ORDER.map((k) => `${corners[k].h}${unit}`);
    if (!elliptical) return hParts.join(" ");
    const vParts = CORNER_ORDER.map((k) => `${corners[k].v}${unit}`);
    return `${hParts.join(" ")} / ${vParts.join(" ")}`;
  }, [corners, elliptical, unit]);

  const cssText = `border-radius: ${composed};`;

  async function copy() {
    await navigator.clipboard.writeText(cssText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Border Radius Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.previewPanel} variants={revealItem}>
          <div
            className={styles.previewBox}
            style={{
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
              borderRadius: composed,
            }}
          />
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="boxWidth">
                Box width <span className={styles.fieldValue}>{boxWidth}px</span>
              </label>
              <input
                id="boxWidth"
                type="range"
                min={80}
                max={400}
                value={boxWidth}
                onChange={(e) => setBoxWidth(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="boxHeight">
                Box height <span className={styles.fieldValue}>{boxHeight}px</span>
              </label>
              <input
                id="boxHeight"
                type="range"
                min={80}
                max={400}
                value={boxHeight}
                onChange={(e) => setBoxHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.toggleRow}>
            <button
              type="button"
              className={clsx(styles.toggleBtn, linked && styles.toggleActive)}
              onClick={() => setLinked((prev) => !prev)}
            >
              {linked ? <Link2 size={13} /> : <Link2Off size={13} />}
              {linked ? "Corners linked" : "Corners independent"}
            </button>

            <button
              type="button"
              className={clsx(styles.toggleBtn, elliptical && styles.toggleActive)}
              onClick={() => setElliptical((prev) => !prev)}
            >
              Elliptical
            </button>

            <div className={styles.unitGroup}>
              {(["px", "%"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={clsx(styles.unitBtn, unit === u && styles.unitActive)}
                  onClick={() => setUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.corners}>
            {CORNER_ORDER.map((key) => (
              <div className={styles.corner} key={key}>
                <span className={styles.cornerTitle}>{CORNER_LABEL[key]}</span>

                <div className={styles.field}>
                  <label>
                    Horizontal{" "}
                    <span className={styles.fieldValue}>
                      {corners[key].h}
                      {unit}
                    </span>
                  </label>
                  <div className={styles.sliderRow}>
                    <input
                      type="range"
                      min={0}
                      max={maxVal}
                      value={corners[key].h}
                      onChange={(e) =>
                        updateCorner(key, { h: Number(e.target.value) })
                      }
                    />
                    <input
                      type="number"
                      className={styles.numberInput}
                      min={0}
                      max={maxVal}
                      value={corners[key].h}
                      onChange={(e) =>
                        updateCorner(key, { h: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                {elliptical && (
                  <div className={styles.field}>
                    <label>
                      Vertical{" "}
                      <span className={styles.fieldValue}>
                        {corners[key].v}
                        {unit}
                      </span>
                    </label>
                    <div className={styles.sliderRow}>
                      <input
                        type="range"
                        min={0}
                        max={maxVal}
                        value={corners[key].v}
                        onChange={(e) =>
                          updateCorner(key, { v: Number(e.target.value) })
                        }
                      />
                      <input
                        type="number"
                        className={styles.numberInput}
                        min={0}
                        max={maxVal}
                        value={corners[key].v}
                        onChange={(e) =>
                          updateCorner(key, { v: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                )}
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

export default BorderRadius;
