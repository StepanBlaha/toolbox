import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Uuid.module.css";

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

function formatUuid(id: string, uppercase: boolean, noHyphens: boolean): string {
  let result = id;
  if (noHyphens) {
    result = result.replace(/-/g, "");
  }
  if (uppercase) {
    result = result.toUpperCase();
  }
  return result;
}

export function Uuid() {
  const ready = useRevealReady();
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [noHyphens, setNoHyphens] = useState<boolean>(false);
  const [rawIds, setRawIds] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  function generate() {
    const next: string[] = [];
    for (let i = 0; i < count; i++) {
      next.push(generateUuidV4());
    }
    setRawIds(next);
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const ids = rawIds.map((id) => formatUuid(id, uppercase, noHyphens));

  function handleCountChange(value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(50, Math.max(1, Math.floor(parsed)));
    setCount(clamped);
  }

  async function copyOne(index: number) {
    await navigator.clipboard.writeText(ids[index]);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(ids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="UUID Generator" count={ids.length} />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.controls} variants={revealItem}>
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
                onChange={(e) => handleCountChange(e.target.value)}
              />
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              Uppercase
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={noHyphens}
                onChange={(e) => setNoHyphens(e.target.checked)}
              />
              Remove hyphens
            </label>

            <button type="button" className={styles.generateBtn} onClick={generate}>
              <RefreshCw size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              Generate
            </button>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHead}>
              <span className={styles.outputLabel}>Output</span>
              <button
                type="button"
                className={clsx(styles.copyBtn, copiedAll && styles.copied)}
                onClick={copyAll}
              >
                {copiedAll ? <Check size={13} /> : <Copy size={13} />}
                {copiedAll ? "Copied" : "Copy all"}
              </button>
            </div>

            <ul className={styles.list}>
              {ids.map((id, idx) => (
                <li className={styles.listItem} key={`${id}-${idx}`}>
                  <span className={styles.uuidText}>{id}</span>
                  <button
                    type="button"
                    className={clsx(styles.copyBtn, copiedIndex === idx && styles.copied)}
                    onClick={() => copyOne(idx)}
                  >
                    {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                    {copiedIndex === idx ? "Copied" : "Copy"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Uuid;
