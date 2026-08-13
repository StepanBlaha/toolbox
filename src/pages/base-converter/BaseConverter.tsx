import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./BaseConverter.module.css";

type FixedField = "bin" | "oct" | "dec" | "hex";
type FieldId = FixedField | "arb";

interface FixedTexts {
  bin: string;
  oct: string;
  dec: string;
  hex: string;
}

const BASES: Record<FixedField, number> = {
  bin: 2,
  oct: 8,
  dec: 10,
  hex: 16,
};

const LABELS: Record<FixedField, string> = {
  bin: "Binary",
  oct: "Octal",
  dec: "Decimal",
  hex: "Hexadecimal",
};

const EMPTY_TEXTS: FixedTexts = { bin: "", oct: "", dec: "", hex: "" };
const EMPTY_ERRORS: Record<FieldId, boolean> = {
  bin: false,
  oct: false,
  dec: false,
  hex: false,
  arb: false,
};

function digitValue(ch: string): number {
  const c = ch.toLowerCase();
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  if (c >= "a" && c <= "z") return c.charCodeAt(0) - 97 + 10;
  return -1;
}

/** Parses `raw` as an integer in `base` (2-36) using BigInt for full precision. */
function parseInBase(raw: string, base: number): bigint | null {
  let s = raw.trim();
  if (!s) return null;
  let neg = false;
  if (s[0] === "-") {
    neg = true;
    s = s.slice(1);
  } else if (s[0] === "+") {
    s = s.slice(1);
  }
  if (!s) return null;

  const bigBase = BigInt(base);
  let result = 0n;
  for (const ch of s) {
    const d = digitValue(ch);
    if (d === -1 || d >= base) return null;
    result = result * bigBase + BigInt(d);
  }
  return neg ? -result : result;
}

function formatBase(value: bigint, base: number): string {
  const s = value.toString(base);
  return base === 16 ? s.toUpperCase() : s;
}

/** Groups digits from the right for readability, e.g. nibbles for binary. */
function groupDigits(s: string, size: number): string {
  const neg = s.startsWith("-");
  const digits = neg ? s.slice(1) : s;
  if (!digits) return s;
  const groups: string[] = [];
  for (let i = digits.length; i > 0; i -= size) {
    groups.unshift(digits.slice(Math.max(0, i - size), i));
  }
  return (neg ? "-" : "") + groups.join(" ");
}

export default function BaseConverter() {
  const ready = useRevealReady();
  const [value, setValue] = useState<bigint | null>(null);
  const [texts, setTexts] = useState<FixedTexts>(EMPTY_TEXTS);
  const [errors, setErrors] = useState<Record<FieldId, boolean>>(EMPTY_ERRORS);
  const [arbBase, setArbBase] = useState(36);
  const [arbText, setArbText] = useState("");
  const [copiedField, setCopiedField] = useState<FieldId | null>(null);

  function clearAll() {
    setValue(null);
    setTexts(EMPTY_TEXTS);
    setArbText("");
    setErrors(EMPTY_ERRORS);
  }

  function handleFixedChange(field: FixedField, raw: string) {
    setTexts((prev) => ({ ...prev, [field]: raw }));

    if (raw.trim() === "") {
      clearAll();
      return;
    }

    const parsed = parseInBase(raw, BASES[field]);
    if (parsed === null) {
      setErrors((prev) => ({ ...prev, [field]: true }));
      return;
    }

    setValue(parsed);
    setErrors(EMPTY_ERRORS);
    setTexts({
      bin: field === "bin" ? raw : formatBase(parsed, 2),
      oct: field === "oct" ? raw : formatBase(parsed, 8),
      dec: field === "dec" ? raw : formatBase(parsed, 10),
      hex: field === "hex" ? raw : formatBase(parsed, 16),
    });
    setArbText(formatBase(parsed, arbBase));
  }

  function handleArbChange(raw: string) {
    setArbText(raw);

    if (raw.trim() === "") {
      clearAll();
      return;
    }

    const parsed = parseInBase(raw, arbBase);
    if (parsed === null) {
      setErrors((prev) => ({ ...prev, arb: true }));
      return;
    }

    setValue(parsed);
    setErrors(EMPTY_ERRORS);
    setTexts({
      bin: formatBase(parsed, 2),
      oct: formatBase(parsed, 8),
      dec: formatBase(parsed, 10),
      hex: formatBase(parsed, 16),
    });
  }

  function handleArbBaseChange(nextBase: number) {
    setArbBase(nextBase);
    if (value !== null) {
      setErrors((prev) => ({ ...prev, arb: false }));
      setArbText(formatBase(value, nextBase));
      return;
    }
    if (arbText.trim() === "") {
      setErrors((prev) => ({ ...prev, arb: false }));
      return;
    }
    const parsed = parseInBase(arbText, nextBase);
    setErrors((prev) => ({ ...prev, arb: parsed === null }));
  }

  async function copy(field: FieldId, text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1500);
  }

  function renderRow(
    field: FixedField,
    text: string,
    hint?: string
  ) {
    const hasError = errors[field];
    return (
      <motion.div className={styles.row} variants={revealItem} key={field}>
        <div className={styles.rowHead}>
          <label htmlFor={field} className={styles.label}>
            {LABELS[field]}{" "}
            <span className={styles.baseTag}>base {BASES[field]}</span>
          </label>
          {hasError && <span className={styles.errorText}>Invalid digit for this base</span>}
        </div>
        <div className={styles.inputRow}>
          <input
            id={field}
            type="text"
            inputMode="text"
            spellCheck={false}
            autoComplete="off"
            className={clsx(styles.input, hasError && styles.inputError)}
            value={text}
            placeholder="0"
            onChange={(e) => handleFixedChange(field, e.target.value)}
          />
          <button
            type="button"
            className={clsx(styles.copyBtn, copiedField === field && styles.copied)}
            onClick={() => copy(field, text)}
            disabled={!text || hasError}
          >
            {copiedField === field ? <Check size={13} /> : <Copy size={13} />}
            {copiedField === field ? "Copied" : "Copy"}
          </button>
        </div>
        {hint && !hasError && text && (
          <div className={styles.hint}>{hint}</div>
        )}
      </motion.div>
    );
  }

  const arbHasError = errors.arb;

  return (
    <Frame wide>
      <SectionHeading title="Base Converter" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        {renderRow("bin", texts.bin, groupDigits(texts.bin, 4))}
        {renderRow("oct", texts.oct)}
        {renderRow("dec", texts.dec)}
        {renderRow("hex", texts.hex, groupDigits(texts.hex, 4))}

        <motion.div className={styles.row} variants={revealItem}>
          <div className={styles.rowHead}>
            <label htmlFor="arb" className={styles.label}>
              Arbitrary base
            </label>
            {arbHasError && (
              <span className={styles.errorText}>Invalid digit for this base</span>
            )}
          </div>
          <div className={styles.inputRow}>
            <select
              className={styles.baseSelect}
              value={arbBase}
              onChange={(e) => handleArbBaseChange(Number(e.target.value))}
              aria-label="Arbitrary base value"
            >
              {Array.from({ length: 35 }, (_, i) => i + 2).map((b) => (
                <option key={b} value={b}>
                  base {b}
                </option>
              ))}
            </select>
            <input
              id="arb"
              type="text"
              inputMode="text"
              spellCheck={false}
              autoComplete="off"
              className={clsx(styles.input, arbHasError && styles.inputError)}
              value={arbText}
              placeholder="0"
              onChange={(e) => handleArbChange(e.target.value)}
            />
            <button
              type="button"
              className={clsx(styles.copyBtn, copiedField === "arb" && styles.copied)}
              onClick={() => copy("arb", arbText)}
              disabled={!arbText || arbHasError}
            >
              {copiedField === "arb" ? <Check size={13} /> : <Copy size={13} />}
              {copiedField === "arb" ? "Copied" : "Copy"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export { BaseConverter };
