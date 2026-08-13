import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./UnitConverter.module.css";

type Unit = "px" | "rem" | "em" | "pt" | "%";

const UNITS: Unit[] = ["px", "rem", "em", "pt", "%"];

const PX_PER_PT = 1.3333;

function round(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const fixed = Math.round(n * 10000) / 10000;
  return fixed;
}

function formatNumber(n: number): string {
  const rounded = round(n);
  // trim trailing zeros, but never end with a bare "."
  let str = rounded.toFixed(4);
  str = str.replace(/0+$/, "");
  str = str.replace(/\.$/, "");
  if (str === "-0") str = "0";
  return str;
}

function toPx(value: number, unit: Unit, root: number, parent: number, base: number): number {
  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * root;
    case "em":
      return value * parent;
    case "pt":
      return value * PX_PER_PT;
    case "%":
      return (value / 100) * base;
  }
}

function fromPx(px: number, unit: Unit, root: number, parent: number, base: number): number {
  switch (unit) {
    case "px":
      return px;
    case "rem":
      return root === 0 ? 0 : px / root;
    case "em":
      return parent === 0 ? 0 : px / parent;
    case "pt":
      return px / PX_PER_PT;
    case "%":
      return base === 0 ? 0 : (px / base) * 100;
  }
}

const UNIT_LABELS: Record<Unit, string> = {
  px: "Pixels",
  rem: "Root em",
  em: "Em",
  pt: "Points",
  "%": "Percent",
};

export default function UnitConverter() {
  const ready = useRevealReady();

  const [value, setValue] = useState<string>("16");
  const [fromUnit, setFromUnit] = useState<Unit>("px");

  const [root, setRoot] = useState<string>("16");
  const [parent, setParent] = useState<string>("16");
  const [base, setBase] = useState<string>("16");

  const [copiedUnit, setCopiedUnit] = useState<Unit | null>(null);

  const numericValue = Number(value) || 0;
  const numericRoot = Number(root) || 0;
  const numericParent = Number(parent) || 0;
  const numericBase = Number(base) || 0;

  const px = useMemo(
    () => toPx(numericValue, fromUnit, numericRoot, numericParent, numericBase),
    [numericValue, fromUnit, numericRoot, numericParent, numericBase]
  );

  const results = useMemo(
    () =>
      UNITS.map((unit) => ({
        unit,
        value: fromPx(px, unit, numericRoot, numericParent, numericBase),
      })),
    [px, numericRoot, numericParent, numericBase]
  );

  async function copyResult(unit: Unit, val: number) {
    const text = `${formatNumber(val)}${unit}`;
    await navigator.clipboard.writeText(text);
    setCopiedUnit(unit);
    setTimeout(() => setCopiedUnit((cur) => (cur === unit ? null : cur)), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Unit Converter" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.inputPanel} variants={revealItem}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="value">Value</label>
              <input
                id="value"
                type="number"
                className={styles.textInput}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="fromUnit">From unit</label>
              <select
                id="fromUnit"
                className={styles.select}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as Unit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.configHead}>Assumptions</div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="root">
                Root font-size <span className={styles.fieldHint}>(rem)</span>
              </label>
              <input
                id="root"
                type="number"
                className={styles.textInput}
                value={root}
                onChange={(e) => setRoot(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="parent">
                Parent font-size <span className={styles.fieldHint}>(em)</span>
              </label>
              <input
                id="parent"
                type="number"
                className={styles.textInput}
                value={parent}
                onChange={(e) => setParent(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="base">
                Base size <span className={styles.fieldHint}>(%)</span>
              </label>
              <input
                id="base"
                type="number"
                className={styles.textInput}
                value={base}
                onChange={(e) => setBase(e.target.value)}
              />
            </div>
          </div>

          <p className={styles.note}>
            rem is relative to the root font-size, em to the parent font-size, and % to
            the base size above. pt uses 1pt = 1.3333px. All values are computed via px
            as the common pivot.
          </p>
        </motion.div>

        <motion.div className={styles.resultsPanel} variants={revealItem}>
          <div className={styles.results}>
            {results.map(({ unit, value: val }) => {
              const text = `${formatNumber(val)}${unit}`;
              const isCopied = copiedUnit === unit;
              return (
                <div
                  key={unit}
                  className={clsx(styles.resultRow, unit === fromUnit && styles.resultRowActive)}
                >
                  <div className={styles.resultInfo}>
                    <span className={styles.resultUnit}>{UNIT_LABELS[unit]}</span>
                    <span className={styles.resultValue}>{text}</span>
                  </div>
                  <button
                    type="button"
                    className={clsx(styles.copyBtn, isCopied && styles.copied)}
                    onClick={() => copyResult(unit, val)}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export { UnitConverter };
