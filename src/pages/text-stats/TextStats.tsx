import { useMemo, useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./TextStats.module.css";

const SAMPLE_TEXT = `The old lighthouse stood at the edge of the cliff, its paint peeling after decades of salt wind. Every evening, the keeper climbed the spiral stairs to light the lamp, watching the sea change color as the sun dropped below the horizon.

Ships passing in the dark relied on that steady beam. They never saw the keeper, only the light, but the light was nothing without someone willing to climb the stairs each night.`;

interface Stats {
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  avgWordsPerSentence: number;
  readingMinutes: number;
  speakingMinutes: number;
}

interface Readability {
  fleschScore: number;
  fleschLabel: string;
  gradeLevel: number;
}

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;

  let processed = clean;
  if (processed.endsWith("e") && !processed.endsWith("le") && processed.length > 2) {
    processed = processed.slice(0, -1);
  }

  const groups = processed.match(/[aeiouy]+/g);
  const count = groups ? groups.length : 0;
  return Math.max(1, count);
}

function computeStats(text: string): Stats {
  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, "").length;

  const wordList = text.trim().length ? text.trim().split(/\s+/) : [];
  const words = wordList.length;

  const sentenceMatches = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  const sentences = text.trim().length
    ? (sentenceMatches ?? []).filter((s) => s.trim().length > 0).length || 1
    : 0;

  const paragraphs = text.trim().length
    ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : 0;

  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  const readingMinutes = words / 200;
  const speakingMinutes = words / 130;

  return {
    charsWithSpaces,
    charsWithoutSpaces,
    words,
    sentences,
    paragraphs,
    avgWordsPerSentence,
    readingMinutes,
    speakingMinutes,
  };
}

function computeReadability(text: string, stats: Stats): Readability {
  const wordList = text.trim().length ? text.trim().split(/\s+/) : [];
  const totalSyllables = wordList.reduce((sum, w) => sum + countSyllables(w), 0);

  const words = stats.words || 1;
  const sentences = stats.sentences || 1;

  const fleschScore =
    206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words);
  const gradeLevel =
    0.39 * (words / sentences) + 11.8 * (totalSyllables / words) - 15.59;

  let fleschLabel = "Very difficult";
  if (fleschScore >= 90) fleschLabel = "Very easy";
  else if (fleschScore >= 70) fleschLabel = "Easy";
  else if (fleschScore >= 50) fleschLabel = "Standard";
  else if (fleschScore >= 30) fleschLabel = "Difficult";

  return {
    fleschScore: stats.words > 0 ? fleschScore : 0,
    fleschLabel: stats.words > 0 ? fleschLabel : "—",
    gradeLevel: stats.words > 0 ? gradeLevel : 0,
  };
}

function formatMinutes(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.max(1, Math.round(minutes * 60));
    return `${seconds}s`;
  }
  return `${minutes.toFixed(1)}m`;
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <motion.div className={styles.tile} variants={revealItem}>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
    </motion.div>
  );
}

export function TextStats() {
  const ready = useRevealReady();
  const [text, setText] = useState(SAMPLE_TEXT);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => computeStats(text), [text]);
  const readability = useMemo(() => computeReadability(text, stats), [text, stats]);

  async function copySummary() {
    const summary = [
      `Characters: ${stats.charsWithSpaces} (${stats.charsWithoutSpaces} without spaces)`,
      `Words: ${stats.words}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Avg words/sentence: ${stats.avgWordsPerSentence.toFixed(1)}`,
      `Reading time: ${formatMinutes(stats.readingMinutes)}`,
      `Speaking time: ${formatMinutes(stats.speakingMinutes)}`,
      `Flesch Reading Ease: ${readability.fleschScore.toFixed(1)} (${readability.fleschLabel})`,
      `Flesch-Kincaid Grade Level: ${readability.gradeLevel.toFixed(1)}`,
    ].join("\n");
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Text Stats" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.editorPanel} variants={revealItem}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here..."
            spellCheck={false}
          />
        </motion.div>

        <div className={styles.results}>
          <motion.div className={styles.grid} variants={revealItem}>
            <StatTile value={String(stats.charsWithSpaces)} label="Characters" />
            <StatTile value={String(stats.charsWithoutSpaces)} label="Chars (no spaces)" />
            <StatTile value={String(stats.words)} label="Words" />
            <StatTile value={String(stats.sentences)} label="Sentences" />
            <StatTile value={String(stats.paragraphs)} label="Paragraphs" />
            <StatTile
              value={stats.avgWordsPerSentence.toFixed(1)}
              label="Avg words / sentence"
            />
            <StatTile value={formatMinutes(stats.readingMinutes)} label="Reading time" />
            <StatTile value={formatMinutes(stats.speakingMinutes)} label="Speaking time" />
          </motion.div>

          <motion.div className={styles.readabilityBlock} variants={revealItem}>
            <div className={styles.readabilityHead}>
              <span className={styles.readabilityTitle}>Readability</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copied && styles.copied)}
                onClick={copySummary}
              >
                {copied ? <Check size={13} /> : <ClipboardList size={13} />}
                {copied ? "Copied" : "Copy stats"}
              </button>
            </div>

            <div className={styles.readabilityGrid}>
              <div className={styles.readabilityRow}>
                <span className={styles.readabilityLabel}>Flesch Reading Ease</span>
                <span className={styles.readabilityValue}>
                  {readability.fleschScore.toFixed(1)}
                  <span className={styles.readabilityTag}>{readability.fleschLabel}</span>
                </span>
              </div>
              <div className={styles.readabilityRow}>
                <span className={styles.readabilityLabel}>Flesch-Kincaid Grade Level</span>
                <span className={styles.readabilityValue}>
                  {readability.gradeLevel.toFixed(1)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Frame>
  );
}

export default TextStats;
