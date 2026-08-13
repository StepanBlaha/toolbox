import { useMemo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Lorem.module.css";

type Unit = "paragraphs" | "sentences" | "words" | "list";

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "paragraphs", label: "Paragraphs" },
  { value: "sentences", label: "Sentences" },
  { value: "words", label: "Words" },
  { value: "list", label: "List items" },
];

const WORD_POOL = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis",
  "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex",
  "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur",
  "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt",
  "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est",
  "laborum", "at", "vero", "eos", "accusamus",
];

const LOREM_START = ["lorem", "ipsum", "dolor", "sit", "amet"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWord(): string {
  return WORD_POOL[randInt(0, WORD_POOL.length - 1)];
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildWords(count: number, startWithClassic: boolean): string[] {
  const words: string[] = [];
  if (startWithClassic) {
    words.push(...LOREM_START.slice(0, Math.min(count, LOREM_START.length)));
  }
  while (words.length < count) {
    words.push(pickWord());
  }
  return words.slice(0, count);
}

function buildSentence(startWithClassic: boolean): string {
  const len = randInt(6, 14);
  const words = buildWords(len, startWithClassic);
  const text = words.join(" ") + ".";
  return capitalize(text);
}

function buildParagraph(startWithClassic: boolean): string {
  const count = randInt(3, 6);
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(buildSentence(startWithClassic && i === 0));
  }
  return sentences.join(" ");
}

function buildListItem(startWithClassic: boolean): string {
  const len = randInt(2, 6);
  const words = buildWords(len, startWithClassic);
  return capitalize(words.join(" "));
}

function generate(unit: Unit, count: number, startWithClassic: boolean): string[] {
  const items: string[] = [];
  for (let i = 0; i < count; i++) {
    const useClassicStart = startWithClassic && i === 0;
    switch (unit) {
      case "paragraphs":
        items.push(buildParagraph(useClassicStart));
        break;
      case "sentences":
        items.push(buildSentence(useClassicStart));
        break;
      case "words":
        items.push(buildWords(1, useClassicStart)[0]);
        break;
      case "list":
        items.push(buildListItem(useClassicStart));
        break;
    }
  }
  return items;
}

function joinForCopy(unit: Unit, items: string[]): string {
  if (unit === "list") {
    return items.map((item) => `- ${item}`).join("\n");
  }
  if (unit === "words") {
    return items.join(" ");
  }
  return items.join("\n\n");
}

export default function Lorem() {
  const ready = useRevealReady();
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState<number>(3);
  const [startWithClassic, setStartWithClassic] = useState<boolean>(true);
  const [items, setItems] = useState<string[]>(() => generate("paragraphs", 3, true));
  const [copied, setCopied] = useState(false);

  const outputText = useMemo(() => joinForCopy(unit, items), [unit, items]);

  const stats = useMemo(() => {
    const words = outputText.trim().length ? outputText.trim().split(/\s+/).length : 0;
    const chars = outputText.length;
    return { words, chars };
  }, [outputText]);

  function regenerate(nextUnit: Unit = unit, nextCount: number = count, nextStart: boolean = startWithClassic) {
    setItems(generate(nextUnit, nextCount, nextStart));
  }

  function handleUnitChange(next: Unit) {
    setUnit(next);
    regenerate(next, count, startWithClassic);
  }

  function handleCountChange(next: number) {
    const clamped = Math.min(50, Math.max(1, next));
    setCount(clamped);
    regenerate(unit, clamped, startWithClassic);
  }

  function handleStartChange(next: boolean) {
    setStartWithClassic(next);
    regenerate(unit, count, next);
  }

  async function copy() {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Lorem Ipsum" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label>Unit</label>
            <div className={styles.chips}>
              {UNIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(styles.chip, unit === opt.value && styles.chipActive)}
                  onClick={() => handleUnitChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="count">Count</label>
              <input
                id="count"
                type="number"
                min={1}
                max={50}
                className={styles.numberInput}
                value={count}
                onChange={(e) => handleCountChange(Number(e.target.value))}
              />
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={startWithClassic}
                onChange={(e) => handleStartChange(e.target.checked)}
              />
              Start with &ldquo;Lorem ipsum dolor sit amet&hellip;&rdquo;
            </label>
          </div>

          <button
            type="button"
            className={styles.regenBtn}
            onClick={() => regenerate()}
          >
            <RefreshCw size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Regenerate
          </button>
        </motion.div>

        <motion.div className={styles.outputPanel} variants={revealItem}>
          <div className={styles.outputHead}>
            <span className={styles.outputLabel}>
              {stats.words} words &middot; {stats.chars} chars
            </span>
            <button
              type="button"
              className={clsx(styles.copyBtn, copied && styles.copied)}
              onClick={copy}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {unit === "list" ? (
            <ul className={styles.list}>
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <pre className={styles.pre}>{outputText}</pre>
          )}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export { Lorem };
