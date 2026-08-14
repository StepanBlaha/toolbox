import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Frame } from "../../components/Frame/Frame";
import { SectionHeading } from "../../components/SectionHeading/SectionHeading";
import { revealProps, revealItem } from "../../lib/reveal";
import { useRevealReady } from "../../context/RevealReadyContext";
import styles from "./Hash.module.css";

type Algo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGOS: Algo[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function Hash() {
  const ready = useRevealReady();
  const [text, setText] = useState("");
  const [digests, setDigests] = useState<Record<Algo, string>>({
    "SHA-1": "",
    "SHA-256": "",
    "SHA-384": "",
    "SHA-512": "",
  });
  const [copied, setCopied] = useState<Algo | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!text) {
      setDigests({ "SHA-1": "", "SHA-256": "", "SHA-384": "", "SHA-512": "" });
      return;
    }

    async function compute() {
      const data = new TextEncoder().encode(text);
      const results = await Promise.all(
        ALGOS.map(async (algo) => {
          const buffer = await crypto.subtle.digest(algo, data);
          return [algo, bufferToHex(buffer)] as const;
        })
      );
      if (cancelled) return;
      setDigests(Object.fromEntries(results) as Record<Algo, string>);
    }

    compute();

    return () => {
      cancelled = true;
    };
  }, [text]);

  async function copy(algo: Algo, value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(algo);
    setTimeout(() => setCopied((c) => (c === algo ? null : c)), 1500);
  }

  return (
    <Frame wide>
      <SectionHeading title="Hash Generator" />

      <motion.div className={styles.layout} {...revealProps(ready)}>
        <motion.div className={styles.inputPanel} variants={revealItem}>
          <label htmlFor="hash-input" className={styles.label}>
            Input text
          </label>
          <textarea
            id="hash-input"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text to hash..."
            spellCheck={false}
          />
        </motion.div>

        <motion.div className={styles.outputPanel} variants={revealItem}>
          {ALGOS.map((algo) => (
            <div className={styles.row} key={algo}>
              <div className={styles.rowHead}>
                <span className={styles.algoLabel}>{algo}</span>
                <button
                  type="button"
                  className={clsx(
                    styles.copyBtn,
                    copied === algo && styles.copied
                  )}
                  onClick={() => copy(algo, digests[algo])}
                  disabled={!digests[algo]}
                >
                  {copied === algo ? (
                    <Check size={13} />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied === algo ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className={styles.pre}>{digests[algo] || "-"}</pre>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </Frame>
  );
}

export default Hash;
