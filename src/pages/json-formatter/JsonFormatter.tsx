import { useMemo, useState } from "react";
import { Check, X, Copy, AlignLeft, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./JsonFormatter.module.css";

const SAMPLE = `{
  "name": "toolbox",
  "version": 1,
  "active": true,
  "tags": ["json", "formatter", "validator"],
  "meta": {
    "created": "2026-08-13",
    "author": null
  }
}`;

type IndentOption = "2" | "4" | "tab";

interface JsonStats {
  keys: number;
  depth: number;
  arrayLength: number | null;
}

function computeStats(value: unknown): JsonStats {
  let keys = 0;
  let maxDepth = 0;
  let topArrayLength: number | null = Array.isArray(value) ? value.length : null;

  function walk(node: unknown, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (node !== null && typeof node === "object") {
      const entries = Array.isArray(node) ? node : Object.values(node);
      if (!Array.isArray(node)) {
        keys += Object.keys(node).length;
      }
      for (const child of entries) {
        walk(child, depth + 1);
      }
    }
  }

  walk(value, 0);
  return { keys, depth: maxDepth, arrayLength: topArrayLength };
}

function indentValue(option: IndentOption): string | number {
  if (option === "tab") return "\t";
  return option === "4" ? 4 : 2;
}

export function JsonFormatter() {
  const ready = useRevealReady();
  const [input, setInput] = useState<string>(SAMPLE);
  const [output, setOutput] = useState<string>(SAMPLE);
  const [indent, setIndent] = useState<IndentOption>("2");
  const [copied, setCopied] = useState(false);

  const validation = useMemo<{ valid: boolean; error: string | null; parsed: unknown }>(() => {
    if (input.trim() === "") {
      return { valid: false, error: null, parsed: undefined };
    }
    try {
      const parsed = JSON.parse(input);
      return { valid: true, error: null, parsed };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      return { valid: false, error: message, parsed: undefined };
    }
  }, [input]);

  const stats = useMemo<JsonStats | null>(() => {
    if (!validation.valid) return null;
    return computeStats(validation.parsed);
  }, [validation]);

  function format() {
    if (!validation.valid) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indentValue(indent)));
    } catch {
      // guarded by validation.valid, but stay safe
    }
  }

  function minify() {
    if (!validation.valid) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch {
      // guarded by validation.valid, but stay safe
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isEmpty = input.trim() === "";

  return (
    <Frame wide>
      <SectionHeading title="JSON Formatter" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Input</span>
            {!isEmpty && (
              <span
                className={clsx(
                  styles.badge,
                  validation.valid ? styles.badgeValid : styles.badgeInvalid
                )}
              >
                {validation.valid ? <Check size={13} /> : <X size={13} />}
                {validation.valid ? "VALID" : "INVALID"}
              </span>
            )}
          </div>

          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste JSON here..."
          />

          {!validation.valid && !isEmpty && validation.error && (
            <div className={styles.errorMsg}>{validation.error}</div>
          )}

          <div className={styles.toolbar}>
            <div className={styles.field}>
              <label htmlFor="indent">Indent</label>
              <select
                id="indent"
                className={styles.select}
                value={indent}
                onChange={(e) => setIndent(e.target.value as IndentOption)}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            </div>

            <button
              type="button"
              className={styles.actionBtn}
              onClick={format}
              disabled={!validation.valid}
            >
              <AlignLeft size={13} />
              Format / Beautify
            </button>

            <button
              type="button"
              className={styles.actionBtn}
              onClick={minify}
              disabled={!validation.valid}
            >
              <Minimize2 size={13} />
              Minify
            </button>
          </div>
        </motion.div>

        <motion.div className={styles.panel} variants={revealItem}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Output</span>
            <button
              type="button"
              className={clsx(styles.copyBtn, copied && styles.copied)}
              onClick={copy}
              disabled={!output}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className={styles.pre}>{output || " "}</pre>

          <div className={styles.statsRow}>
            {stats ? (
              <>
                <span className={styles.statItem}>
                  Keys <span className={styles.statValue}>{stats.keys}</span>
                </span>
                <span className={styles.statItem}>
                  Depth <span className={styles.statValue}>{stats.depth}</span>
                </span>
                {stats.arrayLength !== null && (
                  <span className={styles.statItem}>
                    Array length <span className={styles.statValue}>{stats.arrayLength}</span>
                  </span>
                )}
              </>
            ) : (
              <span className={styles.statItem}>
                Size <span className={styles.statValue}>{output.length} chars</span>
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default JsonFormatter;
