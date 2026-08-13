import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Regex.module.css";

interface FlagOption {
  key: string;
  label: string;
  hint: string;
}

const FLAG_OPTIONS: FlagOption[] = [
  { key: "g", label: "g", hint: "global" },
  { key: "i", label: "i", hint: "ignore case" },
  { key: "m", label: "m", hint: "multiline" },
  { key: "s", label: "s", hint: "dotAll" },
  { key: "u", label: "u", hint: "unicode" },
  { key: "y", label: "y", hint: "sticky" },
];

const SAMPLE_TEXT = `Contact us at hello@example.com or support@toolbox.dev.
Call (415) 555-0132 or (212) 555-0198 during business hours.
Order #A1023 shipped on 2026-03-14, order #B2044 shipped on 2026-04-02.`;

interface Segment {
  text: string;
  matched: boolean;
  key: string;
}

interface MatchInfo {
  index: number;
  text: string;
  groups: { label: string; value: string | undefined }[];
}

export function Regex() {
  const ready = useRevealReady();
  const [pattern, setPattern] = useState<string>(
    "[\\w.+-]+@[\\w-]+\\.[\\w.-]+|\\(\\d{3}\\)\\s?\\d{3}-\\d{4}|#(?<code>[A-Z]\\d+)"
  );
  const [flags, setFlags] = useState<string>("g");
  const [testString, setTestString] = useState<string>(SAMPLE_TEXT);

  function toggleFlag(flag: string) {
    setFlags((prev) =>
      prev.includes(flag)
        ? prev.replace(flag, "")
        : [...prev.split(""), flag].sort().join("")
    );
  }

  const { regex, error } = useMemo(() => {
    if (pattern === "") {
      return { regex: null as RegExp | null, error: null as string | null };
    }
    try {
      return { regex: new RegExp(pattern, flags), error: null as string | null };
    } catch (e) {
      return {
        regex: null as RegExp | null,
        error: e instanceof Error ? e.message : "Invalid regular expression",
      };
    }
  }, [pattern, flags]);

  const { segments, matches } = useMemo(() => {
    const emptySegments: Segment[] = testString
      ? [{ text: testString, matched: false, key: "s0" }]
      : [];

    if (!regex) {
      return { segments: emptySegments, matches: [] as MatchInfo[] };
    }

    const isGlobal = flags.includes("g") || flags.includes("y");
    const found: MatchInfo[] = [];
    const ranges: { start: number; end: number }[] = [];

    try {
      if (isGlobal) {
        const iterRegex = new RegExp(regex.source, flags.includes("g") ? flags : `${flags}g`);
        for (const m of testString.matchAll(iterRegex)) {
          if (m.index === undefined) continue;
          found.push(buildMatchInfo(m));
          ranges.push({ start: m.index, end: m.index + m[0].length });
        }
      } else {
        const m = regex.exec(testString);
        if (m && m.index !== undefined) {
          found.push(buildMatchInfo(m));
          ranges.push({ start: m.index, end: m.index + m[0].length });
        }
      }
    } catch {
      return {
        segments: emptySegments,
        matches: [] as MatchInfo[],
      };
    }

    if (ranges.length === 0) {
      return { segments: emptySegments, matches: found };
    }

    const segs: Segment[] = [];
    let cursor = 0;
    ranges.forEach((r, i) => {
      if (r.start > cursor) {
        segs.push({
          text: testString.slice(cursor, r.start),
          matched: false,
          key: `u${i}`,
        });
      }
      if (r.end > r.start) {
        segs.push({
          text: testString.slice(r.start, r.end),
          matched: true,
          key: `m${i}`,
        });
      }
      cursor = Math.max(cursor, r.end);
    });
    if (cursor < testString.length) {
      segs.push({ text: testString.slice(cursor), matched: false, key: "uend" });
    }

    return { segments: segs, matches: found };
  }, [regex, testString, flags]);

  return (
    <Frame wide>
      <SectionHeading title="Regex Tester" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.controls} variants={revealItem}>
          <div className={styles.field}>
            <label htmlFor="pattern">Pattern</label>
            <div className={styles.patternRow}>
              <span className={styles.slash}>/</span>
              <input
                id="pattern"
                type="text"
                className={styles.patternInput}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="pattern"
                spellCheck={false}
              />
              <span className={styles.slash}>/{flags}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label>Flags</label>
            <div className={styles.flagRow}>
              {FLAG_OPTIONS.map((f) => (
                <label
                  key={f.key}
                  className={
                    flags.includes(f.key)
                      ? `${styles.flagChip} ${styles.flagChipActive}`
                      : styles.flagChip
                  }
                  title={f.hint}
                >
                  <input
                    type="checkbox"
                    checked={flags.includes(f.key)}
                    onChange={() => toggleFlag(f.key)}
                  />
                  {f.key}
                </label>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.field}>
            <label htmlFor="testString">Test string</label>
            <textarea
              id="testString"
              className={styles.textarea}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              spellCheck={false}
              rows={8}
            />
          </div>
        </motion.div>

        <motion.div className={styles.results} variants={revealItem}>
          <div className={styles.field}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>Highlighted text</span>
            </div>
            <div className={styles.highlightBox}>
              {segments.length === 0 ? (
                <span className={styles.fgFaint}>Nothing to show yet.</span>
              ) : (
                segments.map((seg) =>
                  seg.matched ? (
                    <mark key={seg.key} className={styles.mark}>
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={seg.key}>{seg.text}</span>
                  )
                )
              )}
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>Matches</span>
              <span className={styles.countBadge}>{matches.length}</span>
            </div>
            {matches.length === 0 ? (
              <p className={styles.fgFaint}>No matches.</p>
            ) : (
              <ul className={styles.matchList}>
                {matches.map((m, i) => (
                  <li key={i} className={styles.matchItem}>
                    <div className={styles.matchHead}>
                      <span className={styles.matchIndex}>#{i}</span>
                      <span className={styles.matchAt}>at {m.index}</span>
                      <span className={styles.matchText}>{m.text}</span>
                    </div>
                    {m.groups.length > 0 && (
                      <ul className={styles.groupList}>
                        {m.groups.map((g, gi) => (
                          <li key={gi} className={styles.groupItem}>
                            <span className={styles.groupLabel}>{g.label}</span>
                            <span className={styles.groupValue}>
                              {g.value === undefined ? (
                                <em className={styles.undefinedVal}>undefined</em>
                              ) : (
                                g.value
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

function buildMatchInfo(m: RegExpExecArray): MatchInfo {
  const groups: { label: string; value: string | undefined }[] = [];
  for (let i = 1; i < m.length; i++) {
    groups.push({ label: `Group ${i}`, value: m[i] });
  }
  if (m.groups) {
    for (const [name, value] of Object.entries(m.groups)) {
      groups.push({ label: `<${name}>`, value });
    }
  }
  return {
    index: m.index,
    text: m[0],
    groups,
  };
}

export default Regex;
