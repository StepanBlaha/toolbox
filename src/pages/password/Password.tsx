import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Password.module.css";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = new Set(["0", "O", "1", "l", "I"]);

type Strength = {
  label: string;
  color: string;
};

function stripAmbiguous(chars: string): string {
  return chars
    .split("")
    .filter((c) => !AMBIGUOUS.has(c))
    .join("");
}

function randomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Reject values that would bias the modulo result.
  const limit = Math.floor(0xffffffff / max) * max;
  let value = array[0];
  while (value >= limit) {
    crypto.getRandomValues(array);
    value = array[0];
  }
  return value % max;
}

function generatePassword(
  length: number,
  charset: string
): string {
  if (!charset) return "";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomInt(charset.length)];
  }
  return result;
}

function getStrength(bits: number): Strength {
  if (bits < 50) return { label: "Weak", color: "#ef4444" };
  if (bits < 75) return { label: "Fair", color: "#f59e0b" };
  if (bits < 110) return { label: "Strong", color: "#22c55e" };
  return { label: "Very strong", color: "#22c55e" };
}

export function Password() {
  const ready = useRevealReady();
  const [length, setLength] = useState(20);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const charset = useMemo(() => {
    let chars = "";
    if (useLower) chars += LOWER;
    if (useUpper) chars += UPPER;
    if (useNumbers) chars += NUMBERS;
    if (useSymbols) chars += SYMBOLS;
    if (excludeAmbiguous) chars = stripAmbiguous(chars);
    return chars;
  }, [useLower, useUpper, useNumbers, useSymbols, excludeAmbiguous]);

  const regenerate = useCallback(() => {
    if (!charset) {
      setPassword("");
      return;
    }
    setPassword(generatePassword(length, charset));
  }, [length, charset]);

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, charset]);

  const entropy = useMemo(() => {
    if (!charset.length || !password.length) return 0;
    return password.length * Math.log2(charset.length);
  }, [charset, password]);

  const strength = getStrength(entropy);
  const strengthPercent = Math.min(100, (entropy / 130) * 100);

  function toggleClass(
    setter: (v: boolean) => void,
    current: boolean,
    othersActive: boolean
  ) {
    // At least one character class must stay enabled.
    if (current && !othersActive) return;
    setter(!current);
  }

  const activeClassCount = [useLower, useUpper, useNumbers, useSymbols].filter(
    Boolean
  ).length;

  async function copy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Password Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.outputBlock} variants={revealItem}>
          <div className={styles.outputHead}>
            <span className={styles.outputLabel}>Password</span>
            <div className={styles.outputActions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Regenerate password"
                onClick={regenerate}
              >
                <RefreshCw size={13} />
              </button>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copy}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className={styles.passwordDisplay}>
            {password || "Select at least one character type"}
          </div>

          <div className={styles.strength}>
            <div className={styles.strengthHead}>
              <span
                className={styles.strengthLabel}
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
              <span className={styles.strengthBits}>
                {entropy.toFixed(1)} bits
              </span>
            </div>
            <div className={styles.strengthTrack}>
              <div
                className={styles.strengthFill}
                style={{
                  width: `${strengthPercent}%`,
                  background: strength.color,
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="length">
              Length <span className={styles.fieldValue}>{length}</span>
            </label>
            <input
              id="length"
              type="range"
              min={6}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </div>

          <div className={styles.checkboxGrid}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={useLower}
                onChange={() =>
                  toggleClass(setUseLower, useLower, activeClassCount - (useLower ? 1 : 0) > 0)
                }
              />
              Lowercase (a-z)
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={useUpper}
                onChange={() =>
                  toggleClass(setUseUpper, useUpper, activeClassCount - (useUpper ? 1 : 0) > 0)
                }
              />
              Uppercase (A-Z)
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={() =>
                  toggleClass(setUseNumbers, useNumbers, activeClassCount - (useNumbers ? 1 : 0) > 0)
                }
              />
              Numbers (0-9)
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={() =>
                  toggleClass(setUseSymbols, useSymbols, activeClassCount - (useSymbols ? 1 : 0) > 0)
                }
              />
              Symbols (!@#$...)
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              />
              Exclude ambiguous (0/O/1/l/I)
            </label>
          </div>

          <button type="button" className={styles.regenBtn} onClick={regenerate}>
            <RefreshCw size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Regenerate
          </button>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Password;
