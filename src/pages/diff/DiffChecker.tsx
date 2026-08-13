import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import { computeDiff, type DiffOptions } from "./diffEngine";
import styles from "./DiffChecker.module.css";

const SAMPLE_ORIGINAL = `function greet(name) {
  console.log("Hello " + name);
  return true;
}

const user = "Ada";
greet(user);`;

const SAMPLE_CHANGED = `function greet(name, punctuation) {
  console.log(\`Hello \${name}\${punctuation}\`);
  return true;
}

const user = "Ada";
greet(user, "!");`;

export function DiffChecker() {
  const ready = useRevealReady();
  const [original, setOriginal] = useState(SAMPLE_ORIGINAL);
  const [changed, setChanged] = useState(SAMPLE_CHANGED);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);

  const options: DiffOptions = useMemo(
    () => ({ ignoreWhitespace, ignoreCase }),
    [ignoreWhitespace, ignoreCase]
  );

  const { rows, summary } = useMemo(
    () => computeDiff(original, changed, options),
    [original, changed, options]
  );

  return (
    <Frame wide>
      <SectionHeading title="Diff Checker" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.inputs} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="original">Original</label>
            <textarea
              id="original"
              className={styles.textarea}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              spellCheck={false}
              rows={12}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="changed">Changed</label>
            <textarea
              id="changed"
              className={styles.textarea}
              value={changed}
              onChange={(e) => setChanged(e.target.value)}
              spellCheck={false}
              rows={12}
            />
          </div>
        </motion.div>

        <motion.div className={styles.toolbar} variants={revealItem}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            Ignore whitespace
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            Ignore case
          </label>

          <div className={styles.summary}>
            <span className={styles.additions}>
              <Plus size={13} />
              {summary.additions}
            </span>
            <span className={styles.deletions}>
              <Minus size={13} />
              {summary.deletions}
            </span>
          </div>
        </motion.div>

        <motion.div className={styles.outputBlock} variants={revealItem}>
          <div className={styles.diffPanel}>
            {rows.length === 0 ? (
              <div className={styles.empty}>No content to compare.</div>
            ) : (
              rows.map((row, idx) => (
                <div
                  key={idx}
                  className={
                    row.type === "added"
                      ? styles.rowAdded
                      : row.type === "removed"
                        ? styles.rowRemoved
                        : styles.rowUnchanged
                  }
                >
                  <span className={styles.lineNo}>{row.leftNo ?? ""}</span>
                  <span className={styles.lineNo}>{row.rightNo ?? ""}</span>
                  <span className={styles.gutter}>
                    {row.type === "added" ? "+" : row.type === "removed" ? "−" : " "}
                  </span>
                  <span className={styles.lineText}>{row.text.length === 0 ? " " : row.text}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default DiffChecker;
