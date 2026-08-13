import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./CaseConverter.module.css";

const SAMPLE = "the quick brown fox";

/**
 * Splits arbitrary text into lowercase word tokens, handling:
 * - spaces, hyphens, underscores, dots as explicit separators
 * - camelCase / PascalCase boundaries (lower->upper, and acronym->Word)
 * - digits as their own boundary-aware chunks
 */
function tokenize(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Normalize explicit separators (space, hyphen, underscore, dot, slash) to a single space.
  const separated = trimmed.replace(/[\s_\-.\/]+/g, " ");

  // Insert a space at camelCase / PascalCase / acronym boundaries.
  const withBoundaries = separated
    // lower/digit followed by upper: "fooBar" -> "foo Bar"
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    // acronym followed by capitalized word: "HTTPServer" -> "HTTP Server"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    // letter/digit boundaries: "fox2" / "2fox" -> "fox 2" / "2 fox"
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2");

  return withBoundaries
    .split(" ")
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function capitalize(word: string): string {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function toCamelCase(words: string[]): string {
  return words
    .map((w, i) => (i === 0 ? w : capitalize(w)))
    .join("");
}

function toPascalCase(words: string[]): string {
  return words.map(capitalize).join("");
}

function toSnakeCase(words: string[]): string {
  return words.join("_");
}

function toConstantCase(words: string[]): string {
  return words.join("_").toUpperCase();
}

function toKebabCase(words: string[]): string {
  return words.join("-");
}

function toTrainCase(words: string[]): string {
  return words.map(capitalize).join("-");
}

function toDotCase(words: string[]): string {
  return words.join(".");
}

function toSentenceCase(words: string[]): string {
  const joined = words.join(" ");
  return capitalize(joined);
}

function toTitleCase(words: string[]): string {
  return words.map(capitalize).join(" ");
}

function toUppercase(words: string[]): string {
  return words.join(" ").toUpperCase();
}

function toLowercase(words: string[]): string {
  return words.join(" ").toLowerCase();
}

interface CaseDef {
  label: string;
  value: string;
}

function OutputRow({ label, value }: CaseDef) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div className={styles.row} variants={revealItem}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value || "—"}</span>
      <button
        type="button"
        className={clsx(styles.copyBtn, copied && styles.copied)}
        onClick={copy}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </motion.div>
  );
}

function CaseConverter() {
  const ready = useRevealReady();
  const [text, setText] = useState<string>(SAMPLE);

  const words = useMemo(() => tokenize(text), [text]);

  const cases: CaseDef[] = useMemo(
    () => [
      { label: "camelCase", value: toCamelCase(words) },
      { label: "PascalCase", value: toPascalCase(words) },
      { label: "snake_case", value: toSnakeCase(words) },
      { label: "CONSTANT_CASE", value: toConstantCase(words) },
      { label: "kebab-case", value: toKebabCase(words) },
      { label: "Train-Case", value: toTrainCase(words) },
      { label: "dot.case", value: toDotCase(words) },
      { label: "Sentence case", value: toSentenceCase(words) },
      { label: "Title Case", value: toTitleCase(words) },
      { label: "UPPERCASE", value: toUppercase(words) },
      { label: "lowercase", value: toLowercase(words) },
    ],
    [words]
  );

  return (
    <Frame wide>
      <SectionHeading title="Case Converter" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.inputPanel} variants={revealItem}>
          <label htmlFor="case-input" className={styles.inputLabel}>
            Input text
          </label>
          <textarea
            id="case-input"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={8}
          />
        </motion.div>

        <div className={styles.outputPanel}>
          {cases.map((c) => (
            <OutputRow key={c.label} label={c.label} value={c.value} />
          ))}
        </div>
      </motion.div>
    </Frame>
  );
}

export default CaseConverter;
export { CaseConverter };
